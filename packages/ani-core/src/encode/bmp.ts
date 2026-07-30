import { BinaryWriter } from "./binary-writer.js";
import type { RGBAImage } from "../types.js";

const BITMAPINFOHEADER_SIZE = 40;

function andMaskRowStride(width: number): number {
  // 1bpp, rows padded up to a multiple of 4 bytes.
  return Math.ceil(Math.ceil(width / 8) / 4) * 4;
}

/**
 * Encodes a single resized RGBA image as an ICO/CUR "DIB" entry: a
 * BITMAPINFOHEADER followed by a bottom-up 32bpp BGRA XOR mask and a
 * bottom-up 1bpp AND mask, per the ICO/CUR file format.
 */
export function encodeDib(image: RGBAImage): Uint8Array {
  const { width, height, data } = image;
  const xorStride = width * 4; // always a multiple of 4 at 32bpp
  const andStride = andMaskRowStride(width);
  const xorSize = xorStride * height;
  const andSize = andStride * height;

  const w = new BinaryWriter();

  // BITMAPINFOHEADER
  w.u32(BITMAPINFOHEADER_SIZE);
  w.u32(width);
  w.u32(height * 2); // covers stacked XOR + AND regions
  w.u16(1); // biPlanes
  w.u16(32); // biBitCount
  w.u32(0); // biCompression = BI_RGB
  w.u32(xorSize + andSize); // biSizeImage
  w.u32(0); // biXPelsPerMeter
  w.u32(0); // biYPelsPerMeter
  w.u32(0); // biClrUsed
  w.u32(0); // biClrImportant

  // XOR mask: 32bpp BGRA, bottom-up rows.
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const a = data[i + 3]!;
      w.u8(b).u8(g).u8(r).u8(a);
    }
  }

  // AND mask: 1bpp, bit=1 where fully transparent, bit=0 elsewhere, bottom-up rows.
  for (let y = height - 1; y >= 0; y--) {
    const rowBits = new Uint8Array(andStride);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3]!;
      if (a === 0) {
        const byteIndex = x >> 3;
        const bitIndex = 7 - (x & 7);
        rowBits[byteIndex]! |= 1 << bitIndex;
      }
    }
    w.bytes(rowBits);
  }

  return w.toUint8Array();
}
