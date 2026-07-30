import { premultiplyRGBA, unpremultiplyPixel } from "../resize/resample.js";
import type { RGBAImage } from "../types.js";

/** 2D affine matrix: x' = a*x + c*y + e; y' = b*x + d*y + f (canvas-style layout). */
export interface Mat2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export const IDENTITY: Mat2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

export function translationMatrix(tx: number, ty: number): Mat2D {
  return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
}

export function scaleMatrix(sx: number, sy: number): Mat2D {
  return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
}

export function rotationMatrix(radians: number): Mat2D {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
}

/** Composes m1 ∘ m2, i.e. applying the result to a point equals applying m2 first, then m1. */
export function multiply(m1: Mat2D, m2: Mat2D): Mat2D {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

export function invertMatrix(m: Mat2D): Mat2D {
  const det = m.a * m.d - m.b * m.c;
  if (det === 0) throw new Error("Matrix is not invertible");
  const ia = m.d / det;
  const ib = -m.b / det;
  const ic = -m.c / det;
  const id = m.a / det;
  const ie = -(ia * m.e + ic * m.f);
  const iff = -(ib * m.e + id * m.f);
  return { a: ia, b: ib, c: ic, d: id, e: ie, f: iff };
}

export function applyMat(m: Mat2D, x: number, y: number): [number, number] {
  return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}

/** Wraps `extra` (pivoted at the source image's own center) so it also
 * re-centers the source into a possibly-larger output canvas. */
export function centeredTransform(
  srcWidth: number,
  srcHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  extra: Mat2D,
): Mat2D {
  const cx = srcWidth / 2;
  const cy = srcHeight / 2;
  const aroundCenter = multiply(multiply(translationMatrix(cx, cy), extra), translationMatrix(-cx, -cy));
  const recenter = translationMatrix((canvasWidth - srcWidth) / 2, (canvasHeight - srcHeight) / 2);
  return multiply(recenter, aroundCenter);
}

function sampleBilinear(
  premult: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  const at = (px: number, py: number): [number, number, number, number] => {
    if (px < 0 || py < 0 || px >= width || py >= height) return [0, 0, 0, 0];
    const o = (py * width + px) * 4;
    return [premult[o]!, premult[o + 1]!, premult[o + 2]!, premult[o + 3]!];
  };

  const p00 = at(x0, y0);
  const p10 = at(x0 + 1, y0);
  const p01 = at(x0, y0 + 1);
  const p11 = at(x0 + 1, y0 + 1);

  const out: [number, number, number, number] = [0, 0, 0, 0];
  for (let ch = 0; ch < 4; ch++) {
    const top = p00[ch]! * (1 - fx) + p10[ch]! * fx;
    const bottom = p01[ch]! * (1 - fx) + p11[ch]! * fx;
    out[ch] = top * (1 - fy) + bottom * fy;
  }
  return out;
}

/**
 * Renders `image` transformed by `forwardMatrix` (mapping source pixel
 * coordinates to output pixel coordinates) into a new `outWidth`x`outHeight`
 * transparent canvas. Sampling is inverse-mapped bilinear interpolation
 * performed in premultiplied-alpha space, so partially-transparent edges
 * don't pick up dark/light color fringing.
 */
export function applyAffine(image: RGBAImage, forwardMatrix: Mat2D, outWidth: number, outHeight: number): RGBAImage {
  const premult = premultiplyRGBA(image);
  const inverse = invertMatrix(forwardMatrix);
  const out = new Uint8ClampedArray(outWidth * outHeight * 4);

  for (let oy = 0; oy < outHeight; oy++) {
    for (let ox = 0; ox < outWidth; ox++) {
      const [sx, sy] = applyMat(inverse, ox + 0.5, oy + 0.5);
      const [r, g, b, a] = sampleBilinear(premult, image.width, image.height, sx - 0.5, sy - 0.5);
      const [rb, gb, bb, ab] = unpremultiplyPixel(r, g, b, a);
      const o = (oy * outWidth + ox) * 4;
      out[o] = rb;
      out[o + 1] = gb;
      out[o + 2] = bb;
      out[o + 3] = ab;
    }
  }

  return { width: outWidth, height: outHeight, data: out };
}
