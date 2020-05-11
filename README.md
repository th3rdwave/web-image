# Web Image

[![CI](https://github.com/th3rdwave/web-image/workflows/CI/badge.svg)](https://github.com/th3rdwave/web-image/actions?query=workflow%3ACI) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

SSR friendly image component that renders to a <picture> element with screen density and webp support while keeping the same api as React Native <Image />.

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

## Caveats

- Curently only a small subset of Image props are implemented.

## Example

TODO

## Demo

- https://www.th3rdwave.coffee/
