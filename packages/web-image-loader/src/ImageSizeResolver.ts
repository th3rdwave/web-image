import { imageSize as baseImageSize } from 'image-size';

export interface Size {
  width: number;
  height: number;
}

export function imageSize(buffer: Buffer, scale: number): Size {
  const size = baseImageSize(buffer) as Size;
  if (scale !== 1) {
    return { width: size.width / scale, height: size.height / scale };
  } else {
    return size;
  }
}
