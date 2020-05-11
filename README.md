# Web Image

[![CI](https://github.com/th3rdwave/web-image/workflows/CI/badge.svg)](https://github.com/th3rdwave/web-image/actions?query=workflow%3ACI) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

## Install

npm install @th3rdwave/web-image @th3rdwave/web-image-loader

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
```

In your app

```js
import { Image } from '@th3rdwave/web-image';

<Image source={require('../image/img.png')} />
```
