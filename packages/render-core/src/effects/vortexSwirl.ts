import { radialWarpPass } from "../passes/warp.js";
import type { EffectDefinition } from "../types.js";

/**
 * "Vortex Swirl" — a living whirlpool distortion that bends the whole
 * cursor around its own center, fading to the un-warped source near the
 * edges. Uses only the twist half of radialWarpPass (ring push zeroed).
 */
export const vortexSwirlEffect: EffectDefinition = {
  id: "vortex-swirl",
  label: "Vortex Swirl",
  description: "A living whirlpool distortion that bends the whole cursor around its own center.",
  padding: 0.15,
  schema: {
    spinTurns: { type: "int", label: "Spin turns per loop", default: 1, min: 0, max: 3 },
    twistAmount: { type: "float", label: "Swirl bend (radians)", default: 3.2, min: 0, max: 8, step: 0.1 },
    tightness: { type: "float", label: "Swirl tightness", default: 10, min: 1, max: 40, step: 1 },
    edgeFade: { type: "float", label: "Edge fade radius", default: 0.45, min: 0.1, max: 0.6, step: 0.01 },
  },
  passes: () => [
    radialWarpPass({
      name: "warp",
      input: "source",
      output: "output",
      turns: (p) => p.spinTurns as number,
      twist: (p) => p.twistAmount as number,
      twistFalloff: (p) => p.tightness as number,
      edgeRadius: (p) => p.edgeFade as number,
      ringCount: 1,
      ringMaxRadius: 0,
      ringWidth: 1,
      ringPush: 0,
    }),
  ],
};
