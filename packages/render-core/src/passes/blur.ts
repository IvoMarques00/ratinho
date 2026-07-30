import type { PassSpec, ResolvedParams } from "../types.js";

// Namespaced ("uBlur...") so these pass-local uniforms never collide with
// an effect's own schema uniforms (e.g. an effect with its own "radius"
// param would otherwise clash with a generically-named "uRadius" here).
const BLUR_DECLARATIONS = `uniform vec2 uBlurDir;\nuniform float uBlurRadius;\n`;

// 5-tap linear-sampling Gaussian approximating a 9-tap kernel (weights
// from the classic "efficient Gaussian blur" bilinear-tap trick).
const BLUR_FRAGMENT = `
const float O[3] = float[](0.0, 1.3846153846, 3.2307692308);
const float W[3] = float[](0.2270270270, 0.3162162162, 0.0702702703);
vec2 d = uBlurDir * uTexel * uBlurRadius;
vec4 acc = texture(uTex, vUv) * W[0];
for (int i = 1; i < 3; i++) {
  acc += texture(uTex, vUv + d * O[i]) * W[i];
  acc += texture(uTex, vUv - d * O[i]) * W[i];
}
fragColor = acc;
`;

export interface GaussianBlurPassesOptions {
  /** Prefix used to build unique pass/buffer names, e.g. "bloom". */
  namePrefix: string;
  /** Buffer to read for the first blur iteration. */
  input: string;
  /** Buffer the FINAL iteration writes to (earlier iterations use generated intermediate names). */
  output: string;
  /** Number of full horizontal+vertical blur iterations. */
  iterations: number;
  /** Blur radius in texels — a constant, or computed from resolved params (e.g. for a param-driven blur strength). */
  radius: number | ((params: ResolvedParams) => number);
  /** Output scale relative to canvasSize, applied to every generated pass. */
  scale?: number;
}

/**
 * Builds a flat, alternating horizontal/vertical Gaussian blur pass
 * chain. Shared by any effect that needs a soft blur (bloom's glow,
 * prism's halo) — reused, not reimplemented, across starter effects.
 */
export function gaussianBlurPasses(options: GaussianBlurPassesOptions): PassSpec[] {
  const { namePrefix, input, output, iterations, radius, scale } = options;
  if (iterations < 1) {
    throw new Error(`gaussianBlurPasses: iterations must be >= 1, got ${iterations}`);
  }
  const radiusFn = typeof radius === "function" ? radius : () => radius;

  const passes: PassSpec[] = [];
  let previous = input;

  for (let i = 0; i < iterations; i++) {
    const isLast = i === iterations - 1;
    const hBuffer = `${namePrefix}BlurH${i}`;
    const vBuffer = isLast ? output : `${namePrefix}BlurV${i}`;

    passes.push({
      name: `${namePrefix}BlurH${i}`,
      fragment: BLUR_FRAGMENT,
      declarations: BLUR_DECLARATIONS,
      inputs: [{ uniform: "uTex", from: previous }],
      output: { target: hBuffer, scale },
      uniforms: (ctx) => ({ uBlurDir: [1, 0], uBlurRadius: radiusFn(ctx.params) }),
    });
    passes.push({
      name: `${namePrefix}BlurV${i}`,
      fragment: BLUR_FRAGMENT,
      declarations: BLUR_DECLARATIONS,
      inputs: [{ uniform: "uTex", from: hBuffer }],
      output: { target: vBuffer, scale },
      uniforms: (ctx) => ({ uBlurDir: [0, 1], uBlurRadius: radiusFn(ctx.params) }),
    });

    previous = vBuffer;
  }

  return passes;
}
