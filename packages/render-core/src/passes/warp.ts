import type { PassSpec, ResolvedParams } from "../types.js";

// Namespaced ("uWarp...") so these pass-local uniforms never collide with
// an effect's own schema uniforms, same convention as blur.ts's "uBlur...".
const WARP_DECLARATIONS = `
uniform vec2 uWarpCenter;
uniform int uWarpTurns;
uniform float uWarpTwist;
uniform float uWarpTwistFalloff;
uniform float uWarpEdgeRadius;
uniform float uWarpEdgeSoftness;
uniform int uWarpRingCount;
uniform float uWarpRingMaxRadius;
uniform float uWarpRingWidth;
uniform float uWarpRingPush;
uniform vec4 uWarpRingTint;
uniform float uWarpRingGlow;
`;

// Combines two independently-zeroable displacement models in one fragment:
// a continuous spin ("twist") plus a static per-radius bend, and an
// outward-traveling ring pulse with an optional additive glow at the ring
// itself (visible even on flat-colored source art, not just as distortion).
// A vignette mix back to the un-warped sample near the canvas rim avoids
// ugly clamp seams when a strong twist pushes UVs outside [0,1].
const WARP_FRAGMENT = `
vec2 c = vUv - uWarpCenter;
float r = length(c);

float falloffT = 1.0 / (1.0 + uWarpTwistFalloff * r * r);
float angle = TAU * float(uWarpTurns) * uPhase + uWarpTwist * falloffT;
vec2 twistedUv = uWarpCenter + rot2(angle) * c;

float ringCountF = float(max(uWarpRingCount, 1));
float ringPhase = fract(uPhase * ringCountF);
float ringR = ringPhase * uWarpRingMaxRadius;
float d = r - ringR;
float ringMask = exp(-(d * d) / max(1e-5, 2.0 * uWarpRingWidth * uWarpRingWidth));
vec2 dir = c / max(r, 1e-5);
vec2 warpedUv = twistedUv + dir * ringMask * uWarpRingPush;

float edge = vignette(vUv, uWarpCenter, uWarpEdgeRadius, uWarpEdgeSoftness);
vec2 finalUv = mix(vUv, warpedUv, edge);

vec4 base = sampleClamped(uTex, finalUv);
vec3 rgb = base.rgb + uWarpRingTint.rgb * ringMask * uWarpRingGlow;
float a = clamp(base.a + uWarpRingTint.a * ringMask * uWarpRingGlow, 0.0, 1.0);
fragColor = vec4(rgb, a);
`;

type NumberSource = number | ((params: ResolvedParams) => number);
type ColorSource = [number, number, number, number] | ((params: ResolvedParams) => [number, number, number, number]);

export interface RadialWarpPassOptions {
  name: string;
  input: string;
  output: string;
  scale?: number;
  /** UV-space warp center. Defaults to [0.5, 0.5]. */
  center?: [number, number];
  /** Continuous spin, in full turns per loop. */
  turns: NumberSource;
  /** Static per-radius bend, in radians, independent of uPhase. */
  twist: NumberSource;
  /** How quickly the twist bend fades with radius (0 = uniform across the whole image). */
  twistFalloff: NumberSource;
  /** UV-space radius where the warp fully fades out to the un-warped sample. */
  edgeRadius: NumberSource;
  edgeSoftness?: number;
  /** Number of ring pulses per loop. */
  ringCount: NumberSource;
  /** UV-space radius the ring travels to over one pulse. */
  ringMaxRadius: NumberSource;
  /** UV-space Gaussian half-width of the ring band. */
  ringWidth: NumberSource;
  /** UV-space outward displacement applied at the ring. */
  ringPush: NumberSource;
  /** Additive glow color drawn at the ring itself, in linear RGBA (0..1). */
  ringTint?: ColorSource;
  ringGlow?: NumberSource;
}

function asFn(value: NumberSource | undefined, fallback = 0): (params: ResolvedParams) => number {
  return typeof value === "function" ? value : () => value ?? fallback;
}

/**
 * A reusable radial-distortion pass: a spin/twist warp and an expanding
 * ring pulse, sharing one fragment so effects that only want one half
 * (e.g. Vortex Swirl's twist-only, Shockwave Ping's ring-only) can zero
 * out the other via its options rather than duplicating GLSL.
 */
export function radialWarpPass(options: RadialWarpPassOptions): PassSpec {
  const turns = asFn(options.turns);
  const twist = asFn(options.twist);
  const twistFalloff = asFn(options.twistFalloff, 1);
  const edgeRadius = asFn(options.edgeRadius, 0.5);
  const ringCount = asFn(options.ringCount, 1);
  const ringMaxRadius = asFn(options.ringMaxRadius);
  const ringWidth = asFn(options.ringWidth, 0.05);
  const ringPush = asFn(options.ringPush);
  const ringGlow = asFn(options.ringGlow);
  const ringTintOption = options.ringTint;
  const ringTint: (params: ResolvedParams) => [number, number, number, number] =
    typeof ringTintOption === "function" ? ringTintOption : () => ringTintOption ?? [0, 0, 0, 0];
  const center = options.center ?? [0.5, 0.5];
  const edgeSoftness = options.edgeSoftness ?? 0.15;

  return {
    name: options.name,
    fragment: WARP_FRAGMENT,
    declarations: WARP_DECLARATIONS,
    inputs: [{ uniform: "uTex", from: options.input }],
    output: { target: options.output, scale: options.scale },
    uniforms: (ctx) => ({
      uWarpCenter: center,
      uWarpTurns: turns(ctx.params),
      uWarpTwist: twist(ctx.params),
      uWarpTwistFalloff: twistFalloff(ctx.params),
      uWarpEdgeRadius: edgeRadius(ctx.params),
      uWarpEdgeSoftness: edgeSoftness,
      uWarpRingCount: ringCount(ctx.params),
      uWarpRingMaxRadius: ringMaxRadius(ctx.params),
      uWarpRingWidth: ringWidth(ctx.params),
      uWarpRingPush: ringPush(ctx.params),
      uWarpRingTint: ringTint(ctx.params),
      uWarpRingGlow: ringGlow(ctx.params),
    }),
  };
}
