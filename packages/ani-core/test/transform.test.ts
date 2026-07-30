import { describe, expect, it } from "vitest";
import {
  IDENTITY,
  applyAffine,
  applyMat,
  centeredTransform,
  invertMatrix,
  multiply,
  rotationMatrix,
  scaleMatrix,
  translationMatrix,
} from "../src/synth/transform.js";
import type { RGBAImage } from "../src/types.js";

describe("matrix math", () => {
  it("multiply with IDENTITY is a no-op", () => {
    const m = translationMatrix(3, 4);
    expect(multiply(m, IDENTITY)).toEqual(m);
    expect(multiply(IDENTITY, m)).toEqual(m);
  });

  it("composes translation and scale in the expected order", () => {
    // multiply(A, B) applies B first, then A.
    const m = multiply(translationMatrix(10, 0), scaleMatrix(2, 2));
    const [x, y] = applyMat(m, 3, 3);
    expect(x).toBeCloseTo(16); // 3*2 + 10
    expect(y).toBeCloseTo(6); // 3*2
  });

  it("invertMatrix undoes a translation", () => {
    const m = translationMatrix(7, -3);
    const inv = invertMatrix(m);
    const [x, y] = applyMat(multiply(inv, m), 5, 5);
    expect(x).toBeCloseTo(5);
    expect(y).toBeCloseTo(5);
  });

  it("invertMatrix undoes a rotation+scale", () => {
    const m = multiply(rotationMatrix(0.7), scaleMatrix(1.5, 1.5));
    const inv = invertMatrix(m);
    const roundTrip = multiply(inv, m);
    const [x, y] = applyMat(roundTrip, 11, -4);
    expect(x).toBeCloseTo(11);
    expect(y).toBeCloseTo(-4);
  });

  it("centeredTransform re-centers a source into a larger canvas with no extra transform", () => {
    const m = centeredTransform(10, 10, 20, 20, IDENTITY);
    const [x, y] = applyMat(m, 0, 0);
    expect(x).toBeCloseTo(5);
    expect(y).toBeCloseTo(5);
  });
});

function makeMarkerImage(): RGBAImage {
  // 32x32, fully transparent except a 2x2 opaque red block at the top-left.
  const width = 32;
  const height = 32;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      const o = (y * width + x) * 4;
      data[o] = 255;
      data[o + 1] = 0;
      data[o + 2] = 0;
      data[o + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("applyAffine", () => {
  it("translates a solid image by an exact integer offset", () => {
    const width = 32;
    const height = 32;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 255;
      data[i * 4 + 3] = 255;
    }
    const src: RGBAImage = { width, height, data };

    const out = applyAffine(src, translationMatrix(5, 3), 40, 40);

    // Outside the translated footprint: transparent.
    expect(out.data[(0 * 40 + 0) * 4 + 3]).toBe(0);
    // Inside the translated footprint: opaque red.
    const inside = (10 * 40 + 10) * 4;
    expect(out.data[inside]).toBe(255);
    expect(out.data[inside + 3]).toBe(255);
  });

  it("rotates a corner marker to the opposite corner under a 180deg rotation", () => {
    const src = makeMarkerImage();
    const matrix = centeredTransform(32, 32, 32, 32, rotationMatrix(Math.PI));
    const out = applyAffine(src, matrix, 32, 32);

    // Original marker location should no longer be opaque.
    const topLeft = (1 * 32 + 1) * 4;
    expect(out.data[topLeft + 3]).toBeLessThan(50);

    // Bottom-right region should now carry the marker's red color.
    const bottomRight = (30 * 32 + 30) * 4;
    expect(out.data[bottomRight + 3]).toBeGreaterThan(200);
    expect(out.data[bottomRight]).toBeGreaterThan(200);
  });

  it("does not bleed color from a transparent surround into a scaled-down opaque marker", () => {
    const src = makeMarkerImage();
    const matrix = centeredTransform(32, 32, 32, 32, scaleMatrix(0.5, 0.5));
    const out = applyAffine(src, matrix, 32, 32);
    // Far from the shrunk marker, alpha should be ~0, not a faded gray/red.
    const farCorner = (28 * 32 + 28) * 4;
    expect(out.data[farCorner + 3]).toBeLessThan(5);
  });
});
