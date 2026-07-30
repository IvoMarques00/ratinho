/// <reference lib="dom" />
// Browser-side harness: a self-contained global (bundles render-core's GL
// layer + ani-core's resizeRGBA/resolveParams) that Node/Playwright
// injects into a headless page via page.addScriptTag. Talks to Node
// exclusively via plain JSON + base64 so it works across the
// page.evaluate() boundary without relying on typed-array transfer. Its
// only job is (de)serialization — the actual rendering is bakeCursorFrames()
// from ../bake.js, the same function the interactive web app calls
// directly, so both paths render identically by construction.
import type { RGBAImage } from "ani-core";
import { bakeCursorFrames } from "../bake.js";
import { listEffects } from "../effects/index.js";

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

export function listEffectIds(): string[] {
  return listEffects().map((e) => e.id);
}

export function bakeFrames(req: BakeRequest): BakedFramePayload[] {
  const sourceImage: RGBAImage = {
    width: req.sourceWidth,
    height: req.sourceHeight,
    data: new Uint8ClampedArray(decodeBase64ToBytes(req.sourceRgbaBase64)),
  };

  const canvas = document.createElement("canvas");
  const frames = bakeCursorFrames(canvas, {
    effectId: req.effectId,
    sourceImage,
    size: req.size,
    frameCount: req.frameCount,
    fps: req.fps,
    supersample: req.supersample,
    seed: req.seed,
    params: req.params,
  });

  return frames.map((f) => ({
    width: f.width,
    height: f.height,
    delayMs: f.delayMs,
    rgbaBase64: encodeBytesToBase64(f.data),
  }));
}
