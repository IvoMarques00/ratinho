import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Frame, RGBAImage } from "ani-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface RenderFramesHeadlessOptions {
  effectId: string;
  sourceImage: RGBAImage;
  size: number;
  frameCount: number;
  fps: number;
  supersample?: number;
  seed?: number;
  params?: Record<string, unknown>;
  /** Defaults to $RATINHO_CHROMIUM, then "/opt/pw-browsers/chromium". */
  chromiumPath?: string;
}

function encodeBytesToBase64(bytes: Uint8Array | Uint8ClampedArray): string {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}

function decodeBase64ToBytes(b64: string): Uint8ClampedArray<ArrayBuffer> {
  return new Uint8ClampedArray(Buffer.from(b64, "base64"));
}

function findHarnessBundleSource(): string {
  // node-entry.ts and harness/entry.ts both build flat into dist/, as
  // sibling files (dist/node-entry.js, dist/harness.global.js) — no
  // relative traversal needed once compiled.
  const bundlePath = path.join(__dirname, "harness.global.js");
  try {
    return readFileSync(bundlePath, "utf8");
  } catch {
    throw new Error(
      `render-core's browser harness bundle was not found at ${bundlePath}. Run "npm run build -w packages/render-core" first.`,
    );
  }
}

async function loadPlaywright(): Promise<typeof import("playwright-core")> {
  try {
    return await import("playwright-core");
  } catch {
    throw new Error(
      'The shader-effect render path requires "playwright-core" (an optional devDependency of render-core). Run "npm install" at the repo root, or run packages/render-core/scripts/check-webgl.mjs to diagnose.',
    );
  }
}

function resolveChromiumPath(explicit?: string): string {
  return explicit ?? process.env.RATINHO_CHROMIUM ?? "/opt/pw-browsers/chromium";
}

/**
 * Renders `frameCount` frames of a shader effect headlessly, by launching
 * Chromium and running the exact same browser bundle (harness.global.js,
 * which itself calls bakeCursorFrames() — the same function the
 * interactive web app calls directly) that the interactive app uses.
 * This is what gives the Node/skill path strict parity with the browser:
 * not a reimplementation, the literal same rendering code, executed in a
 * real browser engine either way.
 */
export async function renderFramesHeadless(options: RenderFramesHeadlessOptions): Promise<Frame[]> {
  const { chromium } = await loadPlaywright();
  const harnessSource = findHarnessBundleSource();
  const executablePath = resolveChromiumPath(options.chromiumPath);

  const browser = await chromium.launch({ executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent("<!doctype html><html><body></body></html>");
    await page.addScriptTag({ content: harnessSource });

    const sourceRgbaBase64 = encodeBytesToBase64(options.sourceImage.data);
    const request = {
      effectId: options.effectId,
      sourceWidth: options.sourceImage.width,
      sourceHeight: options.sourceImage.height,
      sourceRgbaBase64,
      size: options.size,
      frameCount: options.frameCount,
      fps: options.fps,
      supersample: options.supersample,
      seed: options.seed,
      params: options.params,
    };

    const payload = await page.evaluate(
      (req) => (window as unknown as { RatinhoRender: { bakeFrames: (r: typeof req) => unknown[] } }).RatinhoRender.bakeFrames(req),
      request,
    );

    return (payload as { width: number; height: number; delayMs: number; rgbaBase64: string }[]).map((f) => ({
      width: f.width,
      height: f.height,
      delayMs: f.delayMs,
      data: decodeBase64ToBytes(f.rgbaBase64),
    }));
  } finally {
    await browser.close();
  }
}
