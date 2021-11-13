import type { Size } from '../ImageSizeResolver';

export function imageSize(buffer: Buffer, scale: number): Size {
  return { width: buffer.length / scale, height: buffer.length / scale };
}
