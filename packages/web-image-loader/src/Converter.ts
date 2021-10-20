import sharp from 'sharp';

export async function convertToWebp(image: Buffer): Promise<Buffer> {
  return await sharp(image).webp({ quality: 70 }).toBuffer();
}

export async function convertToAvif(image: Buffer): Promise<Buffer> {
  return await sharp(image).avif({ quality: 55, speed: 5 }).toBuffer();
}
