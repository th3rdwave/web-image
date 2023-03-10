import loaderUtils from 'loader-utils';
import path from 'path';
import { validate } from 'schema-utils';
import { loader } from 'webpack';
import { resolveImage } from './ImageResolver';
import { createImageWrapper } from './ImageWrapper';
import schema from './options';
import { ResolvedImageSource, WebpackResolvedImage } from './Types';

const DEFAULT_IMAGE_CLASS_PATH = require.resolve('./AdaptiveImage');
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
  formats?: {
    avif?: boolean;
    webp?: boolean;
  };
}

function emitAndResolveImage(
  context: loader.LoaderContext,
  options: Options,
  file: ResolvedImageSource,
  content: Buffer,
): WebpackResolvedImage {
  const nameFormat = options.name ?? DEFAULT_IMAGE_NAME_FORMAT;
  let fileName = interpolateName(context, nameFormat, content, file.scale);
  if (file.type === 'image/webp') {
    fileName = fileName.replace(/\.png|\.jpe?g/, '.webp');
  }
  if (file.type === 'image/avif') {
    fileName = fileName.replace(/\.png|\.jpe?g/, '.avif');
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

  context.emitFile(outputPath, content, null);

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

  const options = loaderUtils.getOptions(this) as Options;

  validate(schema, options, {
    name: 'React Native Web Image Loader',
    baseDataPath: 'options',
  });

  const esModule =
    typeof options.esModule !== 'undefined' ? options.esModule : false;
  const scalings = options.scalings ?? DEFAULT_SCALINGS;
  const formats = {
    avif: options.formats?.avif ?? true,
    webp: options.formats?.webp ?? true,
  };
  const wrapImage = createImageWrapper(
    loaderUtils.stringifyRequest(
      this,
      options.imageClassPath || DEFAULT_IMAGE_CLASS_PATH,
    ),
    esModule,
  );

  try {
    const resolvedImages: WebpackResolvedImage[] = [];
    const size = await resolveImage(
      this.resourcePath,
      content,
      scalings,
      formats,
      (file, fileContent) => {
        resolvedImages.push(
          emitAndResolveImage(this, options, file, fileContent),
        );
      },
    );

    const result = wrapImage(size, resolvedImages);
    callback(null, result);
  } catch (e) {
    callback(e as Error);
  }
}

resolve.raw = true;
