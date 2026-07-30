import jpegjs from "jpeg-js";
import { PNG } from "pngjs";
import { detectImageFormat } from "./detect.js";
import type { RGBAImage } from "../types.js";

/**
 * Decodes a PNG or JPEG buffer into an RGBAImage, using pure-JS decoders
 * (pngjs, jpeg-js) with no native/compiled dependencies, so this runs
 * unmodified anywhere Node runs (including inside the Claude skill's CLI).
 * GIFs are not handled here — use gif/extract.ts's extractGifFrames()
 * instead, since a GIF decodes to multiple frames, not one RGBAImage.
 */
export function decodeImageNode(input: Uint8Array | ArrayBuffer): RGBAImage {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  const format = detectImageFormat(bytes);

  if (format === "png") {
    const png = PNG.sync.read(Buffer.from(bytes));
    return { width: png.width, height: png.height, data: new Uint8ClampedArray(png.data) };
  }

  if (format === "jpeg") {
    const raw = jpegjs.decode(bytes, { useTArray: true, formatAsRGBA: true });
    return { width: raw.width, height: raw.height, data: new Uint8ClampedArray(raw.data) };
  }

  throw new Error("GIF input should be decoded via extractGifFrames(), not decodeImageNode()");
}
