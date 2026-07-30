/// <reference lib="dom" />
import type { RGBAImage } from "ani-core";
import type { RenderTarget } from "./targets.js";

/** Uploads a decoded RGBA8 image as a plain (non-FBO) sampling source texture. */
export function uploadImageTexture(gl: WebGL2RenderingContext, image: RGBAImage): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Failed to create texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

/**
 * readPixels() returns rows bottom-up; RGBAImage is documented top-down.
 * This is the single, pure, unit-tested place that flip happens.
 */
export function flipRowsY(data: Uint8ClampedArray<ArrayBufferLike>, width: number, height: number): Uint8ClampedArray<ArrayBuffer> {
  const rowBytes = width * 4;
  if (data.length !== rowBytes * height) {
    throw new Error(`flipRowsY: data length ${data.length} does not match ${width}x${height}x4`);
  }
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    const srcStart = y * rowBytes;
    const dstStart = (height - 1 - y) * rowBytes;
    out.set(data.subarray(srcStart, srcStart + rowBytes), dstStart);
  }
  return out;
}

/** Reads back an rgba8 render target into a top-down RGBAImage. Only valid for targets whose format is "rgba8". */
export function readTarget(gl: WebGL2RenderingContext, target: RenderTarget): RGBAImage {
  if (target.format !== "rgba8") {
    throw new Error(`readTarget: target "${target.name}" has format "${target.format}", only "rgba8" targets can be read back`);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  const raw = new Uint8Array(target.width * target.height * 4);
  gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.UNSIGNED_BYTE, raw);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const flipped = flipRowsY(new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.byteLength), target.width, target.height);
  return { width: target.width, height: target.height, data: flipped };
}
