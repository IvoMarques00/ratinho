import { gaussianBlurPasses } from "../passes/blur.js";
import type { EffectDefinition } from "../types.js";

const ABERRATE_FRAGMENT = `
vec2 c = vUv - 0.5;
float r = length(c);
float ang = TAU * float(uSpinTurns) * uPhase + radians(uWobbleDeg) * sin(TAU * float(uCycles) * uPhase);
mat2 R = rot2(ang);
float sep = uSeparation * mix(1.0, r * 2.0, uRadialBias) * (1.0 + uSepPulse * sin(TAU * float(uCycles) * uPhase));
vec2 dir = R * normalize(c + vec2(1e-6));

vec4 accR = vec4(0.0);
vec4 accG = vec4(0.0);
vec4 accB = vec4(0.0);
float arc = radians(uSmearArcDeg) / float(max(uSmearSamples, 1));
for (int i = 0; i < 8; i++) {
  if (i >= uSmearSamples) break;
  mat2 Rs = rot2(-0.5 * radians(uSmearArcDeg) + arc * float(i));
  vec2 uvs = 0.5 + Rs * c;
  vec2 dR = dir * sep;
  vec2 dB = -dir * sep;
  accR += sampleClamped(uSource, uvs + dR);
  accG += sampleClamped(uSource, uvs);
  accB += sampleClamped(uSource, uvs + dB);
}
float n = float(max(uSmearSamples, 1));
accR /= n;
accG /= n;
accB /= n;
float a = mix((accR.a + accG.a + accB.a) / 3.0, max(accR.a, max(accG.a, accB.a)), uFringeAlpha);
fragColor = vec4(accR.r, accG.g, accB.b, a);
`;

const COMPOSITE_FRAGMENT = `
vec4 base = texture(uAberrated, vUv);
vec4 halo = texture(uHalo, vUv) * uHaloIntensity;
vec3 pm = base.rgb + halo.rgb;
float a = clamp(base.a + halo.a * uHaloIntensity, 0.0, 1.0);
fragColor = vec4(a > 0.0 ? pm / a : vec3(0.0), a);
`;

/**
 * "Chromatic Prism" — per-channel radial displacement (each of R/G/B
 * sampled from a slightly different position/rotation) plus an angular
 * smear, so the cursor spins with visible color fringing that extends
 * past its own silhouette. Also impossible with a single affine
 * transform, which moves all channels together.
 */
export const prismSpinEffect: EffectDefinition = {
  id: "prism-spin",
  label: "Chromatic Prism",
  description: "A spinning cursor with per-channel color fringing and a soft halo.",
  padding: 0.2,
  schema: {
    separation: { type: "float", label: "Channel separation", default: 0.03, min: 0, max: 0.15, step: 0.005 },
    spinTurns: { type: "int", label: "Spin turns per loop", default: 1, min: 0, max: 3 },
    cycles: { type: "int", label: "Wobble/pulse cycles", default: 1, min: 1, max: 4 },
    wobbleDeg: { type: "float", label: "Wobble amount (deg)", default: 0, min: 0, max: 45, step: 1 },
    radialBias: { type: "float", label: "Radial bias", default: 0.8, min: 0, max: 1, step: 0.01 },
    sepPulse: { type: "float", label: "Separation pulse", default: 0.4, min: 0, max: 1, step: 0.01 },
    smearSamples: { type: "int", label: "Smear samples", default: 3, min: 1, max: 8 },
    smearArcDeg: { type: "float", label: "Smear arc (deg)", default: 8, min: 0, max: 30, step: 1 },
    fringeAlpha: { type: "float", label: "Fringe alpha extension", default: 0.5, min: 0, max: 1, step: 0.01 },
    haloIntensity: { type: "float", label: "Halo intensity", default: 0.35, min: 0, max: 1, step: 0.01 },
  },
  passes: () => [
    {
      name: "aberrate",
      fragment: ABERRATE_FRAGMENT,
      inputs: [{ uniform: "uSource", from: "source" }],
      output: { target: "aberrated" },
    },
    ...gaussianBlurPasses({
      namePrefix: "prism",
      input: "aberrated",
      output: "halo",
      iterations: 1,
      radius: 2.0,
      scale: 0.5,
    }),
    {
      name: "composite",
      fragment: COMPOSITE_FRAGMENT,
      inputs: [
        { uniform: "uAberrated", from: "aberrated" },
        { uniform: "uHalo", from: "previous" },
      ],
      output: { target: "output" },
    },
  ],
};
