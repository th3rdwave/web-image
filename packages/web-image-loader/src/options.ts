import { JSONSchema7 } from 'json-schema';

const schema: JSONSchema7 = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      description: 'The filename template for the target file(s).',
      type: 'string',
    },
    imageClassPath: {
      description:
        'The path of image class that should be used instead of built-in AdaptiveImage.',
      type: 'string',
    },
    scalings: {
      description:
        'An object where the keys are the possible filename suffixes and values are the amount of scale',
      type: 'object',
    },
    publicPath: {
      description: 'A custom public path for the target file(s).',
      anyOf: [
        {
          type: 'string',
        },
        {
          // @ts-ignore
          instanceof: 'Function',
        },
      ],
    },
    outputPath: {
      description: 'A filesystem path where the target file(s) will be placed.',
      type: 'string',
    },
    esModule: {
      description:
        'By default, react-native-web-image-loader generates JS modules that use the ES modules syntax.',
      type: 'boolean',
    },
    formats: {
      description: 'Formats to generate.',
      type: 'object',
    },
  },
};

export default schema;
