import { GifWriter } from "omggif";
import { describe, expect, it } from "vitest";
import { convertGifToAni, convertImageToAni, convertImageToCur, framesToAni } from "../src/convert.js";
import { parseAni, parseIcon } from "./riff-parser.js";
import type { RGBAImage } from "../src/types.js";

function makeImage(width = 64, height = 64): RGBAImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = 90;
    data[i * 4 + 1] = 180;
    data[i * 4 + 2] = 40;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

describe("convertImageToCur", () => {
  it("resizes to the requested size and embeds the given hotspot", () => {
    const cur = convertImageToCur(makeImage(), { sizes: [32], hotspot: { x: 16, y: 16 } });
    const parsed = parseIcon(cur);
    expect(parsed.idType).toBe(2);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0]!.width).toBe(32);
    expect(parsed.entries[0]!.a).toBe(16);
    expect(parsed.entries[0]!.b).toBe(16);
  });

  it("supports multiple sizes in one CUR", () => {
    const cur = convertImageToCur(makeImage(), { sizes: [32, 48] });
    const parsed = parseIcon(cur);
    expect(parsed.entries.map((e) => e.width)).toEqual([32, 48]);
  });
});

describe("convertImageToAni", () => {
  it("without synth options, produces a single-frame ani", () => {
    const result = convertImageToAni(makeImage());
    expect(result.frameCount).toBe(1);
    const parsed = parseAni(result.bytes);
    expect(parsed.cFrames).toBe(1);
    expect(parsed.iconBlobs).toHaveLength(1);
  });

  it("with synth options, produces the requested frame count, all resized to the cursor size", () => {
    const result = convertImageToAni(makeImage(), {
      sizes: [32],
      hotspot: { x: 16, y: 16 },
      synth: { style: "pulse", frameCount: 5, fps: 10 },
    });
    expect(result.frameCount).toBe(5);
    const parsed = parseAni(result.bytes);
    expect(parsed.cFrames).toBe(5);
    expect(parsed.rateJiffies).toHaveLength(5);
    for (const iconBlob of parsed.iconBlobs) {
      const icon = parseIcon(iconBlob);
      expect(icon.idType).toBe(2);
      expect(icon.entries[0]!.width).toBe(32); // resized regardless of the padded synth canvas size
      expect(icon.entries[0]!.a).toBe(16);
    }
  });
});

describe("convertGifToAni", () => {
  it("converts an extracted GIF's frames, preserving per-frame delays", () => {
    const buf = new Uint8Array(4096);
    const gw = new GifWriter(buf, 4, 4, { palette: [0xff0000, 0x00ff00, 0x000000, 0x0000ff] });
    gw.addFrame(0, 0, 4, 4, new Array(16).fill(0), { disposal: 1, delay: 10 });
    gw.addFrame(0, 0, 4, 4, new Array(16).fill(1), { disposal: 1, delay: 20 });
    const len = gw.end();
    const gifBytes = buf.slice(0, len);

    const result = convertGifToAni(gifBytes, { sizes: [32] });
    expect(result.frameCount).toBe(2);
    const parsed = parseAni(result.bytes);
    expect(parsed.rateJiffies).toEqual([6, 12]); // 100ms->6 jiffies, 200ms->12 jiffies
  });
});

describe("framesToAni", () => {
  it("throws on an empty frame list", () => {
    expect(() => framesToAni([])).toThrow();
  });
});
