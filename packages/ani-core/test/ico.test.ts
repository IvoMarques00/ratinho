import { describe, expect, it } from "vitest";
import { encodeCur, encodeIco } from "../src/encode/ico.js";
import { parseIcon } from "./riff-parser.js";
import type { RGBAImage } from "../src/types.js";

function makeImage(width: number, height: number): RGBAImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(200) };
}

describe("encodeCur", () => {
  it("encodes idType=2 with the given hotspot", () => {
    const cur = encodeCur([makeImage(32, 32)], { x: 4, y: 6 });
    const parsed = parseIcon(cur);
    expect(parsed.idType).toBe(2);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0]!.width).toBe(32);
    expect(parsed.entries[0]!.height).toBe(32);
    expect(parsed.entries[0]!.a).toBe(4); // wXHotspot
    expect(parsed.entries[0]!.b).toBe(6); // wYHotspot
    expect(parsed.dibHeaders[0]!.biWidth).toBe(32);
    expect(parsed.dibHeaders[0]!.biHeight).toBe(64);
    expect(parsed.dibHeaders[0]!.biBitCount).toBe(32);
  });

  it("defaults the hotspot to image center when omitted", () => {
    const cur = encodeCur([makeImage(32, 32)]);
    const parsed = parseIcon(cur);
    expect(parsed.entries[0]!.a).toBe(16);
    expect(parsed.entries[0]!.b).toBe(16);
  });

  it("scales the hotspot proportionally for additional sizes", () => {
    const cur = encodeCur([makeImage(32, 32), makeImage(16, 16)], { x: 16, y: 20 });
    const parsed = parseIcon(cur);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0]!.a).toBe(16);
    expect(parsed.entries[0]!.b).toBe(20);
    // 16px is half of base 32px, so hotspot scales by 0.5
    expect(parsed.entries[1]!.a).toBe(8);
    expect(parsed.entries[1]!.b).toBe(10);
  });

  it("round-trips dwImageOffset/dwBytesInRes so entries don't overlap", () => {
    const cur = encodeCur([makeImage(32, 32), makeImage(16, 16)]);
    const parsed = parseIcon(cur);
    const e0 = parsed.entries[0]!;
    const e1 = parsed.entries[1]!;
    expect(e1.imageOffset).toBe(e0.imageOffset + e0.bytesInRes);
    expect(e1.imageOffset + e1.bytesInRes).toBe(cur.length);
  });
});

describe("encodeIco", () => {
  it("encodes idType=1 with wPlanes/wBitCount instead of a hotspot", () => {
    const ico = encodeIco([makeImage(32, 32)]);
    const parsed = parseIcon(ico);
    expect(parsed.idType).toBe(1);
    expect(parsed.entries[0]!.a).toBe(1); // wPlanes
    expect(parsed.entries[0]!.b).toBe(32); // wBitCount
  });
});
