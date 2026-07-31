import type { PassSpec, ResolvedParams } from "../types.js";

// Namespaced ("uGrain...") so this pass-local uniform never collides with
// an effect's own schema uniforms, same convention as blur.ts's "uBlur...".
const GRAIN_DECLARATIONS = `uniform float uGrainCellSize;\n`;

// Input-free: a procedural noise field, no source texture needed. Reseeded
// once per baked frame (not per-pixel-random-every-call) via an integer
// bucket of fract(uPhase), so the same frame index always produces the
// same noise — deterministic and bake-reproducible, matching every other
// effect's determinism guarantee.
const GRAIN_FRAGMENT = `
vec2 cell = floor(vUv * uResolution / max(uGrainCellSize, 1.0));
float frameBucket = floor(fract(uPhase) * float(uFrameCount) + 0.5);
float n = hash12(cell + vec2(uSeed * 97.0, frameBucket * 131.0));
fragColor = vec4(vec3(n), 1.0);
`;

export interface GrainPassOptions {
  name: string;
  output: string;
  scale?: number;
  /** Noise cell size in output pixels — larger values give coarser, blockier grain. */
  cellSize: number | ((params: ResolvedParams) => number);
}

/**
 * A reusable procedural noise pass with no texture input. The output's
 * red channel carries raw 0..1 noise; consumers remap to -1..1 themselves
 * (`(n - 0.5) * 2.0`) since some uses (dissolve/dither) want the raw range.
 */
export function grainPassSpec(options: GrainPassOptions): PassSpec {
  const cellSize = typeof options.cellSize === "function" ? options.cellSize : () => options.cellSize as number;
  return {
    name: options.name,
    fragment: GRAIN_FRAGMENT,
    declarations: GRAIN_DECLARATIONS,
    inputs: [],
    output: { target: options.output, scale: options.scale },
    uniforms: (ctx) => ({ uGrainCellSize: cellSize(ctx.params) }),
  };
}
