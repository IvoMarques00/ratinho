import { buildAni } from "./encode/ani.js";
import { encodeCur } from "./encode/ico.js";
import { extractGifFrames } from "./gif/extract.js";
import { resizeRGBA } from "./resize/resample.js";
import { synthesizeFrames } from "./synth/index.js";
import type { AniResult, ConvertOptions, CursorSize, Frame, Hotspot, RGBAImage } from "./types.js";

const DEFAULT_SIZES: CursorSize[] = [32];
const DEFAULT_STATIC_DELAY_MS = 100;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function encodeFrameAsCur(frame: RGBAImage, sizes: CursorSize[], hotspot?: Hotspot): Uint8Array {
  const images = sizes.map((size) => resizeRGBA(frame, size, size));
  return encodeCur(images, hotspot);
}

/**
 * Shared downstream pipeline: resize each frame to the requested cursor
 * size(s) and encode a multi-size CUR blob per frame, then assemble the
 * .ani container. Identical whether frames came from GIF extraction or
 * single-image synthesis — neither of those callers is visible past here.
 */
export function framesToAni(frames: Frame[], options: ConvertOptions = {}): AniResult {
  if (frames.length === 0) {
    throw new Error("framesToAni requires at least one frame");
  }
  const sizes = options.sizes ?? DEFAULT_SIZES;

  const aniFrames = frames.map((frame) => ({
    cur: encodeFrameAsCur(frame, sizes, options.hotspot),
    delayMs: frame.delayMs,
  }));

  const bytes = buildAni(aniFrames);
  return { bytes, frameCount: frames.length };
}

/** Converts a single decoded static image into a .ani, synthesizing frames if `options.synth` is set. */
export function convertImageToAni(image: RGBAImage, options: ConvertOptions = {}): AniResult {
  const frames: Frame[] = options.synth
    ? synthesizeFrames(image, options.synth)
    : [{ ...image, delayMs: DEFAULT_STATIC_DELAY_MS }];
  return framesToAni(frames, options);
}

/** Converts an animated GIF's real frames (with correct disposal-method compositing) into a .ani. */
export function convertGifToAni(gifInput: Uint8Array | ArrayBuffer, options: ConvertOptions = {}): AniResult {
  const buffer = gifInput instanceof Uint8Array ? toArrayBuffer(gifInput) : gifInput;
  const frames = extractGifFrames(buffer);
  return framesToAni(frames, options);
}

/** Encodes a single-frame static .cur from a decoded image (no animation). */
export function convertImageToCur(image: RGBAImage, options: Pick<ConvertOptions, "sizes" | "hotspot"> = {}): Uint8Array {
  const sizes = options.sizes ?? DEFAULT_SIZES;
  return encodeFrameAsCur(image, sizes, options.hotspot);
}
