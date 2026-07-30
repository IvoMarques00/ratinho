import { describe, expect, it } from "vitest";
import { lanczos, sinc } from "../src/resize/kernels.js";
import { computeContributions, resizeRGBA } from "../src/resize/resample.js";
import type { RGBAImage } from "../src/types.js";

function solidImage(width: number, height: number, r: number, g: number, b: number, a: number): RGBAImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return { width, height, data };
}

describe("kernels", () => {
  it("sinc(0) === 1", () => {
    expect(sinc(0)).toBe(1);
  });

  it("lanczos peaks at 1 at x=0 and is 0 at the support boundary", () => {
    expect(lanczos(0, 3)).toBeCloseTo(1);
    expect(lanczos(3, 3)).toBe(0);
    expect(lanczos(-3, 3)).toBe(0);
  });
});

describe("computeContributions", () => {
  it("normalizes weights to sum to 1 for every destination pixel", () => {
    const contribs = computeContributions(100, 32);
    expect(contribs).toHaveLength(32);
    for (const c of contribs) {
      const sum = c.reduce((acc, x) => acc + x.weight, 0);
      expect(sum).toBeCloseTo(1, 5);
    }
  });

  it("keeps all source indices within bounds", () => {
    const contribs = computeContributions(10, 3);
    for (const c of contribs) {
      for (const { index } of c) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(10);
      }
    }
  });
});

describe("resizeRGBA", () => {
  it("produces the requested output dimensions", () => {
    const src = solidImage(200, 150, 10, 20, 30, 255);
    const out = resizeRGBA(src, 32, 32);
    expect(out.width).toBe(32);
    expect(out.height).toBe(32);
    expect(out.data.length).toBe(32 * 32 * 4);
  });

  it("keeps a fully-opaque solid color solid after downsampling (unity DC gain)", () => {
    const src = solidImage(256, 256, 200, 100, 50, 255);
    const out = resizeRGBA(src, 32, 32);
    for (let i = 0; i < 32 * 32; i++) {
      expect(out.data[i * 4]).toBeCloseTo(200, 0);
      expect(out.data[i * 4 + 1]).toBeCloseTo(100, 0);
      expect(out.data[i * 4 + 2]).toBeCloseTo(50, 0);
      expect(out.data[i * 4 + 3]).toBe(255);
    }
  });

  it("keeps a fully-opaque solid color solid after upsampling", () => {
    const src = solidImage(8, 8, 12, 34, 56, 255);
    const out = resizeRGBA(src, 48, 48);
    for (let i = 0; i < 48 * 48; i++) {
      expect(out.data[i * 4]).toBeCloseTo(12, 0);
      expect(out.data[i * 4 + 1]).toBeCloseTo(34, 0);
      expect(out.data[i * 4 + 2]).toBeCloseTo(56, 0);
      expect(out.data[i * 4 + 3]).toBe(255);
    }
  });

  it("round-trips a constant semi-transparent color through premultiply/unpremultiply", () => {
    // A constant field's premultiplied value un-premultiplies back to the
    // exact same RGB regardless of alpha, proving the premultiply pipeline
    // doesn't darken/lighten colors by itself.
    const src = solidImage(64, 64, 220, 40, 10, 128);
    const out = resizeRGBA(src, 20, 20);
    for (let i = 0; i < 20 * 20; i++) {
      expect(out.data[i * 4]).toBeCloseTo(220, 0);
      expect(out.data[i * 4 + 1]).toBeCloseTo(40, 0);
      expect(out.data[i * 4 + 2]).toBeCloseTo(10, 0);
      expect(out.data[i * 4 + 3]).toBeCloseTo(128, 0);
    }
  });

  it("does not bleed color into fully transparent regions", () => {
    // Left half opaque red, right half fully transparent black.
    const width = 64;
    const height = 8;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const o = (y * width + x) * 4;
        if (x < width / 2) {
          data[o] = 255;
          data[o + 1] = 0;
          data[o + 2] = 0;
          data[o + 3] = 255;
        }
      }
    }
    const out = resizeRGBA({ width, height, data }, 32, 4);
    // Deep into the transparent half, alpha should be ~0 and RGB should
    // not have picked up a "washed out gray/black red" fringe.
    const farRightIndex = (0 * 32 + 30) * 4;
    expect(out.data[farRightIndex + 3]).toBeLessThan(10);
  });
});
