import mockFs from 'mock-fs';

import { parsePath, resolveImage } from '../ImageResolver';

jest.mock('../Converter').mock('../ImageSizeResolver');

const SCALES = [1, 2, 3];
const FORMATS = { avif: true, webp: true };
const BUFFER = Buffer.from([1, 3, 3, 7]);

describe('ImageResolver', () => {
  describe('parsePath', () => {
    it('handles paths with no scale', () => {
      expect(parsePath('/some/url/image.png')).toMatchInlineSnapshot(`
        Object {
          "dir": "/some/url",
          "ext": "png",
          "name": "image",
          "scale": 1,
        }
      `);
    });

    it('handles paths with scales', () => {
      expect(parsePath('/some/url/image@3x.png')).toMatchInlineSnapshot(`
        Object {
          "dir": "/some/url",
          "ext": "png",
          "name": "image",
          "scale": 3,
        }
      `);
    });

    it('handles paths with no directory', () => {
      expect(parsePath('image@3x.png')).toMatchInlineSnapshot(`
        Object {
          "dir": "",
          "ext": "png",
          "name": "image",
          "scale": 3,
        }
      `);
    });

    it('throws on invalid paths', () => {
      expect(() => parsePath('/some/url/image@3x')).toThrow();
      expect(() => parsePath('/some/url/')).toThrow();
      expect(() => parsePath('/some/url/.png')).toThrow();
      // TODO: This should probably throw.
      // expect(() => parsePath('/some/url/@2x.png')).toThrow()
    });

    it('handles windows paths', () => {
      expect(parsePath('\\some\\url\\image@3x.png')).toMatchInlineSnapshot(`
        Object {
          "dir": "\\\\some\\\\url",
          "ext": "png",
          "name": "image",
          "scale": 3,
        }
      `);
    });
  });

  describe('resolveImage', () => {
    beforeEach(() => {
      mockFs({
        '/some/url': {
          'image.png': '1',
          'image@2x.png': '2',
          'image@3x.png': '3',
          'image@4x.png': '4',
          'anim.gif': '5',
          'anim@2x.gif': '6',
          'anim@3x.gif': '7',
          'lonely.png': '8',
          'weird@2x.png': '9',
          'wow.png': '10',
          'wow@4x.png': '11',
        },
      });
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('resolves images with modern format support', async () => {
      const emitFile = jest.fn();
      const size = await resolveImage(
        '/some/url/image.png',
        BUFFER,
        SCALES,
        FORMATS,
        emitFile,
      );
      expect(size).toMatchSnapshot();
      expect(emitFile.mock.calls).toMatchSnapshot();
    });

    it('resolves images without modern formats support', async () => {
      const emitFile = jest.fn();
      const size = await resolveImage(
        '/some/url/anim.gif',
        BUFFER,
        SCALES,
        FORMATS,
        emitFile,
      );
      expect(size).toMatchSnapshot();
      expect(emitFile.mock.calls).toMatchSnapshot();
    });

    it('resolves images with missing scales', async () => {
      const emitFile = jest.fn();
      const size = await resolveImage(
        '/some/url/lonely.png',
        BUFFER,
        SCALES,
        FORMATS,
        emitFile,
      );
      expect(size).toMatchSnapshot();
      expect(emitFile.mock.calls).toMatchSnapshot();
    });

    it('resolves images with scale suffix', async () => {
      const emitFile = jest.fn();
      const size = await resolveImage(
        '/some/url/weird@2x.png',
        BUFFER,
        SCALES,
        FORMATS,
        emitFile,
      );
      expect(size).toMatchSnapshot();
      expect(emitFile.mock.calls).toMatchSnapshot();
    });

    it('ignores images outside of passed scales', async () => {
      const emitFile = jest.fn();
      const size = await resolveImage(
        '/some/url/wow.png',
        BUFFER,
        SCALES,
        FORMATS,
        emitFile,
      );
      expect(size).toMatchSnapshot();
      expect(emitFile.mock.calls).toMatchSnapshot();
    });
  });
});
