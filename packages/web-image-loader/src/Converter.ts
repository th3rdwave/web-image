import sharp from 'sharp';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import findCacheDir from 'find-cache-dir';

const hashCache = new WeakMap();

sharp.cache(false);

function hashBuffer(data: Buffer) {
  const cached = hashCache.get(data);
  if (cached != null) {
    return cached;
  }
  const result = crypto
    .createHash('md4')
    .update(data)
    .digest('base64url' as any);
  hashCache.set(data, result);
  return result;
}

class FsCache {
  _path: string | undefined;

  constructor() {
    this._path = findCacheDir({ name: 'web-image-loader', create: true });
  }

  async get(key: string): Promise<Buffer | null> {
    if (this._path == null) {
      return null;
    }
    try {
      return await fs.promises.readFile(path.join(this._path, key));
    } catch (ex) {
      return null;
    }
  }

  async set(key: string, value: Buffer): Promise<void> {
    if (this._path == null) {
      return;
    }
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
