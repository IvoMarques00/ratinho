/// <reference lib="dom" />
import { detectImageFormat } from "./detect.js";
import type { RGBAImage } from "../types.js";

// No cursor-conversion use case needs more source detail than this — the
// final output tops out at 64x64px — but ordinary phone photos routinely
// exceed it (3000-4000px+). Downscaling here (rather than at the source
// texture upload for the shader path, or duplicating the cap at every
// call site) protects both the classic/CPU synth pipeline, which runs
// full-resolution affine transforms synchronously on the main thread and
// can otherwise trigger a "page unresponsive" prompt, and the shader/GPU
// path's texture upload, which otherwise uploads the source at native
// resolution before the ingest pass downsamples it.
const MAX_SOURCE_DIMENSION = 2048;

/**
 * Decodes a PNG/JPEG Blob (or ArrayBuffer) into an RGBAImage using
 * createImageBitmap + OffscreenCanvas. Browser-only entry point — kept
 * separate from decode/node.ts so bundlers never pull pngjs/jpeg-js into
 * the client bundle.
 */
export async function decodeImageBrowser(input: Blob | ArrayBuffer): Promise<RGBAImage> {
  let bytes: Uint8Array | undefined;
  let blob: Blob;
  if (input instanceof Blob) {
    blob = input;
  } else {
    bytes = new Uint8Array(input);
    blob = new Blob([input]);
  }

  if (bytes) {
    // Validate up front so unsupported formats fail with a clear message
    // rather than an opaque browser decode error.
    detectImageFormat(bytes);
  }

  const bitmap = await createImageBitmap(blob);
  const { width: nativeWidth, height: nativeHeight } = bitmap; // ImageBitmap.close() zeroes width/height, so capture these first
  const scale = Math.min(1, MAX_SOURCE_DIMENSION / Math.max(nativeWidth, nativeHeight));
  const width = Math.max(1, Math.round(nativeWidth * scale));
  const height = Math.max(1, Math.round(nativeHeight * scale));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire a 2D canvas context");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  bitmap.close();
  return { width, height, data: imageData.data };
}
