import loaderUtils from 'loader-utils';
import path from 'path';
import validateSchema from 'schema-utils';
import { loader } from 'webpack';
import { resolveImage } from './ImageResolver';
import { imageSize } from './ImageSizeResolver';
import { createImageWrapper } from './ImageWrapper';
import schema from './options';
import { ResolvedImageSource, WebpackResolvedImage } from './Types';

const DEFAULT_IMAGE_CLASS_PATH = require.resolve('./modules/AdaptiveImage');
const DEFAULT_IMAGE_NAME_FORMAT = '[hash][scale].[ext]';
const DEFAULT_SCALINGS = [1, 2, 3];

function interpolateName(
  context: loader.LoaderContext,
  nameFormat: string,
  content: Buffer,
  scale: number,
): string {
  return loaderUtils
    .interpolateName(context, nameFormat, {
      context: context.context,
      content,
    })
    .replace(/\[scale\]/g, scale === 1 ? '' : `@${scale}x`);
}

interface Options {
  scalings?: number[];
  esModule?: boolean;
  name?: string;
  imageClassPath?: string;
  outputPath?: string;
  publicPath?: string | ((url: string, res: string) => string);
}

async function emitAndResolveImage(
  context: loader.LoaderContext,
  options: Options,
  file: ResolvedImageSource,
): Promise<WebpackResolvedImage> {
  const nameFormat = options.name ?? DEFAULT_IMAGE_NAME_FORMAT;
  let fileName = interpolateName(context, nameFormat, file.content, file.scale);
  if (file.type === 'image/webp') {
    fileName = fileName.replace(/\.png|\.jpe?g/, '.webp');
  }

  let outputPath = fileName;
  if (options.outputPath) {
    outputPath = path.posix.join(options.outputPath, fileName);
  }

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;
  if (options.publicPath) {
    if (typeof options.publicPath === 'function') {
      publicPath = options.publicPath(fileName, file.uri);
    } else {
      publicPath = `${
        options.publicPath.endsWith('/')
          ? options.publicPath
          : `${options.publicPath}/`
      }${fileName}`;
    }

    publicPath = JSON.stringify(publicPath);
  }

  context.emitFile(outputPath, file.content, null);

  return {
    outputPath,
    publicPath,
    type: file.type,
    scale: file.scale,
  };
}

export default async function resolve(
  this: loader.LoaderContext,
  content: Buffer,
): Promise<void> {
  const callback = this.async()!;
  // if (this.cacheable) this.cacheable() // TODO

  const options = loaderUtils.getOptions(this) as Options;

  validateSchema(schema, options, {
    name: 'React Native Web Image Loader',
    baseDataPath: 'options',
  });

  const esModule =
    typeof options.esModule !== 'undefined' ? options.esModule : true;
  const scalings = options.scalings ?? DEFAULT_SCALINGS;
  const wrapImage = createImageWrapper(
    loaderUtils.stringifyRequest(
      this,
      options.imageClassPath || DEFAULT_IMAGE_CLASS_PATH,
    ),
    esModule,
  );

  try {
    const resolvedFiles = await resolveImage(
      this.resourcePath,
      content,
      scalings,
    );
    const images = await Promise.all(
      resolvedFiles.map(async (file) => {
        return await emitAndResolveImage(this, options, file);
      }),
    );

    // It is possible that we don't have @1x image so normalize using scale.
    const firstFile = resolvedFiles[0];
    const size = imageSize(firstFile.content, firstFile.scale);

    const result = wrapImage(size, images);
    callback(null, result);
  } catch (e) {
    callback(e);
  }
}

export const raw = true;
