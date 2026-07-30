#!/usr/bin/env node
// Known-answer E2E: proves the full round trip (upload -> ingest ->
// pass -> FBO -> readPixels -> flip -> in-page resize) before any real
// creative shader exists. Not run under Vitest (WebGL doesn't work under
// jsdom) — invoked directly via `node test-e2e/passthrough.e2e.mjs`, or
// wired to `npm run test:gl`.
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
  console.error(`test-e2e/passthrough: dist/harness.global.js not found — run "npm run build -w packages/render-core" first.`);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`OK: ${msg}`);
}

function makeCheckerboardSource(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const on = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0;
      data[i] = on ? 220 : 20;
      data[i + 1] = on ? 60 : 20;
      data[i + 2] = on ? 40 : 20;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

function toBase64(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}

function fromBase64(b64) {
  return new Uint8ClampedArray(Buffer.from(b64, "base64"));
}

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage();
page.on("pageerror", (err) => console.error("[pageerror]", err.message));

try {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: harnessSource });

  const listed = await page.evaluate(() => window.RatinhoRender.listEffectIds());
  assert(listed.includes("passthrough"), `harness registers the "passthrough" effect (got: ${listed.join(", ")})`);

  const size = 32;
  const source = makeCheckerboardSource(size, size);

  const frames = await page.evaluate(
    ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize]) =>
      window.RatinhoRender.bakeFrames({
        effectId: "passthrough",
        sourceWidth,
        sourceHeight,
        sourceRgbaBase64,
        size: targetSize,
        frameCount: 1,
        fps: 12,
        supersample: 1,
      }),
    [toBase64(source.data), source.width, source.height, size],
  );

  assert(frames.length === 1, "bakeFrames returns exactly 1 frame for frameCount=1");
  const frame = frames[0];
  assert(frame.width === size && frame.height === size, `frame is ${size}x${size} (got ${frame.width}x${frame.height})`);

  const decoded = fromBase64(frame.rgbaBase64);
  assert(decoded.length === size * size * 4, `decoded pixel buffer has the expected byte length`);

  // passthrough has padding:0 and supersample:1, so this should be a
  // near-identical copy of the source (small tolerance for the
  // ingest/readback float round trip through the GPU).
  let maxAbsDiff = 0;
  let sumAbsDiff = 0;
  for (let i = 0; i < decoded.length; i++) {
    const diff = Math.abs(decoded[i] - source.data[i]);
    maxAbsDiff = Math.max(maxAbsDiff, diff);
    sumAbsDiff += diff;
  }
  const meanAbsDiff = sumAbsDiff / decoded.length;
  console.log(`passthrough vs source: maxAbsDiff=${maxAbsDiff} meanAbsDiff=${meanAbsDiff.toFixed(3)}`);
  assert(maxAbsDiff <= 6, `passthrough output matches the source within tolerance (maxAbsDiff=${maxAbsDiff} <= 6)`);

  // Determinism: bake the same request twice, expect bit-identical output.
  const frames2 = await page.evaluate(
    ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize]) =>
      window.RatinhoRender.bakeFrames({
        effectId: "passthrough",
        sourceWidth,
        sourceHeight,
        sourceRgbaBase64,
        size: targetSize,
        frameCount: 1,
        fps: 12,
        supersample: 1,
      }),
    [toBase64(source.data), source.width, source.height, size],
  );
  assert(frames2[0].rgbaBase64 === frame.rgbaBase64, "baking the same request twice in one page is bit-identical (determinism)");

  console.log("\nALL PASSTHROUGH E2E CHECKS PASSED");
} finally {
  await browser.close();
}
