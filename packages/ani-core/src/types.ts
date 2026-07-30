export interface RGBAImage {
  width: number;
  height: number;
  /** RGBA8, non-premultiplied, row-major, top-down. Length === width*height*4. */
  data: Uint8ClampedArray<ArrayBuffer>;
}

export interface Frame extends RGBAImage {
  /** Display duration for this frame, in milliseconds. */
  delayMs: number;
}

export interface Hotspot {
  x: number;
  y: number;
}

export type StyleName = "none" | "pulse" | "wiggle" | "bounce" | "rotate";

export interface StyleParams {
  /** Amplitude of the effect, roughly 0..1, meaning depends on style. */
  amplitude?: number;
  /** Number of oscillation cycles across the loop (wiggle/bounce). */
  cycles?: number;
  /** Max rotation angle in degrees (wiggle/rotate "rock" mode). */
  maxAngleDeg?: number;
  /** Rotate style: "spin" for continuous 360 rotation, "rock" for oscillating. */
  rotateMode?: "spin" | "rock";
}

export interface SynthesizeOptions {
  style: StyleName;
  frameCount: number;
  fps: number;
  params?: StyleParams;
}

export type CursorSize = 32 | 48 | 64;

export interface ConvertOptions {
  /** Cursor pixel sizes to embed in each frame's CUR blob. Defaults to [32]. */
  sizes?: CursorSize[];
  hotspot?: Hotspot;
  /** Used only when the source is a single static image (not a GIF). */
  synth?: SynthesizeOptions;
}

export interface AniResult {
  bytes: Uint8Array;
  frameCount: number;
}
