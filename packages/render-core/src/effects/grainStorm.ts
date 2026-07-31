import { gaussianBlurPasses } from "../passes/blur.js";
import { grainPassSpec } from "../passes/grain.js";
import { brightPassSpec } from "../passes/threshold.js";
import type { EffectDefinition } from "../types.js";

const COMPOSITE_FRAGMENT = `
vec4 base = sampleClamped(uSource, vUv);
vec4 n = texture(uNoise, vUv);
float grain = (n.r - 0.5) * 2.0;
vec4 glow = texture(uSparkleGlow, vUv) * uSparkleIntensity;
float edge = vignette(vUv, vec2(0.5), uVignetteReach, 0.15);
vec3 pm = base.rgb + grain * uGrainAmount * uGrainTint.rgb * base.a * edge + glow.rgb * uGrainTint.rgb;
float a = clamp(base.a + glow.a * uSparkleIntensity, 0.0, 1.0);
fragColor = vec4(pm, a);
`;

/**
 * "Grain Storm" — flickering film grain confined to the cursor's own
 * silhouette, plus glinting sparkle highlights from the brightest noise
 * cells (threshold -> blur -> glow, the same shape as bloom-pulse's own
 * glow chain, but fed by procedural noise instead of the source image).
 * Animation lives entirely in the noise pass (reseeded per frame), not
 * the composite — this is the one effect where uPhase doesn't appear in
 * the final pass.
 */
export const grainStormEffect: EffectDefinition = {
  id: "grain-storm",
  label: "Grain Storm",
  description: "Flickering film grain with glinting sparkle highlights, like static crawling over the cursor.",
  padding: 0.15,
  schema: {
    grainAmount: { type: "float", label: "Grain strength", default: 0.35, min: 0, max: 1, step: 0.01 },
    grainSize: { type: "float", label: "Grain size", default: 1.5, min: 1, max: 4, step: 0.1 },
    sparkleThreshold: { type: "float", label: "Sparkle threshold", default: 0.85, min: 0.5, max: 0.95, step: 0.01 },
    sparkleIntensity: { type: "float", label: "Sparkle glow intensity", default: 1.5, min: 0, max: 3, step: 0.05 },
    grainTint: { type: "color", label: "Tint", default: [1, 1, 1, 1] },
    vignetteReach: { type: "float", label: "Grain edge reach", default: 0.5, min: 0.3, max: 0.7, step: 0.01 },
  },
  passes: () => [
    grainPassSpec({ name: "noise", output: "noise", cellSize: (p) => p.grainSize as number }),
    brightPassSpec({
      name: "sparkle",
      input: "noise",
      output: "sparkleBright",
      scale: 0.5,
      thresholdExpr: "uSparkleThreshold",
      kneeExpr: "0.05",
    }),
    ...gaussianBlurPasses({
      namePrefix: "grain",
      input: "sparkleBright",
      output: "sparkleGlow",
      iterations: 1,
      radius: 1.5,
      scale: 0.5,
    }),
    {
      name: "composite",
      fragment: COMPOSITE_FRAGMENT,
      inputs: [
        { uniform: "uSource", from: "source" },
        { uniform: "uNoise", from: "noise" },
        { uniform: "uSparkleGlow", from: "previous" },
      ],
      output: { target: "output" },
    },
  ],
};
