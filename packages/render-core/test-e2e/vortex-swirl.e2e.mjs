#!/usr/bin/env node
// GPU-level checks for vortex-swirl: compiles at min/default/max params,
// the whole-image angular twist is measurable (an off-center marker's
// centroid angle around canvas center shifts by a predictable amount
// between twistAmount=0 and twistAmount=max — proof of genuine angular
// warp, distinct from prism-spin's per-*channel* centroid-divergence
// check, since this is a single-channel, whole-image angular shift),
// loop closure, determinism.
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
  console.error(`vortex-swirl: dist/harness.global.js not found — run "npm run build -w packages/render-core" first.`);
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

// An off-center marker: angular position around canvas center is only
// meaningfully measurable if the marker isn't sitting on the center itself.
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

// Alpha-weighted centroid angle around the canvas center.
function centroidAngle(decoded, size) {
  let sx = 0;
  let sy = 0;
  let total = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const a = decoded[(y * size + x) * 4 + 3];
      sx += x * a;
      sy += y * a;
      total += a;
    }
  }
  if (total === 0) return null;
  const cx = sx / total;
  const cy = sy / total;
  return Math.atan2(cy - size / 2, cx - size / 2);
}

function angleDiff(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
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

  const bake = (params, frameCount = 1) =>
    page.evaluate(
      ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, p, fc]) =>
        window.RatinhoRender.bakeFrames({
          effectId: "vortex-swirl",
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
    { label: "min", params: { spinTurns: 0, twistAmount: 0, tightness: 1, edgeFade: 0.1 } },
    { label: "max", params: { spinTurns: 3, twistAmount: 8, tightness: 40, edgeFade: 0.6 } },
  ];
  for (const { label, params } of paramSets) {
    const frames = await bake(params);
    assert(frames.length === 1 && frames[0].width === size, `compiles and bakes at ${label} params`);
  }

  // --- Semantic: angular twist is measurable ---
  // twistFalloff (tightness) at its minimum keeps falloffT close to 1 at
  // the marker's radius, so the static bend applies near-fully there.
  const baselineParams = { spinTurns: 0, twistAmount: 0, tightness: 1, edgeFade: 0.6 };
  const twistedParams = { spinTurns: 0, twistAmount: 8, tightness: 1, edgeFade: 0.6 };

  const baselineFrames = await bake(baselineParams);
  const twistedFrames = await bake(twistedParams);
  const baseline = fromBase64(baselineFrames[0].rgbaBase64);
  const twisted = fromBase64(twistedFrames[0].rgbaBase64);

  const baselineAngle = centroidAngle(baseline, size);
  const twistedAngle = centroidAngle(twisted, size);
  assert(baselineAngle !== null && twistedAngle !== null, "both bakes have nonzero alpha signal to compute a centroid from");
  const diff = Math.abs(angleDiff(twistedAngle, baselineAngle));
  console.log(`baseline centroid angle=${baselineAngle.toFixed(3)} rad, twisted=${twistedAngle.toFixed(3)} rad, diff=${diff.toFixed(3)} rad`);
  assert(diff > 0.3, "marker centroid angle shifts measurably under a strong static twist — proof of genuine angular warp");

  // --- Loop closure: turns > 0 must still produce phase-0 == an independent 1-frame bake ---
  const loopParams = { spinTurns: 2, twistAmount: 4, tightness: 10, edgeFade: 0.45 };
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

  console.log("\nALL VORTEX-SWIRL E2E CHECKS PASSED");
} finally {
  await browser.close();
}
