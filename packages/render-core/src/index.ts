// Pure, environment-agnostic public API: types, schema resolution, timing,
// and the GL-free render plan. No GL, no DOM, no Node-only imports — this
// is what the CLI uses to validate --effect-param before ever launching a
// browser, and what Vitest exercises without a WebGL context.

export * from "./types.js";
export * from "./schema.js";
export * from "./timing.js";
export * from "./plan.js";
export * from "./glsl/assemble.js";
export * from "./glsl/lint.js";
export { GLSL_LIB } from "./glsl/lib.js";
export { FRAGMENT_PRELUDE, VERTEX_SHADER_SOURCE } from "./glsl/prelude.js";
// Effect definitions are just data (schema + GLSL source strings) — no GL
// context needed to enumerate/describe them, so this is safe from the
// pure entry point too (lets e.g. `--list-effects` avoid launching a
// browser just to answer "what effects exist").
export * from "./effects/index.js";
