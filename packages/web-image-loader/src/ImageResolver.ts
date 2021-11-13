import fs from 'fs/promises';
import { getType } from 'mime';
import path from 'path';
import { convertToAvif, convertToWebp } from './Converter';
import { imageSize, Size } from './ImageSizeResolver';
import { ResolvedImageSource } from './Types';

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
  emitFileCallback: (file: ResolvedImageSource, content: Buffer) => void,
): Promise<Size> {
  const fileData = parsePath(resourcePath);
  const type = getType(fileData.ext);
  if (type == null) {
    throw new Error(`Unable to parse mime type for ${resourcePath}.`);
  }
  const generateModernFormats = type === 'image/png' || type === 'image/jpeg';

  const getFilePath = (scale: number): string => {
    const suffix = scale === 1 ? '' : `@${scale}x`;
    return path.join(fileData.dir, `${fileData.name}${suffix}.${fileData.ext}`);
  };

  const addFile = async (scale: number, content: Buffer): Promise<void> => {
    const filePath = getFilePath(scale);
    emitFileCallback({ uri: filePath, scale, type }, content);
    if (generateModernFormats) {
      emitFileCallback(
        {
          uri: filePath.replace(/\.png|\.jpe?g/, '.avif'),
          scale,
          type: 'image/avif',
        },
        await convertToAvif(content),
      );
      emitFileCallback(
        {
          uri: filePath.replace(/\.png|\.jpe?g/, '.webp'),
          scale,
          type: 'image/webp',
        },
        await convertToWebp(content),
      );
    }
  };

  // Original file will be passed as `resourceContent`.
  await addFile(fileData.scale, resourceContent);
  const size = imageSize(resourceContent, fileData.scale);

  // Find other files available for scales.
  const missingScales = scales.filter((s) => s !== fileData.scale);
  for (const scale of missingScales) {
    try {
      const filePath = getFilePath(scale);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        const content = await fs.readFile(filePath);
        await addFile(scale, content);
      }
    } catch (e) {
      // Do nothing
    }
  }

  return size;
}
