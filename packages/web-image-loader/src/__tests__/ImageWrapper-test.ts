import { parse } from '@babel/parser';
import { createImageWrapper } from '../ImageWrapper';
import { WebpackResolvedImage } from '../Types';

const IMAGE_WRAPPER_PATH =
  '"../../node_modules/@th3rdwave/web-image-loader/lib/commonjs/AdaptiveImage"';

const IMAGE_SIZE = { width: 100, height: 100 };

const createImages = (image: string): WebpackResolvedImage[] =>
  Array.from({ length: 3 }).map((_, i) => {
    const [name, ext] = image.split('.');
    return {
      publicPath: `__webpack_public_path__ + "static/${name}@${i + 1}x.${ext}"`,
      outputPath: image,
      scale: i + 1,
      type: `image/${ext}`,
    };
  });

describe('ImageWrapper', () => {
  it('generates valid javascript', () => {
    const imageWrapper = createImageWrapper(IMAGE_WRAPPER_PATH, true);
    const code = imageWrapper(IMAGE_SIZE, [
      ...createImages('img.png'),
      ...createImages('img.webp'),
    ]);
    expect(parse(code, { sourceType: 'module' })).toEqual(expect.any(Object));
  });

  it('generates es modules source', () => {
    const imageWrapper = createImageWrapper(IMAGE_WRAPPER_PATH, true);
    expect(imageWrapper(IMAGE_SIZE, createImages('img.png'))).toMatchSnapshot();
  });

  it('generates commonjs source', () => {
    const imageWrapper = createImageWrapper(IMAGE_WRAPPER_PATH, false);
    expect(imageWrapper(IMAGE_SIZE, createImages('img.png'))).toMatchSnapshot();
  });

  it('handles multiple sources', () => {
    const imageWrapper = createImageWrapper(IMAGE_WRAPPER_PATH, true);
    expect(
      imageWrapper(IMAGE_SIZE, [
        ...createImages('img.png'),
        ...createImages('img.webp'),
      ]),
    ).toMatchSnapshot();
  });
});
