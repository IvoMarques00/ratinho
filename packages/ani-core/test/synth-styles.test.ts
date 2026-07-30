import { describe, expect, it } from "vitest";
import { synthesizeFrames } from "../src/synth/index.js";
import type { RGBAImage } from "../src/types.js";

function makeImage(width = 32, height = 32): RGBAImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = 200;
    data[i * 4 + 1] = 50;
    data[i * 4 + 2] = 20;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

describe("synthesizeFrames", () => {
  it("style 'none' produces exactly one frame at the source resolution", () => {
    const frames = synthesizeFrames(makeImage(), { style: "none", frameCount: 1, fps: 10 });
    expect(frames).toHaveLength(1);
    expect(frames[0]!.width).toBe(32);
    expect(frames[0]!.height).toBe(32);
    expect(frames[0]!.delayMs).toBeCloseTo(100);
  });

  it("rejects frameCount < 1 for animated styles", () => {
    expect(() => synthesizeFrames(makeImage(), { style: "pulse", frameCount: 0, fps: 12 })).toThrow();
  });

  for (const style of ["pulse", "wiggle", "bounce", "rotate"] as const) {
    it(`${style}: produces the requested frame count with consistent dimensions and delays`, () => {
      const frameCount = 8;
      const fps = 12;
      const frames = synthesizeFrames(makeImage(), { style, frameCount, fps });
      expect(frames).toHaveLength(frameCount);
      const { width, height } = frames[0]!;
      for (const f of frames) {
        expect(f.width).toBe(width);
        expect(f.height).toBe(height);
        expect(f.delayMs).toBeCloseTo(1000 / fps);
        expect(f.data.length).toBe(width * height * 4);
      }
    });

    it(`${style}: padded canvas is at least as large as the source in both dimensions`, () => {
      const frames = synthesizeFrames(makeImage(40, 30), { style, frameCount: 6, fps: 12 });
      expect(frames[0]!.width).toBeGreaterThanOrEqual(40);
      expect(frames[0]!.height).toBeGreaterThanOrEqual(30);
    });
  }

  it("rotate 'spin' mode: frame 0 is unrotated (theta=0)", () => {
    const frames = synthesizeFrames(makeImage(), {
      style: "rotate",
      frameCount: 4,
      fps: 12,
      params: { rotateMode: "spin" },
    });
    // At p=0, theta=0, so the source should land centered and undistorted:
    // its center pixel should still be opaque with the source color.
    const { width, data } = frames[0]!;
    const cx = Math.floor(width / 2);
    const o = (cx * width + cx) * 4;
    expect(data[o + 3]).toBeGreaterThan(200);
  });

  it("bounce: apex frame is offset upward relative to the resting frame", () => {
    const frames = synthesizeFrames(makeImage(20, 20), {
      style: "bounce",
      frameCount: 10,
      fps: 12,
      params: { amplitude: 0.3, cycles: 1 },
    });
    // Frame 0 (u=0) is at resting baseline; the middle frame (u=0.5) is at the apex.
    const restingFrame = frames[0]!;
    const apexFrame = frames[Math.floor(frames.length / 2)]!;
    const height = restingFrame.height;
    const width = restingFrame.width;

    function topmostOpaqueRow(f: typeof restingFrame): number {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (f.data[(y * width + x) * 4 + 3]! > 128) return y;
        }
      }
      return height;
    }

    expect(topmostOpaqueRow(apexFrame)).toBeLessThan(topmostOpaqueRow(restingFrame));
  });
});
