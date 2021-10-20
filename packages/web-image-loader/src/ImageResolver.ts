import { stat, readFile } from 'fs';
import { getType } from 'mime';
import path from 'path';
import { promisify } from 'util';
import { ResolvedImageSource } from './Types';
import { convertToWebp, convertToAvif } from './Converter';

const statAsync = promisify(stat);
const readFileAsync = promisify(readFile);

interface ParsedPath {
  dir: string;
  name: string;
  scale: number;
  ext: string;
}

export function parsePath(resourcePath: string): ParsedPath {
  // https://regexr.com/54acj
  const match = resourcePath.match(
    /^(?:(.*)[\\/])?([^\\/]+?)(?:@([0-9])x)?\.(.+)$/,
  );
  if (!match || !match[2] || !match[4]) {
    throw new Error(`Unable to parse resource ${resourcePath}.`);
  }
  return {
    dir: match[1] ?? '',
    name: match[2],
    scale: match[3] != null ? parseFloat(match[3]) : 1,
    ext: match[4],
  };
}

export async function resolveImage(
  resourcePath: string,
  resourceContent: Buffer,
  scales: number[],
): Promise<ResolvedImageSource[]> {
  const fileData = parsePath(resourcePath);
  const type = getType(fileData.ext);
  if (type == null) {
    throw new Error(`Unable to parse mime type for ${resourcePath}.`);
  }
  const generateModernFormats = type === 'image/png' || type === 'image/jpeg';
  const result: ResolvedImageSource[] = [];

  const getFilePath = (scale: number): string => {
    const suffix = scale === 1 ? '' : `@${scale}x`;
    return path.join(fileData.dir, `${fileData.name}${suffix}.${fileData.ext}`);
  };

  const addFile = async (scale: number, content: Buffer): Promise<void> => {
    const filePath = getFilePath(scale);
    result.push({ uri: filePath, content, scale, type });
    if (generateModernFormats) {
      const [webpContent, avifContent] = await Promise.all([
        convertToWebp(content),
        convertToAvif(content),
      ]);
      result.push({
        uri: filePath.replace(/\.png|\.jpe?g/, '.avif'),
        content: avifContent,
        scale,
        type: 'image/avif',
      });
      result.push({
        uri: filePath.replace(/\.png|\.jpe?g/, '.webp'),
        content: webpContent,
        scale,
        type: 'image/webp',
      });
    }
  };

  // Original file will be passed as `resourceContent`.
  await addFile(fileData.scale, resourceContent);

  // Find other files available for scales.
  const missingScales = scales.filter((s) => s !== fileData.scale);
  for (const scale of missingScales) {
    try {
      const filePath = getFilePath(scale);
      const stats = await statAsync(filePath);
      if (stats.isFile()) {
        const content = await readFileAsync(filePath);
        await addFile(scale, content);
      }
    } catch (e) {
      // Do nothing
    }
  }

  return result;
}
