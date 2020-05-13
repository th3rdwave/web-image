# Web Image

[![CI](https://github.com/th3rdwave/web-image/workflows/CI/badge.svg)](https://github.com/th3rdwave/web-image/actions?query=workflow%3ACI) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

SSR friendly image component that renders to a `<picture>` element with screen density and webp support while keeping the same api as React Native `<Image />`.

## Features

- Same API and behavior as the react-native Image component.
- Uses modern browser features and is SSR / static website friendly.
- Lazy loading using the html `loading="lazy"` attritute (https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading).
- Automatic webp file generation and loading for supported browsers.
- Density support using the same file naming convention as react-native.
- Automatic image dimensions for local assets.

## Install

```sh
npm install @th3rdwave/web-image @th3rdwave/web-image-loader
```

## Usage

### Local images

In your webpack config:

```js
{
  ...
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/,
        loader: '@th3rdwave/web-image-loader',
      },
    ]
  }
}
```

In your app:

```js
import { Image } from '@th3rdwave/web-image';

<Image source={require('../image/img.png')} />
```

### Network images

This image component can also be used with network image. To support multiple formats and densities you must build an object to use as the source prop. 

```ts
type Source = {
  /**
   * Default url to use for the image.
   */
  uri: string,
  /**
   * Responsive image sources.
   */
  sources?: Array<{
    /**
     * Mime type for this source.
     */
    type: string,
    /**
     * [srcset](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-srcset) for this source type.
     */
    srcSet: string,
  }>,
}
```

Example:

```js
<Image
  source={{
    sources: [{
      srcSet: 'https://cdn.th3rdwave.coffee/merchants/rJvse_3Nz/rJvse_3Nz-sm_1x.webp 1x, https://cdn.th3rdwave.coffee/merchants/rJvse_3Nz/rJvse_3Nz-sm_2x.webp 2x, https://cdn.th3rdwave.coffee/merchants/rJvse_3Nz/rJvse_3Nz-sm_3x.webp 3x',
      type: 'image/webp',
    }, {
      srcSet: 'https://cdn.th3rdwave.coffee/merchants/rJvse_3Nz/rJvse_3Nz-sm_1x.jpg 1x, https://cdn.th3rdwave.coffee/merchants/rJvse_3Nz/rJvse_3Nz-sm_2x.jpg 2x, https://cdn.th3rdwave.coffee/merchants/rJvse_3Nz/rJvse_3Nz-sm_3x.jpg 3x',
      type: 'image/jpeg',
    }],
    uri: 'https://cdn.th3rdwave.coffee/merchants/rJvse_3Nz/rJvse_3Nz-sm_2x.jpg',
  }}
/>
```

## Caveats

- Curently only a small subset of Image props are implemented.

## Example

TODO

## Demo

- https://www.th3rdwave.coffee/
