import { synthesizeFrames } from "ani-core";
import type { Frame, StyleName, StyleParams } from "ani-core";
import type { SourceState } from "./source";

export interface AnimationOptions {
  style: StyleName;
  frameCount: number;
  fps: number;
  params: StyleParams;
}

/** Produces the Frame[] to preview/export for the current source + animation options. */
export function deriveFrames(source: SourceState, options: AnimationOptions): Frame[] | null {
  if (source.kind === "none") return null;
  if (source.kind === "gif") return source.frames;

  if (options.style === "none") {
    return [{ ...source.image, delayMs: 1000 / options.fps }];
  }
  return synthesizeFrames(source.image, {
    style: options.style,
    frameCount: options.frameCount,
    fps: options.fps,
    params: options.params,
  });
}
