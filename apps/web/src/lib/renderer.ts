// bakeCursorFrames() (render-core) constructs and disposes its own
// ShaderRenderer per call — but per the WebGL spec, repeated
// canvas.getContext("webgl2", <same attributes>) calls on the SAME
// canvas element return the SAME underlying context rather than
// creating a new one. So reusing one persistent canvas here (instead of
// creating a fresh canvas per bake) avoids real WebGL-context churn —
// each ShaderRenderer instance just re-wraps the same context — while
// keeping bake.ts's already-tested contract untouched.
let sharedCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;

export function getSharedCanvas(): OffscreenCanvas | HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
  }
  return sharedCanvas;
}
