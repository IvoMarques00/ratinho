/// <reference lib="dom" />
import { buildFragmentSource } from "../glsl/assemble.js";
import { FRAGMENT_PRELUDE, VERTEX_SHADER_SOURCE } from "../glsl/prelude.js";
import { planPasses } from "../plan.js";
import { phaseForFrame } from "../timing.js";
import { createFullscreenTriangle, createGl2, drawFullscreenTriangle } from "./context.js";
import { compileProgram, setUniform } from "./program.js";
import type { CompiledProgram } from "./program.js";
import { TargetPool } from "./targets.js";
import { readTarget, uploadImageTexture } from "./texture.js";
import type { EffectDefinition, ResolvedParams, UniformSpec } from "../types.js";
import type { RGBAImage } from "ani-core";

const INGEST_FRAGMENT_SOURCE = `${FRAGMENT_PRELUDE}
uniform sampler2D uUpload;
void main() {
  vec2 centered = (vUv - 0.5) / uContentScale + 0.5;
  if (centered.x < 0.0 || centered.x > 1.0 || centered.y < 0.0 || centered.y > 1.0) {
    fragColor = vec4(0.0);
    return;
  }
  vec4 c = texture(uUpload, centered);
  fragColor = vec4(c.rgb * c.a, c.a);
}
`;

export interface RenderFrameOptions {
  frameIndex: number;
  frameCount: number;
  fps: number;
  seed?: number;
  sourceImage: RGBAImage;
  /** Full render resolution (square), i.e. cursor size * supersample * (1 + 2*padding), computed by the caller. */
  canvasSize: number;
  supersample?: number;
}

/** Converts a resolved schema value into the flat numeric/boolean shape setUniform() expects. */
function uniformValueForGl(spec: UniformSpec, value: ResolvedParams[string]): number | boolean | number[] {
  if (spec.type === "enum") {
    const index = spec.options.findIndex((o) => o.value === value);
    return index;
  }
  return value as number | boolean | number[];
}

export class ShaderRenderer {
  private gl: WebGL2RenderingContext;
  private targets: TargetPool;
  private quadVao: WebGLVertexArrayObject;
  private ingestProgram: CompiledProgram;
  private programCache = new Map<string, CompiledProgram>();

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.gl = createGl2(canvas);
    this.targets = new TargetPool(this.gl);
    this.quadVao = createFullscreenTriangle(this.gl);
    this.ingestProgram = compileProgram(this.gl, VERTEX_SHADER_SOURCE, INGEST_FRAGMENT_SOURCE);
  }

  private getOrCompile(effect: EffectDefinition, passName: string, fragmentSource: string): CompiledProgram {
    const key = `${effect.id}::${passName}`;
    let compiled = this.programCache.get(key);
    if (!compiled) {
      compiled = compileProgram(this.gl, VERTEX_SHADER_SOURCE, fragmentSource);
      this.programCache.set(key, compiled);
    }
    return compiled;
  }

  /** Renders one frame of `effect` and reads it back as a straight-alpha RGBA8 image. */
  renderFrame(effect: EffectDefinition, resolvedParams: ResolvedParams, opts: RenderFrameOptions): RGBAImage {
    const gl = this.gl;
    const plan = planPasses(effect, resolvedParams, opts.canvasSize);

    for (const slot of plan.buffers) {
      this.targets.ensure(slot);
    }

    const sourceTarget = this.targets.get("source");
    const contentScale = opts.sourceImage.width / opts.canvasSize;

    // Ingest pass: upload the raw source image, then draw it centered/padded/premultiplied into "source".
    const uploadTex = uploadImageTexture(gl, opts.sourceImage);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sourceTarget.framebuffer);
    gl.viewport(0, 0, sourceTarget.width, sourceTarget.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.ingestProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, uploadTex);
    setUniform(gl, this.ingestProgram, "uUpload", 0);
    setUniform(gl, this.ingestProgram, "uContentScale", contentScale);
    drawFullscreenTriangle(gl, this.quadVao);
    gl.deleteTexture(uploadTex);

    const phase = phaseForFrame(opts.frameIndex, opts.frameCount);
    const builtins: Record<string, number | number[]> = {
      uPhase: phase,
      uTime: opts.frameIndex / opts.fps,
      uFrame: opts.frameIndex,
      uFrameCount: opts.frameCount,
      uResolution: [opts.canvasSize, opts.canvasSize],
      uTexel: [1 / opts.canvasSize, 1 / opts.canvasSize],
      uSupersample: opts.supersample ?? 1,
      uSeed: opts.seed ?? 0,
      uContentScale: contentScale,
    };

    for (const plannedPass of plan.passes) {
      const fragmentSource = buildFragmentSource(effect, plannedPass);
      const compiled = this.getOrCompile(effect, plannedPass.name, fragmentSource);
      const outputTarget = this.targets.get(plannedPass.outputBuffer);

      gl.bindFramebuffer(gl.FRAMEBUFFER, outputTarget.framebuffer);
      gl.viewport(0, 0, outputTarget.width, outputTarget.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(compiled.program);

      let unit = 0;
      for (const input of plannedPass.inputs) {
        const inputTarget = this.targets.get(input.bufferName);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, inputTarget.texture);
        setUniform(gl, compiled, input.uniform, unit);
        unit++;
      }

      for (const [name, value] of Object.entries(builtins)) {
        setUniform(gl, compiled, name, value);
      }

      for (const [key, spec] of Object.entries(effect.schema)) {
        const glslName = spec.glslName ?? `u${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        const resolvedValue = resolvedParams[key];
        if (resolvedValue === undefined) {
          throw new Error(`Missing resolved value for schema key "${key}" — resolveParams() should have filled a default`);
        }
        setUniform(gl, compiled, glslName, uniformValueForGl(spec, resolvedValue));
      }

      if (plannedPass.uniformsFn) {
        const extra = plannedPass.uniformsFn({ params: resolvedParams, passIndex: plannedPass.passIndex });
        for (const [name, value] of Object.entries(extra)) {
          setUniform(gl, compiled, name, value as number | boolean | number[]);
        }
      }

      drawFullscreenTriangle(gl, this.quadVao);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return readTarget(gl, this.targets.get("output"));
  }

  dispose(): void {
    this.targets.disposeAll();
    this.gl.deleteVertexArray(this.quadVao);
    this.gl.deleteProgram(this.ingestProgram.program);
    for (const compiled of this.programCache.values()) {
      this.gl.deleteProgram(compiled.program);
    }
    this.programCache.clear();
  }
}
