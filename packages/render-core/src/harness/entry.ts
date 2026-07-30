/// <reference lib="dom" />
// Browser-side harness: a self-contained global (bundles render-core's GL
// layer + ani-core's resizeRGBA) that Node/Playwright injects into a
// headless page via page.addScriptTag, and that the interactive web app
// could in principle load the same way for parity testing. Talks to Node
// exclusively via plain JSON + base64 so it works across the
// page.evaluate() boundary without relying on typed-array transfer.
import type { Frame, RGBAImage } from "ani-core";
import { resizeRGBA } from "ani-core";
import { getEffect, listEffects } from "../effects/index.js";
import { ShaderRenderer } from "../gl/renderer.js";
import { resolveParams } from "../schema.js";
import { delayMsForFps } from "../timing.js";

function decodeBase64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeBytesToBase64(bytes: Uint8Array | Uint8ClampedArray): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export interface BakeRequest {
  effectId: string;
  sourceWidth: number;
  sourceHeight: number;
  /** Base64 of the raw RGBA8 source bytes (width*height*4 bytes). */
  sourceRgbaBase64: string;
  size: number;
  frameCount: number;
  fps: number;
  supersample?: number;
  seed?: number;
  params?: Record<string, unknown>;
}

export interface BakedFramePayload {
  width: number;
  height: number;
  delayMs: number;
  rgbaBase64: string;
}

function autoSupersample(size: number): number {
  return Math.min(4, Math.max(1, Math.floor(256 / size)));
}

export function listEffectIds(): string[] {
  return listEffects().map((e) => e.id);
}

export function bakeFrames(req: BakeRequest): BakedFramePayload[] {
  const effect = getEffect(req.effectId);
  const resolved = resolveParams(effect.schema, req.params ?? {});
  const supersample = req.supersample ?? autoSupersample(req.size);
  const renderSize = req.size * supersample;
  const canvasSize = Math.round(renderSize * (1 + 2 * effect.padding));

  const sourceImage: RGBAImage = {
    width: req.sourceWidth,
    height: req.sourceHeight,
    data: new Uint8ClampedArray(decodeBase64ToBytes(req.sourceRgbaBase64)),
  };

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const renderer = new ShaderRenderer(canvas);

  const delayMs = delayMsForFps(req.fps);
  const out: BakedFramePayload[] = [];
  try {
    for (let i = 0; i < req.frameCount; i++) {
      const rendered = renderer.renderFrame(effect, resolved, {
        frameIndex: i,
        frameCount: req.frameCount,
        fps: req.fps,
        seed: req.seed ?? 0,
        sourceImage,
        canvasSize,
        supersample,
      });
      const final: Frame = { ...resizeRGBA(rendered, req.size, req.size), delayMs };
      out.push({ width: final.width, height: final.height, delayMs: final.delayMs, rgbaBase64: encodeBytesToBase64(final.data) });
    }
  } finally {
    renderer.dispose();
  }
  return out;
}

