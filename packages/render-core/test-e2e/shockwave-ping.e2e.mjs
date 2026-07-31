#!/usr/bin/env node
// GPU-level checks for shockwave-ping: compiles at min/default/max params,
// the ring glow appears at its predicted geometric radius (a small opaque
// disc source leaves the ring's radius fully transparent otherwise, so
// sampling around a circle at the known predicted radius and comparing
// against a glowIntensity=0 control proves the ring is rendered where the
// formula says it should be, not just "something changed"), loop closure,
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
  console.error(`shockwave-ping: dist/harness.global.js not found — run "npm run build -w packages/render-core" first.`);
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

// A small opaque disc near the center — small enough that the ring's
// predicted radius lands well outside it, on otherwise-transparent ground.
function makeSmallDiscSource(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.12;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
  }
  return { width: size, height: size, data };
}

// Average RGBA (0..255) sampled at N points around a pixel-space circle.
function sampleRing(decoded, size, pixelRadius, samples = 24) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  const cx = size / 2;
  const cy = size / 2;
  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * Math.PI * 2;
    const x = Math.max(0, Math.min(size - 1, Math.round(cx + pixelRadius * Math.cos(theta))));
    const y = Math.max(0, Math.min(size - 1, Math.round(cy + pixelRadius * Math.sin(theta))));
    const idx = (y * size + x) * 4;
    r += decoded[idx];
    g += decoded[idx + 1];
    b += decoded[idx + 2];
    a += decoded[idx + 3];
  }
  return [r / samples, g / samples, b / samples, a / samples];
}

function colorDistance(a, b) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage();
page.on("pageerror", (err) => console.error("[pageerror]", err.message));

try {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: harnessSource });

  const size = 32;
  const source = makeSmallDiscSource(size);
  const sourceB64 = toBase64(source.data);

  const bake = (params, frameCount = 1) =>
    page.evaluate(
      ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, p, fc]) =>
        window.RatinhoRender.bakeFrames({
          effectId: "shockwave-ping",
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
    { label: "min", params: { ringCount: 1, reach: 0.3, pushAmount: 0, glowColor: [0, 0, 0, 1], glowIntensity: 0 } },
    { label: "max", params: { ringCount: 4, reach: 0.9, pushAmount: 0.15, glowColor: [1, 1, 1, 1], glowIntensity: 3 } },
  ];
  for (const { label, params } of paramSets) {
    const frames = await bake(params);
    assert(frames.length === 1 && frames[0].width === size, `compiles and bakes at ${label} params`);
  }

  // --- Semantic: ring glow appears at its predicted radius ---
  // ringCount=1, frameCount=4, frame index 2 -> phase=0.5 -> fract(phase*1)=0.5
  // -> ring radius (UV) = reach * 0.5. reach=0.6 -> 0.3 UV -> 0.3*size px.
  const reach = 0.6;
  const glowColor = [0, 1, 0, 1]; // saturated green — unambiguous vs. a white source/black background
  const withGlowParams = { ringCount: 1, reach, pushAmount: 0, glowColor, glowIntensity: 2.5 };
  const noGlowParams = { ringCount: 1, reach, pushAmount: 0, glowColor, glowIntensity: 0 };

  const withGlowFrames = await bake(withGlowParams, 4);
  const noGlowFrames = await bake(noGlowParams, 4);
  const withGlowFrame = fromBase64(withGlowFrames[2].rgbaBase64);
  const noGlowFrame = fromBase64(noGlowFrames[2].rgbaBase64);

  const predictedRadiusPx = reach * 0.5 * size;
  const withGlowSample = sampleRing(withGlowFrame, size, predictedRadiusPx);
  const noGlowSample = sampleRing(noGlowFrame, size, predictedRadiusPx);
  const target = [0, 255, 0, 255];

  const withGlowDistance = colorDistance(withGlowSample, target);
  const noGlowDistance = colorDistance(noGlowSample, target);
  console.log(
    `predicted ring radius=${predictedRadiusPx.toFixed(1)}px, with-glow sample=${withGlowSample.map((v) => v.toFixed(1))}, no-glow sample=${noGlowSample.map((v) => v.toFixed(1))}`,
  );
  assert(withGlowDistance < 90, `ring color at the predicted radius is close to the configured glow color (distance=${withGlowDistance.toFixed(1)})`);
  assert(
    withGlowDistance < noGlowDistance - 50,
    `glowIntensity=0 control at the same radius is much further from the glow color (with=${withGlowDistance.toFixed(1)}, without=${noGlowDistance.toFixed(1)})`,
  );

  // --- Loop closure ---
  const loopParams = { ringCount: 2, reach: 0.6, pushAmount: 0.05, glowColor: [0.5, 0.85, 1, 1], glowIntensity: 1.2 };
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

  console.log("\nALL SHOCKWAVE-PING E2E CHECKS PASSED");
} finally {
  await browser.close();
}
