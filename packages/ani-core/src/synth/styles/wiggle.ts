import { applyAffine, centeredTransform, multiply, rotationMatrix, translationMatrix } from "../transform.js";
import type { Frame, RGBAImage, StyleParams } from "../../types.js";

/** Small rotational shake, optionally combined with a subtle horizontal shift. */
export function synthesizeWiggle(image: RGBAImage, frameCount: number, fps: number, params: StyleParams = {}): Frame[] {
  const maxAngleDeg = params.maxAngleDeg ?? 8;
  const cycles = params.cycles ?? 2;
  const amplitude = params.amplitude ?? 0.05;
  const delayMs = 1000 / fps;

  const canvasWidth = Math.ceil(image.width * 1.3);
  const canvasHeight = Math.ceil(image.height * 1.3);

  const frames: Frame[] = [];
  for (let i = 0; i < frameCount; i++) {
    const p = i / frameCount;
    const theta = ((maxAngleDeg * Math.PI) / 180) * Math.sin(2 * Math.PI * p * cycles);
    const dx = amplitude * image.width * Math.sin(2 * Math.PI * p * cycles + Math.PI / 2);
    const extra = multiply(translationMatrix(dx, 0), rotationMatrix(theta));
    const matrix = centeredTransform(image.width, image.height, canvasWidth, canvasHeight, extra);
    const frame = applyAffine(image, matrix, canvasWidth, canvasHeight);
    frames.push({ ...frame, delayMs });
  }
  return frames;
}
