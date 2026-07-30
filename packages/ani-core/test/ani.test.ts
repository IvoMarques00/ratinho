import { describe, expect, it } from "vitest";
import { buildAni } from "../src/encode/ani.js";
import { encodeCur } from "../src/encode/ico.js";
import { parseAni, parseRiffChunks, readFourCC } from "./riff-parser.js";
import type { RGBAImage } from "../src/types.js";

function makeCur(size = 32): Uint8Array {
  const image: RGBAImage = {
    width: size,
    height: size,
    data: new Uint8ClampedArray(size * size * 4).fill(128),
  };
  return encodeCur([image]);
}

describe("buildAni", () => {
  it("throws on an empty frame list", () => {
    expect(() => buildAni([])).toThrow();
  });

  it("produces a well-formed RIFF/ACON file with anih -> rate -> LIST order", () => {
    const cur = makeCur();
    const bytes = buildAni([
      { cur, delayMs: 1000 },
      { cur, delayMs: 500 },
      { cur, delayMs: 16 },
    ]);

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(readFourCC(view, 0)).toBe("RIFF");
    expect(readFourCC(view, 8)).toBe("ACON");

    const chunks = parseRiffChunks(bytes, 12, bytes.length);
    expect(chunks.map((c) => c.tag)).toEqual(["anih", "rate", "LIST"]);
  });

  it("round-trips frame count, steps, flags, and per-frame jiffy rates", () => {
    const cur = makeCur();
    const bytes = buildAni([
      { cur, delayMs: 1000 }, // 60 jiffies
      { cur, delayMs: 500 }, // 30 jiffies
      { cur, delayMs: 16 }, // 1 jiffy (rounded, floored at 1)
    ]);

    const parsed = parseAni(bytes);
    expect(parsed.cbSizeOf).toBe(36);
    expect(parsed.cFrames).toBe(3);
    expect(parsed.cSteps).toBe(3);
    expect(parsed.flags).toBe(0x1); // AF_ICON
    expect(parsed.rateJiffies).toEqual([60, 30, 1]);
    expect(parsed.jifRate).toBe(30); // rounded average fallback
    expect(parsed.iconBlobs).toHaveLength(3);
  });

  it("embeds byte-identical CUR blobs per frame", () => {
    const curA = makeCur(32);
    const curB = makeCur(16);
    const bytes = buildAni([
      { cur: curA, delayMs: 100 },
      { cur: curB, delayMs: 100 },
    ]);
    const parsed = parseAni(bytes);
    expect(Array.from(parsed.iconBlobs[0]!)).toEqual(Array.from(curA));
    expect(Array.from(parsed.iconBlobs[1]!)).toEqual(Array.from(curB));
  });

  it("clamps delays under one jiffy up to a minimum of 1 jiffy", () => {
    const cur = makeCur();
    const bytes = buildAni([{ cur, delayMs: 1 }]);
    const parsed = parseAni(bytes);
    expect(parsed.rateJiffies[0]).toBe(1);
  });

  it("keeps chunk boundaries even-aligned even with odd-length frame data", () => {
    const oddCur = new Uint8Array([1, 2, 3]); // deliberately odd length, arbitrary bytes
    const bytes = buildAni([{ cur: oddCur, delayMs: 100 }]);
    // Should not throw during parsing despite the odd-length inner chunk.
    const parsed = parseAni(bytes);
    expect(Array.from(parsed.iconBlobs[0]!)).toEqual([1, 2, 3]);
  });

  it("sets RIFF fileSize to the byte length after the fileSize field", () => {
    const cur = makeCur();
    const bytes = buildAni([{ cur, delayMs: 100 }]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const fileSize = view.getUint32(4, true);
    expect(fileSize).toBe(bytes.length - 8);
  });
});
