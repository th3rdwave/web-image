import mockFs from 'mock-fs';

import { parsePath, resolveImage } from '../ImageResolver';

jest.mock('../Converter');

const SCALES = [1, 2, 3];
const BUFFER = Buffer.from([0]);

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
      expect(await resolveImage('/some/url/image.png', BUFFER, SCALES))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "content": Object {
              "data": Array [
                0,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/png",
            "uri": "/some/url/image.png",
          },
          Object {
            "content": Object {
              "data": Array [
                9,
                0,
                0,
                0,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/avif",
            "uri": "/some/url/image.avif",
          },
          Object {
            "content": Object {
              "data": Array [
                1,
                3,
                3,
                7,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/webp",
            "uri": "/some/url/image.webp",
          },
          Object {
            "content": Object {
              "data": Array [
                50,
              ],
              "type": "Buffer",
            },
            "scale": 2,
            "type": "image/png",
            "uri": "/some/url/image@2x.png",
          },
          Object {
            "content": Object {
              "data": Array [
                9,
                0,
                0,
                0,
              ],
              "type": "Buffer",
            },
            "scale": 2,
            "type": "image/avif",
            "uri": "/some/url/image@2x.avif",
          },
          Object {
            "content": Object {
              "data": Array [
                1,
                3,
                3,
                7,
              ],
              "type": "Buffer",
            },
            "scale": 2,
            "type": "image/webp",
            "uri": "/some/url/image@2x.webp",
          },
          Object {
            "content": Object {
              "data": Array [
                51,
              ],
              "type": "Buffer",
            },
            "scale": 3,
            "type": "image/png",
            "uri": "/some/url/image@3x.png",
          },
          Object {
            "content": Object {
              "data": Array [
                9,
                0,
                0,
                0,
              ],
              "type": "Buffer",
            },
            "scale": 3,
            "type": "image/avif",
            "uri": "/some/url/image@3x.avif",
          },
          Object {
            "content": Object {
              "data": Array [
                1,
                3,
                3,
                7,
              ],
              "type": "Buffer",
            },
            "scale": 3,
            "type": "image/webp",
            "uri": "/some/url/image@3x.webp",
          },
        ]
      `);
    });

    it('resolves images without modern formats support', async () => {
      expect(await resolveImage('/some/url/anim.gif', BUFFER, SCALES))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "content": Object {
              "data": Array [
                0,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/gif",
            "uri": "/some/url/anim.gif",
          },
          Object {
            "content": Object {
              "data": Array [
                54,
              ],
              "type": "Buffer",
            },
            "scale": 2,
            "type": "image/gif",
            "uri": "/some/url/anim@2x.gif",
          },
          Object {
            "content": Object {
              "data": Array [
                55,
              ],
              "type": "Buffer",
            },
            "scale": 3,
            "type": "image/gif",
            "uri": "/some/url/anim@3x.gif",
          },
        ]
      `);
    });

    it('resolves images with missing scales', async () => {
      expect(await resolveImage('/some/url/lonely.png', BUFFER, SCALES))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "content": Object {
              "data": Array [
                0,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/png",
            "uri": "/some/url/lonely.png",
          },
          Object {
            "content": Object {
              "data": Array [
                9,
                0,
                0,
                0,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/avif",
            "uri": "/some/url/lonely.avif",
          },
          Object {
            "content": Object {
              "data": Array [
                1,
                3,
                3,
                7,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/webp",
            "uri": "/some/url/lonely.webp",
          },
        ]
      `);
    });

    it('resolves images with scale suffix', async () => {
      expect(await resolveImage('/some/url/weird@2x.png', BUFFER, SCALES))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "content": Object {
              "data": Array [
                0,
              ],
              "type": "Buffer",
            },
            "scale": 2,
            "type": "image/png",
            "uri": "/some/url/weird@2x.png",
          },
          Object {
            "content": Object {
              "data": Array [
                9,
                0,
                0,
                0,
              ],
              "type": "Buffer",
            },
            "scale": 2,
            "type": "image/avif",
            "uri": "/some/url/weird@2x.avif",
          },
          Object {
            "content": Object {
              "data": Array [
                1,
                3,
                3,
                7,
              ],
              "type": "Buffer",
            },
            "scale": 2,
            "type": "image/webp",
            "uri": "/some/url/weird@2x.webp",
          },
        ]
      `);
    });

    it('ignores images outside of passed scales', async () => {
      expect(await resolveImage('/some/url/wow.png', BUFFER, SCALES))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "content": Object {
              "data": Array [
                0,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/png",
            "uri": "/some/url/wow.png",
          },
          Object {
            "content": Object {
              "data": Array [
                9,
                0,
                0,
                0,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/avif",
            "uri": "/some/url/wow.avif",
          },
          Object {
            "content": Object {
              "data": Array [
                1,
                3,
                3,
                7,
              ],
              "type": "Buffer",
            },
            "scale": 1,
            "type": "image/webp",
            "uri": "/some/url/wow.webp",
          },
        ]
      `);
    });
  });
});
