import { applyAffine, centeredTransform, scaleMatrix } from "../transform.js";
import type { Frame, RGBAImage, StyleParams } from "../../types.js";

/** Breathing/pulsing scale about the image center, one full sine cycle per loop. */
export function synthesizePulse(image: RGBAImage, frameCount: number, fps: number, params: StyleParams = {}): Frame[] {
  const amplitude = params.amplitude ?? 0.1;
  const delayMs = 1000 / fps;

  const canvasWidth = Math.ceil(image.width * (1 + amplitude) + 2);
  const canvasHeight = Math.ceil(image.height * (1 + amplitude) + 2);

  const frames: Frame[] = [];
  for (let i = 0; i < frameCount; i++) {
    const p = i / frameCount;
    const s = 1 + amplitude * Math.sin(2 * Math.PI * p);
    const matrix = centeredTransform(image.width, image.height, canvasWidth, canvasHeight, scaleMatrix(s, s));
    const frame = applyAffine(image, matrix, canvasWidth, canvasHeight);
    frames.push({ ...frame, delayMs });
  }
  return frames;
}
