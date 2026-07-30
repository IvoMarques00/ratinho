import { synthesizeBounce } from "./styles/bounce.js";
import { synthesizePulse } from "./styles/pulse.js";
import { synthesizeRotate } from "./styles/rotate.js";
import { synthesizeWiggle } from "./styles/wiggle.js";
import type { Frame, RGBAImage, SynthesizeOptions } from "../types.js";

export { synthesizeBounce } from "./styles/bounce.js";
export { synthesizePulse } from "./styles/pulse.js";
export { synthesizeRotate } from "./styles/rotate.js";
export { synthesizeWiggle } from "./styles/wiggle.js";
export * from "./transform.js";

/** Produces the Frame[] for a single static source image, per the chosen style. */
export function synthesizeFrames(image: RGBAImage, options: SynthesizeOptions): Frame[] {
  const { style, frameCount, fps, params } = options;

  if (style === "none") {
    return [{ ...image, delayMs: 1000 / fps }];
  }

  if (frameCount < 1) {
    throw new Error(`frameCount must be >= 1, got ${frameCount}`);
  }

  switch (style) {
    case "pulse":
      return synthesizePulse(image, frameCount, fps, params);
    case "wiggle":
      return synthesizeWiggle(image, frameCount, fps, params);
    case "bounce":
      return synthesizeBounce(image, frameCount, fps, params);
    case "rotate":
      return synthesizeRotate(image, frameCount, fps, params);
    default: {
      const exhaustiveCheck: never = style;
      throw new Error(`Unknown style: ${String(exhaustiveCheck)}`);
    }
  }
}
