import { GifWriter } from "omggif";
import { describe, expect, it } from "vitest";
import { extractGifFrames } from "../src/gif/extract.js";

interface TestFrameSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  indices: number[];
  disposal: number;
  delayCentiseconds: number;
  transparent?: number;
}

function buildGif(width: number, height: number, palette: number[], frames: TestFrameSpec[]): ArrayBuffer {
  const buf = new Uint8Array(64 * 1024);
  const gw = new GifWriter(buf, width, height, { palette });
  for (const f of frames) {
    gw.addFrame(f.x, f.y, f.w, f.h, f.indices, {
      disposal: f.disposal,
      delay: f.delayCentiseconds,
      transparent: f.transparent,
    });
  }
  const len = gw.end();
  return buf.slice(0, len).buffer;
}

const RED = 0xff0000;
const GREEN = 0x00ff00;
const BLUE = 0x0000ff;
const PALETTE = [RED, GREEN, BLUE, 0x000000]; // power-of-2 length required by omggif

function pixelAt(frame: { width: number; data: Uint8ClampedArray }, x: number, y: number) {
  const o = (y * frame.width + x) * 4;
  return { r: frame.data[o], g: frame.data[o + 1], b: frame.data[o + 2], a: frame.data[o + 3] };
}

describe("extractGifFrames", () => {
  it("extracts the correct frame count, canvas size, and ms delays", () => {
    const gif = buildGif(4, 4, PALETTE, [
      { x: 0, y: 0, w: 4, h: 4, indices: new Array(16).fill(0), disposal: 1, delayCentiseconds: 10 },
      { x: 0, y: 0, w: 4, h: 4, indices: new Array(16).fill(1), disposal: 1, delayCentiseconds: 25 },
    ]);
    const frames = extractGifFrames(gif);
    expect(frames).toHaveLength(2);
    expect(frames[0]!.width).toBe(4);
    expect(frames[0]!.height).toBe(4);
    expect(frames[0]!.delayMs).toBe(100);
    expect(frames[1]!.delayMs).toBe(250);
  });

  it("disposal=2 (restore to background) clears the frame's region to transparent for the next frame", () => {
    const gif = buildGif(4, 4, PALETTE, [
      // Frame 0: full red.
      { x: 0, y: 0, w: 4, h: 4, indices: new Array(16).fill(0), disposal: 1, delayCentiseconds: 10 },
      // Frame 1: 2x2 green patch at (1,1), disposal=background afterward.
      { x: 1, y: 1, w: 2, h: 2, indices: new Array(4).fill(1), disposal: 2, delayCentiseconds: 10 },
      // Frame 2: single blue pixel at (0,0), doesn't touch the middle region.
      { x: 0, y: 0, w: 1, h: 1, indices: [2], disposal: 1, delayCentiseconds: 10 },
    ]);
    const frames = extractGifFrames(gif);
    expect(frames).toHaveLength(3);

    // Frame 0: solid red everywhere.
    expect(pixelAt(frames[0]!, 0, 0)).toMatchObject({ r: 255, g: 0, b: 0, a: 255 });
    expect(pixelAt(frames[0]!, 2, 2)).toMatchObject({ r: 255, g: 0, b: 0, a: 255 });

    // Frame 1: green patch visible in the middle, red elsewhere.
    expect(pixelAt(frames[1]!, 2, 2)).toMatchObject({ r: 0, g: 255, b: 0, a: 255 });
    expect(pixelAt(frames[1]!, 0, 0)).toMatchObject({ r: 255, g: 0, b: 0, a: 255 });

    // Frame 2: the green patch's region was restored to background (transparent),
    // frame 2 only paints (0,0) blue, and the rest of the canvas stays red.
    expect(pixelAt(frames[2]!, 0, 0)).toMatchObject({ r: 0, g: 0, b: 255, a: 255 });
    expect(pixelAt(frames[2]!, 2, 2)).toMatchObject({ a: 0 });
    expect(pixelAt(frames[2]!, 3, 3)).toMatchObject({ r: 255, g: 0, b: 0, a: 255 });
  });

  it("disposal=3 (restore to previous) reverts the frame's region instead of clearing it", () => {
    const gif = buildGif(4, 4, PALETTE, [
      // Frame 0: full red.
      { x: 0, y: 0, w: 4, h: 4, indices: new Array(16).fill(0), disposal: 1, delayCentiseconds: 10 },
      // Frame 1: 2x2 green patch at (1,1), disposal=restore-to-previous afterward.
      { x: 1, y: 1, w: 2, h: 2, indices: new Array(4).fill(1), disposal: 3, delayCentiseconds: 10 },
      // Frame 2: single blue pixel at (0,0).
      { x: 0, y: 0, w: 1, h: 1, indices: [2], disposal: 1, delayCentiseconds: 10 },
    ]);
    const frames = extractGifFrames(gif);

    // Frame 2: the middle region should be back to red (restored), not transparent.
    expect(pixelAt(frames[2]!, 0, 0)).toMatchObject({ r: 0, g: 0, b: 255, a: 255 });
    expect(pixelAt(frames[2]!, 2, 2)).toMatchObject({ r: 255, g: 0, b: 0, a: 255 });
  });

  it("throws on a GIF with no frames", () => {
    // A minimal GIF with zero image frames: header/logical screen + trailer only.
    const buf = new Uint8Array(64);
    const gw = new GifWriter(buf, 1, 1, { palette: [0x000000, 0x000000] });
    const len = gw.end();
    expect(() => extractGifFrames(buf.slice(0, len).buffer)).toThrow();
  });
});
