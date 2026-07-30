// Browser-only GL entry point (requires a DOM canvas). Kept separate from
// the pure "." entry so Node/CLI code that only needs schema/plan/etc.
// never pulls in WebGL-dependent code.

export { ShaderRenderer } from "./gl/renderer.js";
export type { RenderFrameOptions } from "./gl/renderer.js";
export { createGl2, createFullscreenTriangle, drawFullscreenTriangle } from "./gl/context.js";
export { compileProgram, setUniform } from "./gl/program.js";
export type { CompiledProgram, UniformInfo, UniformValue } from "./gl/program.js";
export { TargetPool } from "./gl/targets.js";
export type { RenderTarget } from "./gl/targets.js";
export { uploadImageTexture, readTarget, flipRowsY } from "./gl/texture.js";
export { bakeCursorFrames } from "./bake.js";
export type { BakeCursorFramesOptions } from "./bake.js";
export * from "./effects/index.js";
export * from "./index.js";
