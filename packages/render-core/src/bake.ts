/// <reference lib="dom" />
import type { Frame, RGBAImage } from "ani-core";
import { resizeRGBA } from "ani-core";
import { getEffect } from "./effects/index.js";
import { ShaderRenderer } from "./gl/renderer.js";
import { resolveParams } from "./schema.js";
import { delayMsForFps } from "./timing.js";

export interface BakeCursorFramesOptions {
  effectId: string;
  sourceImage: RGBAImage;
  /** Target cursor pixel size (square). */
  size: number;
  frameCount: number;
  fps: number;
  /** Internal render resolution multiplier. Auto-chosen from `size` if omitted. */
  supersample?: number;
  seed?: number;
  /** Raw, unresolved param overrides — validated against the effect's schema. */
  params?: Record<string, unknown>;
}

function autoSupersample(size: number): number {
  return Math.min(4, Math.max(1, Math.floor(256 / size)));
}

/**
 * Renders `frameCount` frames of a registered shader effect for a given
 * source image, each resolved to the final cursor `size` via ani-core's
 * existing (tested) Lanczos resampler. This is the ONE bake
 * implementation — both the interactive web app and the headless-
 * Chromium harness (src/harness/entry.ts) call this directly, so the
 * live preview and the exported .ani are guaranteed to come from
 * identical code, not just identical-looking reimplementations.
 */
export function bakeCursorFrames(canvas: HTMLCanvasElement | OffscreenCanvas, options: BakeCursorFramesOptions): Frame[] {
  const effect = getEffect(options.effectId);
  const resolved = resolveParams(effect.schema, options.params ?? {});
  const supersample = options.supersample ?? autoSupersample(options.size);
  const renderSize = options.size * supersample;
  const canvasSize = Math.round(renderSize * (1 + 2 * effect.padding));

  const renderer = new ShaderRenderer(canvas);
  const delayMs = delayMsForFps(options.fps);
  const frames: Frame[] = [];
  try {
    for (let i = 0; i < options.frameCount; i++) {
      const rendered = renderer.renderFrame(effect, resolved, {
        frameIndex: i,
        frameCount: options.frameCount,
        fps: options.fps,
        seed: options.seed ?? 0,
        sourceImage: options.sourceImage,
        canvasSize,
        supersample,
      });
      const finalImage = resizeRGBA(rendered, options.size, options.size);
      frames.push({ ...finalImage, delayMs });
    }
  } finally {
    renderer.dispose();
  }
  return frames;
}
