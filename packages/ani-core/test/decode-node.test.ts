import jpegjs from "jpeg-js";
import { GifWriter } from "omggif";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { decodeImageNode } from "../src/decode/node.js";

function makeTestRGBA(width: number, height: number): Buffer {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = 200;
    data[i * 4 + 1] = 60;
    data[i * 4 + 2] = 30;
    data[i * 4 + 3] = 255;
  }
  return data;
}

describe("decodeImageNode", () => {
  it("decodes a PNG losslessly", () => {
    const width = 4;
    const height = 3;
    const png = new PNG({ width, height });
    png.data = makeTestRGBA(width, height);
    const encoded = PNG.sync.write(png);

    const decoded = decodeImageNode(new Uint8Array(encoded));
    expect(decoded.width).toBe(width);
    expect(decoded.height).toBe(height);
    expect(decoded.data[0]).toBe(200);
    expect(decoded.data[1]).toBe(60);
    expect(decoded.data[2]).toBe(30);
    expect(decoded.data[3]).toBe(255);
  });

  it("decodes a JPEG (lossy, so only approximately)", () => {
    const width = 8;
    const height = 8;
    const data = makeTestRGBA(width, height);
    const encoded = jpegjs.encode({ width, height, data }, 90);

    const decoded = decodeImageNode(new Uint8Array(encoded.data));
    expect(decoded.width).toBe(width);
    expect(decoded.height).toBe(height);
    expect(decoded.data[0]).toBeGreaterThan(150);
    expect(decoded.data[1]).toBeLessThan(120);
  });

  it("throws a clear error for GIF input (use extractGifFrames instead)", () => {
    const buf = new Uint8Array(64);
    const gw = new GifWriter(buf, 1, 1, { palette: [0x000000, 0xffffff] });
    gw.addFrame(0, 0, 1, 1, [0]);
    const len = gw.end();
    expect(() => decodeImageNode(buf.slice(0, len))).toThrow(/extractGifFrames/);
  });

  it("throws on unrecognized bytes", () => {
    expect(() => decodeImageNode(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toThrow();
  });
});
