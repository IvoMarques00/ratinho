import { lanczos } from "./kernels.js";
import type { RGBAImage } from "../types.js";

export interface Contribution {
  index: number;
  weight: number;
}

/**
 * Precomputes, for each destination pixel along one axis, the source
 * pixel indices and normalized Lanczos weights that contribute to it.
 * When downsampling, the filter's support radius is widened by the scale
 * factor (a standard technique, matching e.g. Pillow's resize) so the
 * kernel properly anti-aliases instead of just decimating and aliasing.
 */
export function computeContributions(srcSize: number, dstSize: number, a = 3): Contribution[][] {
  const scale = srcSize / dstSize;
  const filterScale = Math.max(scale, 1);
  const support = a * filterScale;

  const result: Contribution[][] = [];
  for (let dst = 0; dst < dstSize; dst++) {
    const center = (dst + 0.5) * scale - 0.5;
    const left = Math.floor(center - support);
    const right = Math.ceil(center + support);

    const merged = new Map<number, number>();
    let weightSum = 0;
    for (let i = left; i <= right; i++) {
      const w = lanczos((center - i) / filterScale, a);
      if (w === 0) continue;
      const clamped = Math.min(Math.max(i, 0), srcSize - 1);
      merged.set(clamped, (merged.get(clamped) ?? 0) + w);
      weightSum += w;
    }

    const contribs: Contribution[] = [];
    for (const [index, weight] of merged) {
      contribs.push({ index, weight: weightSum !== 0 ? weight / weightSum : 0 });
    }
    result.push(contribs);
  }
  return result;
}

export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Un-premultiplies one premultiplied RGBA sample back to straight-alpha bytes. */
export function unpremultiplyPixel(r: number, g: number, b: number, alpha: number): [number, number, number, number] {
  const clampedAlpha = Math.max(0, Math.min(255, alpha));
  if (clampedAlpha <= 0.001) return [0, 0, 0, 0];
  const inv = 255 / clampedAlpha;
  return [clampByte(r * inv), clampByte(g * inv), clampByte(b * inv), clampByte(clampedAlpha)];
}

export function premultiplyRGBA(image: RGBAImage): Float32Array {
  const { width, height, data } = image;
  const out = new Float32Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const alpha = data[o + 3]!;
    const an = alpha / 255;
    out[o] = data[o]! * an;
    out[o + 1] = data[o + 1]! * an;
    out[o + 2] = data[o + 2]! * an;
    out[o + 3] = alpha;
  }
  return out;
}

/**
 * High-fidelity RGBA resize using a separable Lanczos filter, operating in
 * premultiplied-alpha space to avoid dark/light color fringing at
 * partially-transparent edges. Pure TypeScript, no Canvas dependency, so
 * it runs identically in the browser and in Node.
 */
export function resizeRGBA(image: RGBAImage, destWidth: number, destHeight: number, a = 3): RGBAImage {
  const { width: srcW, height: srcH } = image;
  if (destWidth <= 0 || destHeight <= 0) {
    throw new Error(`Invalid destination size ${destWidth}x${destHeight}`);
  }

  const premult = premultiplyRGBA(image);

  // Horizontal pass: srcW x srcH -> destWidth x srcH
  const hContribs = computeContributions(srcW, destWidth, a);
  const temp = new Float32Array(destWidth * srcH * 4);
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < destWidth; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let al = 0;
      for (const { index, weight } of hContribs[x]!) {
        const o = (y * srcW + index) * 4;
        r += premult[o]! * weight;
        g += premult[o + 1]! * weight;
        b += premult[o + 2]! * weight;
        al += premult[o + 3]! * weight;
      }
      const o2 = (y * destWidth + x) * 4;
      temp[o2] = r;
      temp[o2 + 1] = g;
      temp[o2 + 2] = b;
      temp[o2 + 3] = al;
    }
  }

  // Vertical pass: destWidth x srcH -> destWidth x destHeight
  const vContribs = computeContributions(srcH, destHeight, a);
  const out = new Uint8ClampedArray(destWidth * destHeight * 4);
  for (let x = 0; x < destWidth; x++) {
    for (let y = 0; y < destHeight; y++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let al = 0;
      for (const { index, weight } of vContribs[y]!) {
        const o = (index * destWidth + x) * 4;
        r += temp[o]! * weight;
        g += temp[o + 1]! * weight;
        b += temp[o + 2]! * weight;
        al += temp[o + 3]! * weight;
      }
      const o2 = (y * destWidth + x) * 4;
      const alpha = Math.max(0, Math.min(255, al));
      if (alpha > 0.001) {
        const inv = 255 / alpha;
        out[o2] = clampByte(r * inv);
        out[o2 + 1] = clampByte(g * inv);
        out[o2 + 2] = clampByte(b * inv);
      } else {
        out[o2] = 0;
        out[o2 + 1] = 0;
        out[o2 + 2] = 0;
      }
      out[o2 + 3] = clampByte(alpha);
    }
  }

  return { width: destWidth, height: destHeight, data: out };
}
