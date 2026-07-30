#!/usr/bin/env node
// Proves render-core's baked Frame[] plugs directly into ani-core's
// framesToAni() with zero changes to ani-core — the actual integration
// point the whole render baseline exists to feed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright-core";
import { framesToAni } from "ani-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROMIUM_PATH = process.env.RATINHO_CHROMIUM ?? "/opt/pw-browsers/chromium";
const harnessPath = path.join(__dirname, "..", "dist", "harness.global.js");

let harnessSource;
try {
  harnessSource = readFileSync(harnessPath, "utf8");
} catch {
  console.error(`ani-integration: dist/harness.global.js not found — run "npm run build -w packages/render-core" first.`);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`OK: ${msg}`);
}

function makeSource(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 200;
    data[i * 4 + 1] = 90;
    data[i * 4 + 2] = 30;
    data[i * 4 + 3] = 255;
  }
  return { width: size, height: size, data };
}

function toBase64(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}
function fromBase64(b64) {
  return new Uint8ClampedArray(Buffer.from(b64, "base64"));
}

// Minimal inline RIFF/ANI structural parser (mirrors ani-core's own test
// helpers, kept local so this script doesn't reach into another
// package's test internals across a package boundary).
function readFourCC(view, offset) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}
function parseChunks(bytes, start, end) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = [];
  let offset = start;
  while (offset < end) {
    const tag = readFourCC(view, offset);
    const size = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;
    chunks.push({ tag, data: bytes.subarray(dataStart, dataStart + size) });
    offset = dataStart + size;
    if (offset % 2 !== 0) offset += 1;
  }
  return chunks;
}
function parseAni(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert(readFourCC(view, 0) === "RIFF", "top-level RIFF tag");
  assert(readFourCC(view, 8) === "ACON", "form type ACON");
  const chunks = parseChunks(bytes, 12, bytes.length);
  const anih = chunks.find((c) => c.tag === "anih");
  const list = chunks.find((c) => c.tag === "LIST");
  const anihView = new DataView(anih.data.buffer, anih.data.byteOffset, anih.data.byteLength);
  const cFrames = anihView.getUint32(4, true);
  const listView = new DataView(list.data.buffer, list.data.byteOffset, list.data.byteLength);
  assert(readFourCC(listView, 0) === "fram", "LIST type is 'fram'");
  const iconChunks = parseChunks(list.data, 4, list.data.length).filter((c) => c.tag === "icon");
  return { cFrames, iconCount: iconChunks.length, iconBlobs: iconChunks.map((c) => c.data) };
}

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage();
page.on("pageerror", (err) => console.error("[pageerror]", err.message));

try {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: harnessSource });

  const size = 32;
  const source = makeSource(64);
  const frameCount = 4;

  const bakedFrames = await page.evaluate(
    ([sourceRgbaBase64, sourceWidth, sourceHeight, targetSize, count]) =>
      window.RatinhoRender.bakeFrames({
        effectId: "passthrough",
        sourceWidth,
        sourceHeight,
        sourceRgbaBase64,
        size: targetSize,
        frameCount: count,
        fps: 12,
      }),
    [toBase64(source.data), source.width, source.height, size, frameCount],
  );

  assert(bakedFrames.length === frameCount, `baked ${frameCount} frames`);

  const frames = bakedFrames.map((f) => ({
    width: f.width,
    height: f.height,
    delayMs: f.delayMs,
    data: fromBase64(f.rgbaBase64),
  }));
  for (const f of frames) {
    assert(f.data.length === f.width * f.height * 4, `frame ${f.width}x${f.height} has the expected byte length`);
  }

  // This is the actual integration point: render-core's Frame[] straight
  // into ani-core's framesToAni(), no adapter, no changes to ani-core.
  const result = framesToAni(frames, { sizes: [32], hotspot: { x: 16, y: 16 } });
  assert(result.frameCount === frameCount, "framesToAni() reports the correct frame count");

  const parsed = parseAni(result.bytes);
  assert(parsed.cFrames === frameCount, `anih.cFrames === ${frameCount}`);
  assert(parsed.iconCount === frameCount, `LIST/fram contains ${frameCount} icon subchunks`);
  for (const blob of parsed.iconBlobs) {
    const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
    assert(view.getUint16(2, true) === 2, "each embedded icon blob has ICONDIR idType=2 (CUR)");
  }

  console.log(`\nProduced a ${result.bytes.length}-byte .ani from ${frameCount} render-core-baked frames.`);
  console.log("\nALL ANI-INTEGRATION E2E CHECKS PASSED");
} finally {
  await browser.close();
}
