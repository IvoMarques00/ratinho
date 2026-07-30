import { BinaryWriter } from "./binary-writer.js";
import { encodeDib } from "./bmp.js";
import type { Hotspot, RGBAImage } from "../types.js";

const ICONDIR_SIZE = 6;
const ICONDIRENTRY_SIZE = 16;

function dimByte(px: number): number {
  // ICO/CUR encodes 256 as 0 in this single byte field.
  return px >= 256 ? 0 : px;
}

/**
 * Encodes one or more same-image-different-size RGBA bitmaps as a single
 * ICO (idType=1) or CUR (idType=2) file. For CUR, `hotspot` is interpreted
 * relative to `images[0]`'s dimensions and scaled proportionally for any
 * additional (larger/smaller) sizes also present in `images`.
 */
function encodeIconFamily(images: RGBAImage[], idType: 1 | 2, hotspot?: Hotspot): Uint8Array {
  if (images.length === 0) {
    throw new Error("encodeIconFamily requires at least one image");
  }

  const baseWidth = images[0]!.width;
  const dibs = images.map((img) => encodeDib(img));

  const headerSize = ICONDIR_SIZE + ICONDIRENTRY_SIZE * images.length;
  let offset = headerSize;
  const offsets: number[] = [];
  for (const dib of dibs) {
    offsets.push(offset);
    offset += dib.length;
  }

  const w = new BinaryWriter();

  // ICONDIR
  w.u16(0); // reserved
  w.u16(idType);
  w.u16(images.length);

  // ICONDIRENTRY[]
  images.forEach((img, i) => {
    w.u8(dimByte(img.width));
    w.u8(dimByte(img.height));
    w.u8(0); // bColorCount (0 = no palette, true color)
    w.u8(0); // bReserved

    if (idType === 2) {
      const scale = img.width / baseWidth;
      const hx = hotspot ? Math.round(hotspot.x * scale) : Math.floor(img.width / 2);
      const hy = hotspot ? Math.round(hotspot.y * scale) : Math.floor(img.height / 2);
      w.u16(Math.min(Math.max(hx, 0), img.width - 1));
      w.u16(Math.min(Math.max(hy, 0), img.height - 1));
    } else {
      w.u16(1); // wPlanes
      w.u16(32); // wBitCount
    }

    w.u32(dibs[i]!.length); // dwBytesInRes
    w.u32(offsets[i]!); // dwImageOffset
  });

  for (const dib of dibs) w.bytes(dib);

  return w.toUint8Array();
}

/** Encodes a CUR (animated-cursor-frame / static cursor) file. */
export function encodeCur(images: RGBAImage[], hotspot?: Hotspot): Uint8Array {
  return encodeIconFamily(images, 2, hotspot);
}

/** Encodes a regular ICO file (bonus static export, no hotspot semantics). */
export function encodeIco(images: RGBAImage[]): Uint8Array {
  return encodeIconFamily(images, 1);
}
