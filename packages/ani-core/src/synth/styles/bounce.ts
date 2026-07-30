import { applyAffine, translationMatrix } from "../transform.js";
import type { Frame, RGBAImage, StyleParams } from "../../types.js";

/** Vertical bounce using a per-cycle parabolic arc (gravity feel), not raw sine. */
export function synthesizeBounce(image: RGBAImage, frameCount: number, fps: number, params: StyleParams = {}): Frame[] {
  const cycles = params.cycles ?? 1;
  const amplitude = params.amplitude ?? 0.2;
  const delayMs = 1000 / fps;

  const canvasWidth = image.width;
  const canvasHeight = Math.ceil(image.height * (1 + amplitude) + 1);
  const baseline = canvasHeight - image.height;

  const frames: Frame[] = [];
  for (let i = 0; i < frameCount; i++) {
    const p = i / frameCount;
    const u = (p * cycles) % 1;
    const dy = -amplitude * image.height * 4 * u * (1 - u);
    const matrix = translationMatrix(0, baseline + dy);
    const frame = applyAffine(image, matrix, canvasWidth, canvasHeight);
    frames.push({ ...frame, delayMs });
  }
  return frames;
}
