/// <reference lib="dom" />
import type { BufferSlot } from "../plan.js";

export interface RenderTarget {
  name: string;
  width: number;
  height: number;
  format: BufferSlot["format"];
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

/** Creates/reuses named FBO+texture render targets by (name, size, format), matching a plan's BufferSlot[]. */
export class TargetPool {
  private targets = new Map<string, RenderTarget>();

  constructor(private gl: WebGL2RenderingContext) {}

  ensure(slot: BufferSlot): RenderTarget {
    const existing = this.targets.get(slot.name);
    if (existing && existing.width === slot.width && existing.height === slot.height && existing.format === slot.format) {
      return existing;
    }
    if (existing) this.disposeOne(existing);

    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("Failed to create texture");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const internalFormat = slot.format === "rgba16f" ? gl.RGBA16F : gl.RGBA8;
    const type = slot.format === "rgba16f" ? gl.FLOAT : gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, slot.width, slot.height, 0, gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) throw new Error("Failed to create framebuffer");
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer for render target "${slot.name}" is incomplete (status ${status})`);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const target: RenderTarget = { name: slot.name, width: slot.width, height: slot.height, format: slot.format, texture, framebuffer };
    this.targets.set(slot.name, target);
    return target;
  }

  get(name: string): RenderTarget {
    const target = this.targets.get(name);
    if (!target) throw new Error(`Render target "${name}" has not been created yet`);
    return target;
  }

  disposeAll(): void {
    for (const target of this.targets.values()) this.disposeOne(target);
    this.targets.clear();
  }

  private disposeOne(target: RenderTarget): void {
    this.gl.deleteTexture(target.texture);
    this.gl.deleteFramebuffer(target.framebuffer);
  }
}
