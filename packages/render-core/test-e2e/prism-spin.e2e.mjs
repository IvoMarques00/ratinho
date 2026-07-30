#!/usr/bin/env node
// GPU-level checks for prism-spin: compiles at min/default/max params,
// per-channel displacement is measurable (the R and B channel centroids
// of an off-center marker diverge — proof the channels are sampled from
// genuinely different positions, which a single affine transform can't
// do since it moves all channels together), loop closure, determinism.
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
  console.error(`prism-spin: dist/harness.global.js not found — run "npm run build -w packages/render-core" first.`);
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

// An off-center bright marker: aberration is direction-dependent (based
// on the vector from canvas center), so an off-center marker is what
// makes per-channel displacement geometrically detectable — a perfectly
// centered, rotationally-symmetric source wouldn't show a centroid shift.
function makeMarkerSource(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  const mx = Math.round(size * 0.7);
  const my = Math.round(size * 0.5);
  const half = Math.max(1, Math.round(size * 0.08));
  for (let y = my - half; y <= my + half; y++) {
    for (let x = mx - half; x <= mx + half; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
  return { width: size, height: size, data };
}

function channelCentroidX(decoded, size, channel) {
  let weightedSum = 0;
  let totalWeight = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = decoded[(y * size + x) * 4 + channel];
      weightedSum += x * v;
      totalWeight += v;
    }
  }
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage();
page.on("pageerror", (err) => console.error("[pageerror]", err.message));

try {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: harnessSource });

  const size = 32;
  const source = makeMarkerSource(size);
  const sourceB64 = toBase64(source.data);

  // --- Compile-all: min / default / max params ---
  const paramSets = [
    { label: "default", params: {} },
    {
      label: "min",
      params: { separation: 0, spinTurns: 0, cycles: 1, wobbleDeg: 0, radialBias: 0, sepPulse: 0, smearSamples: 1, smearArcDeg: 0, fringeAlpha: 0, haloIntensity: 0 },
    },
    {
      label: "max",
      params: { separation: 0.15, spinTurns: 3, cycles: 4, wobbleDeg: 45, radialBias: 1, sepPulse: 1, smearSamples: 8, smearArcDeg: 30, fringeAlpha: 1, haloIntensity: 1 },
    },
  ];

  for (const { label, params } of paramSets) {
    const frames = await page.evaluate(
      ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, p]) =>
        window.RatinhoRender.bakeFrames({
          effectId: "prism-spin",
          sourceWidth,
          sourceHeight,
          sourceRgbaBase64,
          size: targetSize,
          frameCount: 1,
          fps: 12,
          params: p,
        }),
      [sourceB64, source.width, source.height, size, params],
    );
    assert(frames.length === 1 && frames[0].width === size, `compiles and bakes at ${label} params`);
  }

  // --- Semantic: R and B channel centroids diverge (per-channel displacement) ---
  // Use a strong, static separation (no spin/wobble/pulse) so the shift
  // is a fixed geometric displacement rather than something that
  // averages toward zero as it's compared against a moving baseline.
  const strongParams = { separation: 0.12, spinTurns: 0, wobbleDeg: 0, sepPulse: 0, radialBias: 1, smearSamples: 1 };
  const frames = await page.evaluate(
    ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, p]) =>
      window.RatinhoRender.bakeFrames({
        effectId: "prism-spin",
        sourceWidth,
        sourceHeight,
        sourceRgbaBase64,
        size: targetSize,
        frameCount: 8,
        fps: 12,
        params: p,
      }),
    [sourceB64, source.width, source.height, size, strongParams],
  );
  assert(frames.length === 8, "baked 8 frames at strong-separation params");
  const frame0 = fromBase64(frames[0].rgbaBase64);

  const rCentroid = channelCentroidX(frame0, size, 0);
  const bCentroid = channelCentroidX(frame0, size, 2);
  console.log(`R channel centroid X=${rCentroid?.toFixed(2)}, B channel centroid X=${bCentroid?.toFixed(2)}`);
  assert(rCentroid !== null && bCentroid !== null, "both R and B channels have nonzero signal to compute a centroid from");
  assert(Math.abs(rCentroid - bCentroid) > 0.5, "R and B channel centroids diverge — proof of genuine per-channel spatial displacement");

  // --- Loop closure ---
  const loopFrames = await page.evaluate(
    ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, p]) =>
      window.RatinhoRender.bakeFrames({
        effectId: "prism-spin",
        sourceWidth,
        sourceHeight,
        sourceRgbaBase64,
        size: targetSize,
        frameCount: 1,
        fps: 12,
        params: p,
      }),
    [sourceB64, source.width, source.height, size, strongParams],
  );
  const loopFrame = fromBase64(loopFrames[0].rgbaBase64);
  let maxLoopDiff = 0;
  for (let i = 0; i < frame0.length; i++) maxLoopDiff = Math.max(maxLoopDiff, Math.abs(frame0[i] - loopFrame[i]));
  assert(maxLoopDiff <= 2, `frame 0 (phase 0/8) matches an independent phase-0 bake within tolerance (maxDiff=${maxLoopDiff})`);

  // --- Determinism ---
  const frames2 = await page.evaluate(
    ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, p]) =>
      window.RatinhoRender.bakeFrames({
        effectId: "prism-spin",
        sourceWidth,
        sourceHeight,
        sourceRgbaBase64,
        size: targetSize,
        frameCount: 8,
        fps: 12,
        params: p,
      }),
    [sourceB64, source.width, source.height, size, strongParams],
  );
  const allMatch = frames.every((f, i) => f.rgbaBase64 === frames2[i].rgbaBase64);
  assert(allMatch, "baking the same 8-frame request twice in one page is bit-identical (determinism)");

  console.log("\nALL PRISM-SPIN E2E CHECKS PASSED");
} finally {
  await browser.close();
}
