#!/usr/bin/env node
// GPU-level checks for duotone-drift: compiles at min/default/max params,
// the luma-based two-tone remap genuinely happens (a half-dark/half-bright
// source's dark region lands near shadowColor and bright region near
// highlightColor at hueTurns=0), and the drift is real hue rotation (the
// bright region's color measurably rotates away from its hueTurns=0 value
// at hueTurns=1/mid-cycle), loop closure, determinism.
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
  console.error(`duotone-drift: dist/harness.global.js not found — run "npm run build -w packages/render-core" first.`);
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

// Left half near-black, right half near-white — opaque throughout, so
// luma alone decides which side of the tone-balance threshold each half
// falls on, independent of alpha.
function makeSplitSource(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const bright = x >= size / 2;
      const v = bright ? 245 : 10;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { width: size, height: size, data };
}

// Average RGB over a small patch, well inside the vignette's undarkened
// core (radius - softness from center) to avoid rim-darkening noise.
function samplePatch(decoded, size, cx, cy, half = 1) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = cy - half; y <= cy + half; y++) {
    for (let x = cx - half; x <= cx + half; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const i = (y * size + x) * 4;
      r += decoded[i];
      g += decoded[i + 1];
      b += decoded[i + 2];
      n++;
    }
  }
  return [r / n, g / n, b / n];
}

function colorDistance(a, b) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 1;
  return dot / (magA * magB);
}

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage();
page.on("pageerror", (err) => console.error("[pageerror]", err.message));

try {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: harnessSource });

  const size = 32;
  const source = makeSplitSource(size);
  const sourceB64 = toBase64(source.data);

  const bake = (params, frameCount = 1) =>
    page.evaluate(
      ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, p, fc]) =>
        window.RatinhoRender.bakeFrames({
          effectId: "duotone-drift",
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
      params: { shadowColor: [0, 0, 0, 1], highlightColor: [0, 0, 0, 1], balance: 0.15, hueTurns: 0, vignetteRadius: 0.2, vignetteDarken: 0 },
    },
    {
      label: "max",
      params: { shadowColor: [1, 1, 1, 1], highlightColor: [1, 1, 1, 1], balance: 0.85, hueTurns: 3, vignetteRadius: 0.7, vignetteDarken: 1 },
    },
  ];
  for (const { label, params } of paramSets) {
    const frames = await bake(params);
    assert(frames.length === 1 && frames[0].width === size, `compiles and bakes at ${label} params`);
  }

  // --- Semantic: luma-based two-tone remap ---
  const shadowColor = [0.05, 0, 0.15, 1];
  const highlightColor = [1, 0.8, 0.2, 1];
  const baseParams = { shadowColor, highlightColor, balance: 0.5, hueTurns: 0, vignetteRadius: 0.45, vignetteDarken: 0.5 };
  const baseFrames = await bake(baseParams, 1);
  const baseFrame = fromBase64(baseFrames[0].rgbaBase64);

  const darkSample = samplePatch(baseFrame, size, Math.round(size * 0.3), size / 2);
  const brightSample = samplePatch(baseFrame, size, Math.round(size * 0.7), size / 2);
  const shadowTarget = shadowColor.slice(0, 3).map((c) => c * 255);
  const highlightTarget = highlightColor.slice(0, 3).map((c) => c * 255);
  const darkDistance = colorDistance(darkSample, shadowTarget);
  const brightDistance = colorDistance(brightSample, highlightTarget);
  console.log(`dark region sample=${darkSample.map((v) => v.toFixed(1))} vs shadowColor=${shadowTarget}, distance=${darkDistance.toFixed(1)}`);
  console.log(`bright region sample=${brightSample.map((v) => v.toFixed(1))} vs highlightColor=${highlightTarget}, distance=${brightDistance.toFixed(1)}`);
  assert(darkDistance < 20, `dark region at hueTurns=0 lands close to the configured shadow color (distance=${darkDistance.toFixed(1)})`);
  assert(brightDistance < 20, `bright region at hueTurns=0 lands close to the configured highlight color (distance=${brightDistance.toFixed(1)})`);

  // --- Semantic: hue drift is real ---
  // frameCount=2, frame index 1 -> phase=0.5; hueTurns=1 -> angle = TAU*0.5 = pi (180deg).
  const driftParams = { shadowColor, highlightColor, balance: 0.5, hueTurns: 1, vignetteRadius: 0.45, vignetteDarken: 0.5 };
  const driftFrames = await bake(driftParams, 2);
  const driftFrame = fromBase64(driftFrames[1].rgbaBase64);
  const brightDrifted = samplePatch(driftFrame, size, Math.round(size * 0.7), size / 2);
  const similarity = cosineSimilarity(brightSample, brightDrifted);
  console.log(`bright region at hueTurns=1/phase=0.5: sample=${brightDrifted.map((v) => v.toFixed(1))}, cosine similarity to hueTurns=0 baseline=${similarity.toFixed(4)}`);
  assert(similarity < 0.999, `bright region's color measurably rotates under a half-cycle, full-turn hue drift (similarity=${similarity.toFixed(4)})`);

  // --- Loop closure ---
  const loopFrames8 = await bake(driftParams, 8);
  const loopFrame1 = await bake(driftParams, 1);
  const multiFrame0 = fromBase64(loopFrames8[0].rgbaBase64);
  const singleFrame = fromBase64(loopFrame1[0].rgbaBase64);
  let maxLoopDiff = 0;
  for (let i = 0; i < multiFrame0.length; i++) maxLoopDiff = Math.max(maxLoopDiff, Math.abs(multiFrame0[i] - singleFrame[i]));
  assert(maxLoopDiff <= 2, `frame 0 (phase 0/8) matches an independent phase-0 bake within tolerance (maxDiff=${maxLoopDiff})`);

  // --- Determinism ---
  const loopFrames8b = await bake(driftParams, 8);
  const allMatch = loopFrames8.every((f, i) => f.rgbaBase64 === loopFrames8b[i].rgbaBase64);
  assert(allMatch, "baking the same 8-frame request twice in one page is bit-identical (determinism)");

  console.log("\nALL DUOTONE-DRIFT E2E CHECKS PASSED");
} finally {
  await browser.close();
}
