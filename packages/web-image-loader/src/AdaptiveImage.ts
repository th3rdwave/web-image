import { AdaptativeImageData, AdaptativeImageSource } from './Types';

export class AdaptiveImage {
  protected data: AdaptativeImageData;

  constructor(data: AdaptativeImageData) {
    this.data = data;
  }

  get uri(): string {
    return this.data.uri;
  }

  get width(): number {
    return this.data.width;
  }

  get height(): number {
    return this.data.height;
  }

  get sources(): AdaptativeImageSource[] | undefined {
    return this.data.sources;
  }

  toString(): string {
    return this.uri;
  }
}
