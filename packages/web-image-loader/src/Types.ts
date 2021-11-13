export interface ResolvedImageSource {
  /**
   * Density scale for this image (1x, 2x, 3x)
   */
  scale: number;
  /**
   * Final uri for the image.
   */
  uri: string;
  /**
   * Mime type
   */
  type: string;
}

export interface WebpackResolvedImage {
  outputPath: string;
  publicPath: string;
  /**
   * Density scale for this image (1x, 2x, 3x)
   */
  scale: number;
  /**
   * Mime type
   */
  type: string;
}

export interface AdaptativeImageSource {
  /**
   * srcset string (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-srcset)
   */
  srcSet: string;
  /**
   * Mime type
   */
  type: string;
}

export interface AdaptativeImageData {
  width: number;
  height: number;
  uri: string;
  sources?: AdaptativeImageSource[];
}
