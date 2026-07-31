import { radialWarpPass } from "../passes/warp.js";
import type { EffectDefinition } from "../types.js";

/**
 * "Shockwave Ping" — a colored ring pulse that repeatedly expands outward
 * from the cursor's center. Uses only the ring half of radialWarpPass
 * (twist/turns zeroed).
 */
export const shockwavePingEffect: EffectDefinition = {
  id: "shockwave-ping",
  label: "Shockwave Ping",
  description: "A colored ring pulse that repeatedly expands outward from the cursor's center.",
  padding: 0.3,
  schema: {
    ringCount: { type: "int", label: "Rings per loop", default: 2, min: 1, max: 4 },
    reach: { type: "float", label: "Ring reach", default: 0.6, min: 0.3, max: 0.9, step: 0.01 },
    pushAmount: { type: "float", label: "Ring distortion", default: 0.05, min: 0, max: 0.15, step: 0.005 },
    glowColor: { type: "color", label: "Ring glow color", default: [0.5, 0.85, 1, 1] },
    glowIntensity: { type: "float", label: "Ring glow intensity", default: 1.2, min: 0, max: 3, step: 0.05 },
  },
  passes: () => [
    radialWarpPass({
      name: "warp",
      input: "source",
      output: "output",
      turns: 0,
      twist: 0,
      twistFalloff: 1,
      edgeRadius: 0.5,
      ringCount: (p) => p.ringCount as number,
      ringMaxRadius: (p) => p.reach as number,
      ringWidth: 0.06,
      ringPush: (p) => p.pushAmount as number,
      ringTint: (p) => p.glowColor as [number, number, number, number],
      ringGlow: (p) => p.glowIntensity as number,
    }),
  ],
};
