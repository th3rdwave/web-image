import sharp from 'sharp';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const hashCache = new WeakMap();

function hashBuffer(data: Buffer) {
  const cached = hashCache.get(data);
  if (cached != null) {
    return cached;
  }
  const result = crypto.createHash('md4').update(data).digest('base64url');
  hashCache.set(data, result);
  return result;
}

class FsCache {
  constructor() {
    this._path = path.join(__dirname, '../..', '.cache');
    try {
      fs.mkdirSync(this._path, { recursive: true });
    } catch (ex) {}
  }

  async get(key: string) {
    try {
      return await fs.promises.readFile(path.join(this._path, key));
    } catch (ex) {
      return null;
    }
  }

  async set(key: string, value: Buffer) {
    await fs.promises.writeFile(path.join(this._path, key), value);
  }
}

const cache = new FsCache();

export async function convertToWebp(image: Buffer): Promise<Buffer> {
  const key = hashBuffer(image) + '.webp';
  const cached = await cache.get(key);
  if (cached != null) {
    return cached;
  }
  const result = await sharp(image)
    .webp({
      quality: 70,
    })
    .toBuffer();

  await cache.set(key, result);
  return result;
}

export async function convertToAvif(image: Buffer): Promise<Buffer> {
  const key = hashBuffer(image) + '.avif';
  const cached = await cache.get(key);
  if (cached != null) {
    return cached;
  }
  const result = await sharp(image)
    .avif({
      quality: 55,
      speed: 7,
    })
    .toBuffer();

  await cache.set(key, result);
  return result;
}
