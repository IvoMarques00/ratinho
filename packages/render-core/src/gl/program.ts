/// <reference lib="dom" />

export interface UniformInfo {
  location: WebGLUniformLocation;
  type: number;
}

export interface CompiledProgram {
  program: WebGLProgram;
  uniforms: Map<string, UniformInfo>;
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    const kind = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
    throw new Error(`${kind} shader compile error: ${log}\n--- source ---\n${numberedLines(source)}`);
  }
  return shader;
}

function numberedLines(source: string): string {
  return source
    .split("\n")
    .map((line, i) => `${i + 1}: ${line}`)
    .join("\n");
}

export function compileProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): CompiledProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${log}`);
  }

  const uniforms = new Map<string, UniformInfo>();
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, "");
    const location = gl.getUniformLocation(program, name);
    if (location) uniforms.set(name, { location, type: info.type });
  }

  return { program, uniforms };
}

export type UniformValue = number | boolean | number[];

/** Sets a uniform by name if (and only if) it's active in the linked program — unused uniforms are silently skipped, not an error. */
export function setUniform(gl: WebGL2RenderingContext, compiled: CompiledProgram, name: string, value: UniformValue): void {
  const info = compiled.uniforms.get(name);
  if (!info) return;
  const { location, type } = info;

  switch (type) {
    case gl.FLOAT:
      gl.uniform1f(location, value as number);
      return;
    case gl.FLOAT_VEC2:
      gl.uniform2fv(location, value as number[]);
      return;
    case gl.FLOAT_VEC3:
      gl.uniform3fv(location, value as number[]);
      return;
    case gl.FLOAT_VEC4:
      gl.uniform4fv(location, value as number[]);
      return;
    case gl.INT:
    case gl.BOOL:
    case gl.SAMPLER_2D: {
      const n = typeof value === "boolean" ? (value ? 1 : 0) : Math.round(value as number);
      gl.uniform1i(location, n);
      return;
    }
    default:
      throw new Error(`Unsupported uniform GL type ${type} for "${name}"`);
  }
}
