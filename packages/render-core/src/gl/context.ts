/// <reference lib="dom" />

/** Creates a WebGL2 context with the extensions the pipeline depends on. Throws with a clear message if unavailable. */
export function createGl2(canvas: HTMLCanvasElement | OffscreenCanvas): WebGL2RenderingContext {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
  }) as WebGL2RenderingContext | null;

  if (!gl) {
    throw new Error("WebGL2 is not available in this environment (run packages/render-core/scripts/check-webgl.mjs to diagnose)");
  }

  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw new Error("Required WebGL2 extension EXT_color_buffer_float is not available — RGBA16F render targets won't work");
  }
  // Improves blur/glow filtering quality when available; not required.
  gl.getExtension("OES_texture_float_linear");

  return gl;
}

/** A single big triangle covering clip space — avoids the shared-edge seam of a two-triangle quad. */
export function createFullscreenTriangle(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();
  if (!vao) throw new Error("Failed to create VAO");
  gl.bindVertexArray(vao);

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("Failed to create vertex buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  return vao;
}

export function drawFullscreenTriangle(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject): void {
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
}
