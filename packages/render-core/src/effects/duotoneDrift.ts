import type { EffectDefinition } from "../types.js";

const COMPOSITE_FRAGMENT = `
vec4 s = sampleClamped(uSource, vUv);
vec3 straight = unpremultiplyColor(s);
float l = luma(straight);
float t = smoothstep(uBalance - 0.15, uBalance + 0.15, l);
vec3 duo = mix(uShadowColor.rgb, uHighlightColor.rgb, t);
float angle = TAU * float(uHueTurns) * uPhase;
duo = hueRotate(duo, angle);
float rim = 1.0 - vignette(vUv, vec2(0.5), uVignetteRadius, 0.15);
duo = mix(duo, duo * (1.0 - uVignetteDarken), rim);
fragColor = vec4(duo * s.a, s.a);
`;

/**
 * "Duotone Drift" — a cycling two-tone color grade with a darkening
 * vignette. No geometric distortion, no blur, no bloom: the sharpest
 * possible contrast against the other effects, a pure color-grade look
 * that shifts hue over the loop.
 */
export const duotoneDriftEffect: EffectDefinition = {
  id: "duotone-drift",
  label: "Duotone Drift",
  description: "A cycling two-tone color grade with a darkening vignette — a poster look that shifts hue over the loop.",
  padding: 0.05,
  schema: {
    shadowColor: { type: "color", label: "Shadow color", default: [0.05, 0, 0.15, 1] },
    highlightColor: { type: "color", label: "Highlight color", default: [1, 0.8, 0.2, 1] },
    balance: { type: "float", label: "Tone balance", default: 0.5, min: 0.15, max: 0.85, step: 0.01 },
    hueTurns: { type: "int", label: "Hue drift turns per loop", default: 1, min: 0, max: 3 },
    vignetteRadius: { type: "float", label: "Vignette reach", default: 0.45, min: 0.2, max: 0.7, step: 0.01 },
    vignetteDarken: { type: "float", label: "Rim darkening", default: 0.5, min: 0, max: 1, step: 0.01 },
  },
  passes: () => [
    {
      name: "composite",
      fragment: COMPOSITE_FRAGMENT,
      inputs: [{ uniform: "uSource", from: "source" }],
      output: { target: "output" },
    },
  ],
};
