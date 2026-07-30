import type { PassSpec } from "../types.js";

export interface BrightPassOptions {
  name: string;
  /** Buffer to threshold (typically "source"). */
  input: string;
  output: string;
  scale?: number;
  /** GLSL expression for the luma cutoff (e.g. an effect-schema uniform name like "uThreshold"). */
  thresholdExpr: string;
  /** GLSL expression for the soft-knee width (e.g. "uKnee"). */
  kneeExpr: string;
}

/** A bright-pass threshold: keeps (softly) only pixels above a luma cutoff, for feeding into a bloom blur chain. */
export function brightPassSpec(options: BrightPassOptions): PassSpec {
  return {
    name: options.name,
    fragment: `
vec4 s = texture(uSource, vUv);
float l = luma(s.rgb);
float w = smoothstep(${options.thresholdExpr}, ${options.thresholdExpr} + ${options.kneeExpr}, l);
fragColor = s * w;
`,
    inputs: [{ uniform: "uSource", from: options.input }],
    output: { target: options.output, scale: options.scale },
  };
}
