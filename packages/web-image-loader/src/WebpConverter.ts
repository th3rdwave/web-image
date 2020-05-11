import imageminWebp from 'imagemin-webp';
import imagemin from 'imagemin';

export async function convertToWebp(image: Buffer): Promise<Buffer> {
  return await imagemin.buffer(image, {
    // TODO: Customize this
    plugins: [imageminWebp({ quality: 70, lossless: false })],
  });
}
