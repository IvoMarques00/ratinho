import { describe, expect, it } from "vitest";
import { encodeDib } from "../src/encode/bmp.js";
import type { RGBAImage } from "../src/types.js";

function makeTestImage(): RGBAImage {
  // 2x2 image. Row y=0: (10,20,30,255) (100,110,120,128)
  //            Row y=1: (40,50,60,0)   (1,2,3,255)
  const data = Uint8ClampedArray.from([
    10, 20, 30, 255, 100, 110, 120, 128, // y=0
    40, 50, 60, 0, 1, 2, 3, 255, // y=1
  ]);
  return { width: 2, height: 2, data };
}

describe("encodeDib", () => {
  it("writes a BITMAPINFOHEADER with doubled height and 32bpp", () => {
    const dib = encodeDib(makeTestImage());
    const view = new DataView(dib.buffer, dib.byteOffset, dib.byteLength);
    expect(view.getUint32(0, true)).toBe(40); // biSize
    expect(view.getUint32(4, true)).toBe(2); // biWidth
    expect(view.getUint32(8, true)).toBe(4); // biHeight = 2*H
    expect(view.getUint16(12, true)).toBe(1); // biPlanes
    expect(view.getUint16(14, true)).toBe(32); // biBitCount
    expect(view.getUint32(16, true)).toBe(0); // biCompression = BI_RGB
  });

  it("has the expected total length: header + XOR + AND mask", () => {
    const dib = encodeDib(makeTestImage());
    // header 40 + xor(2*2*4=16) + and(stride 4 * 2 rows = 8)
    expect(dib.length).toBe(40 + 16 + 8);
  });

  it("writes XOR rows bottom-up in BGRA order", () => {
    const dib = encodeDib(makeTestImage());
    const xor = dib.subarray(40, 40 + 16);
    // First written row is image row y=1: (40,50,60,0) then (1,2,3,255)
    expect(Array.from(xor.subarray(0, 4))).toEqual([60, 50, 40, 0]);
    expect(Array.from(xor.subarray(4, 8))).toEqual([3, 2, 1, 255]);
    // Second written row is image row y=0: (10,20,30,255) then (100,110,120,128)
    expect(Array.from(xor.subarray(8, 12))).toEqual([30, 20, 10, 255]);
    expect(Array.from(xor.subarray(12, 16))).toEqual([120, 110, 100, 128]);
  });

  it("sets AND-mask bits only where alpha is fully transparent, bottom-up", () => {
    const dib = encodeDib(makeTestImage());
    const and = dib.subarray(40 + 16, 40 + 16 + 8);
    // Row for y=1: pixel(0,1) alpha=0 -> bit set; pixel(1,1) alpha=255 -> bit clear
    expect(and[0]).toBe(0b10000000);
    expect(and[1]).toBe(0);
    expect(and[2]).toBe(0);
    expect(and[3]).toBe(0);
    // Row for y=0: both pixels opaque/semi-opaque (nonzero alpha) -> no bits set
    expect(and[4]).toBe(0);
  });

  it("pads the AND mask row stride up to a multiple of 4 bytes", () => {
    // width=48 -> ceil(48/8)=6 bytes -> rounds up to 8
    const width = 48;
    const height = 1;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const dib = encodeDib({ width, height, data });
    const xorSize = width * 4 * height;
    const andSize = dib.length - 40 - xorSize;
    expect(andSize).toBe(8 * height);
  });

  it("pads a 1px-wide AND mask row up to 4 bytes", () => {
    const data = new Uint8ClampedArray(1 * 3 * 4).fill(0);
    const dib = encodeDib({ width: 1, height: 3, data });
    const xorSize = 1 * 4 * 3;
    const andSize = dib.length - 40 - xorSize;
    expect(andSize).toBe(4 * 3);
  });
});
