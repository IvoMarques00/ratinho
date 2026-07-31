import { createGl2 } from "render-core/gl";

function detectWebGL2Support(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = createGl2(canvas);
    // Immediately release — this is a throwaway probe, not a real render.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

// Computed once at module load (not lazily on shader-engine selection) so
// StylePicker can disable the shader optgroup before a user ever picks a
// doomed option. Reuses render-core's own createGl2() (which also
// requires EXT_color_buffer_float, hard-required by ShaderRenderer)
// rather than a separate, weaker check that could report "supported"
// when the real renderer would still throw.
export const webgl2Supported: boolean = detectWebGL2Support();
