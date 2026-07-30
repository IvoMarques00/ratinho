import { gaussianBlurPasses } from "../passes/blur.js";
import { brightPassSpec } from "../passes/threshold.js";
import type { EffectDefinition } from "../types.js";

const COMPOSITE_FRAGMENT = `
float pulse = 1.0 + uPulseDepth * sin(TAU * float(uCycles) * uPhase);
vec2 cuv = (vUv - 0.5) / (1.0 + uCoreScale * sin(TAU * float(uCycles) * uPhase)) + 0.5;
vec4 base = sampleClamped(uSourceTex, cuv);
vec4 glow = texture(uBloom, vUv) * uIntensity * pulse;
vec3 pm = base.rgb + glow.rgb * uTint.rgb;
float a = clamp(base.a + glow.a * uGlowAlpha * pulse, 0.0, 1.0);
if (uTonemap) {
  pm = pm / (1.0 + pm);
}
fragColor = vec4(a > 0.0 ? pm / a : vec3(0.0), a);
`;

/**
 * "Neon Bloom" — a breathing HDR glow that bleeds past the source
 * silhouette into the padding. Impossible with a 2D affine transform:
 * the light itself grows/shrinks and extends beyond the sprite's edges.
 */
export const bloomPulseEffect: EffectDefinition = {
  id: "bloom-pulse",
  label: "Neon Bloom",
  description: "A soft, pulsing glow that bleeds light past the cursor's silhouette.",
  padding: 0.35,
  schema: {
    intensity: { type: "float", label: "Glow intensity", default: 1.2, min: 0, max: 3, step: 0.05 },
    threshold: { type: "float", label: "Bright-pass threshold", default: 0.55, min: 0, max: 1, step: 0.01 },
    knee: { type: "float", label: "Threshold softness", default: 0.15, min: 0, max: 0.5, step: 0.01 },
    radius: { type: "float", label: "Blur radius", default: 1.6, min: 0.5, max: 4, step: 0.1 },
    iterations: { type: "int", label: "Blur iterations", default: 2, min: 1, max: 4 },
    pulseDepth: { type: "float", label: "Pulse depth", default: 0.5, min: 0, max: 1, step: 0.01 },
    cycles: { type: "int", label: "Pulse cycles", default: 1, min: 1, max: 4 },
    tint: { type: "color", label: "Glow tint", default: [1, 0.85, 0.6, 1] },
    glowAlpha: { type: "float", label: "Glow opacity", default: 0.6, min: 0, max: 1, step: 0.01 },
    coreScale: { type: "float", label: "Core breathing", default: 0.04, min: 0, max: 0.2, step: 0.005 },
    tonemap: { type: "bool", label: "Tonemap (Reinhard)", default: true },
  },
  passes: (params) => [
    brightPassSpec({
      name: "threshold",
      input: "source",
      output: "bright",
      scale: 0.5,
      thresholdExpr: "uThreshold",
      kneeExpr: "uKnee",
    }),
    ...gaussianBlurPasses({
      namePrefix: "bloom",
      input: "bright",
      output: "bloomGlow",
      iterations: params.iterations as number,
      radius: params.radius as number,
      scale: 0.25,
    }),
    {
      name: "composite",
      fragment: COMPOSITE_FRAGMENT,
      inputs: [
        { uniform: "uSourceTex", from: "source" },
        { uniform: "uBloom", from: "previous" },
      ],
      output: { target: "output" },
    },
  ],
};
