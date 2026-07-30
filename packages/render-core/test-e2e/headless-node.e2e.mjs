#!/usr/bin/env node
// Proves node/headless.ts's renderFramesHeadless() itself works (not
// just the raw harness driven by hand, as the other E2E scripts do),
// and that it round-trips correctly into ani-core's framesToAni(). Also
// runs it TWICE in two separate Chromium processes to prove the
// harness-vs-harness determinism the strict-parity requirement depends
// on: literally the same rendering code, run headlessly twice, must
// produce bit-identical output.
import { renderFramesHeadless } from "../dist/node-entry.js";
import { framesToAni } from "ani-core";

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`OK: ${msg}`);
}

function makeSource(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 220;
    data[i * 4 + 1] = 40;
    data[i * 4 + 2] = 120;
    data[i * 4 + 3] = 255;
  }
  return { width: size, height: size, data };
}

const source = makeSource(48);

const opts = {
  effectId: "bloom-pulse",
  sourceImage: source,
  size: 32,
  frameCount: 4,
  fps: 12,
  params: { intensity: 1.5 },
};

const frames = await renderFramesHeadless(opts);
assert(frames.length === 4, "renderFramesHeadless() returns the requested frame count");
for (const f of frames) {
  assert(f.width === 32 && f.height === 32, "each frame is resolved to the requested cursor size");
  assert(f.data.length === 32 * 32 * 4, "each frame's pixel buffer has the expected byte length");
  assert(f.delayMs > 0, "each frame has a positive delay");
}

// Round-trips into the real ani-core pipeline, same as the skill CLI will do.
const result = framesToAni(frames, { sizes: [32], hotspot: { x: 16, y: 16 } });
assert(result.frameCount === 4, "framesToAni() accepts renderFramesHeadless()'s output directly");
assert(result.bytes.length > 0, "produces a non-empty .ani file");

// Harness-vs-harness determinism: two SEPARATE Chromium processes, same
// input, must produce bit-identical output — the concrete guarantee
// "strict parity" depends on.
const frames2 = await renderFramesHeadless(opts);
assert(frames.length === frames2.length, "second independent headless run returns the same frame count");
let allBitIdentical = true;
for (let i = 0; i < frames.length; i++) {
  if (frames[i].data.length !== frames2[i].data.length || frames[i].delayMs !== frames2[i].delayMs) {
    allBitIdentical = false;
    break;
  }
  for (let j = 0; j < frames[i].data.length; j++) {
    if (frames[i].data[j] !== frames2[i].data[j]) {
      allBitIdentical = false;
      break;
    }
  }
}
assert(allBitIdentical, "two independent headless Chromium processes produce bit-identical frames (harness-vs-harness determinism)");

console.log("\nALL HEADLESS-NODE E2E CHECKS PASSED");
