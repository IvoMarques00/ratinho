/// <reference lib="dom" />
import { detectImageFormat } from "./detect.js";
import type { RGBAImage } from "../types.js";

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
  const { width, height } = bitmap; // ImageBitmap.close() zeroes width/height, so capture these first
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire a 2D canvas context");
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  bitmap.close();
  return { width, height, data: imageData.data };
}
