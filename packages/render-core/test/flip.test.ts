import { describe, expect, it } from "vitest";
import { flipRowsY } from "../src/gl/texture.js";

describe("flipRowsY", () => {
  it("flips a known 2x2 RGBA buffer vertically", () => {
    // Row 0: red, green. Row 1: blue, white.
    const data = Uint8ClampedArray.from([
      255, 0, 0, 255, 0, 255, 0, 255, // row 0
      0, 0, 255, 255, 255, 255, 255, 255, // row 1
    ]);
    const flipped = flipRowsY(data, 2, 2);
    expect(Array.from(flipped)).toEqual([
      0, 0, 255, 255, 255, 255, 255, 255, // former row 1 now first
      255, 0, 0, 255, 0, 255, 0, 255, // former row 0 now last
    ]);
  });

  it("is its own inverse (double flip is identity)", () => {
    const data = Uint8ClampedArray.from({ length: 4 * 4 * 3 }, (_, i) => i % 256);
    const twice = flipRowsY(flipRowsY(data, 4, 3), 4, 3);
    expect(Array.from(twice)).toEqual(Array.from(data));
  });

  it("throws when the buffer length doesn't match the given dimensions", () => {
    expect(() => flipRowsY(new Uint8ClampedArray(10), 2, 2)).toThrow();
  });
});
