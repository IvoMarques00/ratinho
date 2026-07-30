import { decompressFrames, parseGIF } from "gifuct-js";
import type { Frame } from "../types.js";

const DISPOSE_RESTORE_TO_BACKGROUND = 2;
const DISPOSE_RESTORE_TO_PREVIOUS = 3;

/**
 * Extracts GIF frames as full-logical-canvas RGBA frames, correctly
 * compositing per-frame patches according to each frame's GIF disposal
 * method (gifuct-js only decodes each frame's own small patch + palette;
 * it does not composite disposal itself, so that logic lives here).
 */
export function extractGifFrames(buffer: ArrayBuffer): Frame[] {
  const gif = parseGIF(buffer);
  const parsedFrames = decompressFrames(gif, true);
  if (parsedFrames.length === 0) {
    throw new Error("GIF contains no frames");
  }

  const canvasWidth = gif.lsd.width;
  const canvasHeight = gif.lsd.height;
  let canvas = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);

  const frames: Frame[] = [];

  for (const parsed of parsedFrames) {
    const { dims, patch, disposalType, delay } = parsed;

    const preDrawSnapshot = disposalType === DISPOSE_RESTORE_TO_PREVIOUS ? canvas.slice() : null;

    // Blit the patch onto the canvas: transparent patch pixels (alpha=0)
    // mean "show through", i.e. leave the existing canvas content as-is.
    for (let y = 0; y < dims.height; y++) {
      const canvasY = dims.top + y;
      if (canvasY < 0 || canvasY >= canvasHeight) continue;
      for (let x = 0; x < dims.width; x++) {
        const canvasX = dims.left + x;
        if (canvasX < 0 || canvasX >= canvasWidth) continue;
        const srcOffset = (y * dims.width + x) * 4;
        const alpha = patch[srcOffset + 3]!;
        if (alpha === 0) continue;
        const dstOffset = (canvasY * canvasWidth + canvasX) * 4;
        canvas[dstOffset] = patch[srcOffset]!;
        canvas[dstOffset + 1] = patch[srcOffset + 1]!;
        canvas[dstOffset + 2] = patch[srcOffset + 2]!;
        canvas[dstOffset + 3] = alpha;
      }
    }

    frames.push({
      width: canvasWidth,
      height: canvasHeight,
      data: canvas.slice(),
      delayMs: delay || 100,
    });

    if (disposalType === DISPOSE_RESTORE_TO_BACKGROUND) {
      for (let y = 0; y < dims.height; y++) {
        const canvasY = dims.top + y;
        if (canvasY < 0 || canvasY >= canvasHeight) continue;
        for (let x = 0; x < dims.width; x++) {
          const canvasX = dims.left + x;
          if (canvasX < 0 || canvasX >= canvasWidth) continue;
          const dstOffset = (canvasY * canvasWidth + canvasX) * 4;
          canvas[dstOffset] = 0;
          canvas[dstOffset + 1] = 0;
          canvas[dstOffset + 2] = 0;
          canvas[dstOffset + 3] = 0;
        }
      }
    } else if (disposalType === DISPOSE_RESTORE_TO_PREVIOUS && preDrawSnapshot) {
      canvas = preDrawSnapshot;
    }
  }

  return frames;
}
