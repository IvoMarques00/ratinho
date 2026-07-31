#!/usr/bin/env node
// GPU-level checks for grain-storm: compiles at min/default/max params,
// grain is genuinely animated (an interior same-alpha pixel's RGB differs
// frame-to-frame at grainAmount=1 while a grainAmount=0 control on the
// same source is stable — proof the flicker is attributable to grain, not
// some other unrelated per-frame variance), silhouette is preserved
// (alpha stays within tolerance despite the flicker), loop closure,
// determinism.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROMIUM_PATH = process.env.RATINHO_CHROMIUM ?? "/opt/pw-browsers/chromium";
const harnessPath = path.join(__dirname, "..", "dist", "harness.global.js");

let harnessSource;
try {
  harnessSource = readFileSync(harnessPath, "utf8");
} catch {
  console.error(`grain-storm: dist/harness.global.js not found — run "npm run build -w packages/render-core" first.`);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`OK: ${msg}`);
}

function toBase64(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}
function fromBase64(b64) {
  return new Uint8ClampedArray(Buffer.from(b64, "base64"));
}

// A large opaque square filling most of the canvas — plenty of interior
// same-alpha pixels to sample for the flicker check.
function makeSquareSource(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  const margin = Math.round(size * 0.15);
  for (let y = margin; y < size - margin; y++) {
    for (let x = margin; x < size - margin; x++) {
      const i = (y * size + x) * 4;
      data[i] = 128;
      data[i + 1] = 128;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  return { width: size, height: size, data };
}

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage();
page.on("pageerror", (err) => console.error("[pageerror]", err.message));

try {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: harnessSource });

  const size = 32;
  const source = makeSquareSource(size);
  const sourceB64 = toBase64(source.data);

  const bake = (params, frameCount = 1) =>
    page.evaluate(
      ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, p, fc]) =>
        window.RatinhoRender.bakeFrames({
          effectId: "grain-storm",
          sourceWidth,
          sourceHeight,
          sourceRgbaBase64,
          size: targetSize,
          frameCount: fc,
          fps: 12,
          params: p,
        }),
      [sourceB64, source.width, source.height, size, params, frameCount],
    );

  // --- Compile-all: min / default / max params ---
  const paramSets = [
    { label: "default", params: {} },
    {
      label: "min",
      params: { grainAmount: 0, grainSize: 1, sparkleThreshold: 0.5, sparkleIntensity: 0, grainTint: [0, 0, 0, 1], vignetteReach: 0.3 },
    },
    {
      label: "max",
      params: { grainAmount: 1, grainSize: 4, sparkleThreshold: 0.95, sparkleIntensity: 3, grainTint: [1, 1, 1, 1], vignetteReach: 0.7 },
    },
  ];
  for (const { label, params } of paramSets) {
    const frames = await bake(params);
    assert(frames.length === 1 && frames[0].width === size, `compiles and bakes at ${label} params`);
  }

  // --- Semantic: grain flicker is real and silhouette-preserving ---
  const centerIdx = (Math.floor(size / 2) * size + Math.floor(size / 2)) * 4;

  const flickerParams = { grainAmount: 1, grainSize: 1, sparkleIntensity: 0 };
  const flickerFrames = await bake(flickerParams, 8);
  const f0 = fromBase64(flickerFrames[0].rgbaBase64);
  const f1 = fromBase64(flickerFrames[1].rgbaBase64);
  const rgbDiff = Math.abs(f0[centerIdx] - f1[centerIdx]) + Math.abs(f0[centerIdx + 1] - f1[centerIdx + 1]) + Math.abs(f0[centerIdx + 2] - f1[centerIdx + 2]);
  const alphaDiff = Math.abs(f0[centerIdx + 3] - f1[centerIdx + 3]);
  console.log(`grainAmount=1: frame0->frame1 RGB diff=${rgbDiff}, alpha diff=${alphaDiff}`);
  assert(rgbDiff > 5, "interior pixel RGB visibly differs between consecutive frames at grainAmount=1 (flicker)");
  assert(alphaDiff <= 2, "interior pixel alpha (silhouette) is preserved despite the RGB flicker");

  const stableParams = { grainAmount: 0, grainSize: 1, sparkleIntensity: 0 };
  const stableFrames = await bake(stableParams, 8);
  const s0 = fromBase64(stableFrames[0].rgbaBase64);
  const s1 = fromBase64(stableFrames[1].rgbaBase64);
  const stableRgbDiff = Math.abs(s0[centerIdx] - s1[centerIdx]) + Math.abs(s0[centerIdx + 1] - s1[centerIdx + 1]) + Math.abs(s0[centerIdx + 2] - s1[centerIdx + 2]);
  console.log(`grainAmount=0 control: frame0->frame1 RGB diff=${stableRgbDiff}`);
  assert(stableRgbDiff === 0, "grainAmount=0 control is perfectly stable frame-to-frame — the flicker above is attributable to grain, not unrelated variance");

  // --- Loop closure ---
  const loopParams = { grainAmount: 0.6, grainSize: 2, sparkleThreshold: 0.85, sparkleIntensity: 1.5 };
  const multiFrames = await bake(loopParams, 8);
  const singleFrames = await bake(loopParams, 1);
  const multiFrame0 = fromBase64(multiFrames[0].rgbaBase64);
  const singleFrame = fromBase64(singleFrames[0].rgbaBase64);
  let maxLoopDiff = 0;
  for (let i = 0; i < multiFrame0.length; i++) maxLoopDiff = Math.max(maxLoopDiff, Math.abs(multiFrame0[i] - singleFrame[i]));
  assert(maxLoopDiff <= 2, `frame 0 (phase 0/8) matches an independent phase-0 bake within tolerance (maxDiff=${maxLoopDiff})`);

  // --- Determinism ---
  const multiFrames2 = await bake(loopParams, 8);
  const allMatch = multiFrames.every((f, i) => f.rgbaBase64 === multiFrames2[i].rgbaBase64);
  assert(allMatch, "baking the same 8-frame request twice in one page is bit-identical (determinism)");

  console.log("\nALL GRAIN-STORM E2E CHECKS PASSED");
} finally {
  await browser.close();
}
