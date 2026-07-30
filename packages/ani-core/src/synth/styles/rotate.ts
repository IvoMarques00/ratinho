import { applyAffine, centeredTransform, rotationMatrix } from "../transform.js";
import type { Frame, RGBAImage, StyleParams } from "../../types.js";

/**
 * Continuous spin ("spin" mode) or an oscillating rock ("rock" mode).
 * The working canvas is padded to the circumscribing diagonal so a full
 * rotation never clips the source's corners.
 */
export function synthesizeRotate(image: RGBAImage, frameCount: number, fps: number, params: StyleParams = {}): Frame[] {
  const mode = params.rotateMode ?? "spin";
  const maxAngleDeg = params.maxAngleDeg ?? 25;
  const delayMs = 1000 / fps;

  const diag = Math.ceil(Math.sqrt(2) * Math.max(image.width, image.height));

  const frames: Frame[] = [];
  for (let i = 0; i < frameCount; i++) {
    const p = i / frameCount;
    const theta = mode === "spin" ? 2 * Math.PI * p : ((maxAngleDeg * Math.PI) / 180) * Math.sin(2 * Math.PI * p);
    const matrix = centeredTransform(image.width, image.height, diag, diag, rotationMatrix(theta));
    const frame = applyAffine(image, matrix, diag, diag);
    frames.push({ ...frame, delayMs });
  }
  return frames;
}
