import groupBy from 'lodash/groupBy';
import { WebpackResolvedImage } from './Types';

const SORT = ['image/webp', 'image/avif'];

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
      .sort((a, b) => {
        const ia = SORT.indexOf(a[0].type);
        const ib = SORT.indexOf(b[0].type);
        return ib - ia;
      })
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
