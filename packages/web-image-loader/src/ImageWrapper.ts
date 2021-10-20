import groupBy from 'lodash/groupBy';
import { WebpackResolvedImage } from './Types';

export function createImageWrapper(classPath: string, esModule: boolean) {
  return (
    size: { width: number; height: number },
    images: WebpackResolvedImage[],
  ): string => {
    const imagesByType = groupBy(images, (img) => img.type);
    // Template strings are a bit weird here but this is the price
    // to pay to make the generated code beautiful :S
    const sources = `[
    ${Object.values(imagesByType)
      // Make sure avif then webp comes first.
      .sort((a) =>
        a[0].type === 'image/avif' ? -1 : a[0].type === 'image/webp' ? -1 : 1,
      )
      .map(
        (group) => `{
      srcSet: ${group
        .map((img) => `${img.publicPath} + " ${img.scale}x"`)
        .join(' + "," +\n        ')},
      type: "${group[0].type}"
    }`,
      )
      .join(',\n    ')}
  ]`;

    return `${
      esModule
        ? `import {AdaptiveImage} from ${classPath}`
        : `var AdaptiveImage = require(${classPath}).AdaptiveImage`
    };

${esModule ? 'export default' : 'module.exports ='} new AdaptiveImage({
  uri: ${images[0].publicPath},
  width: ${size.width},
  height: ${size.height},
  sources: ${sources}
});
`;
  };
}
