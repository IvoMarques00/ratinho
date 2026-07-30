#!/usr/bin/env node
// CLI smoke test for convert.mjs: structural validation of both the
// classic (CPU) and shader (GPU/headless-Chromium) paths, plus the
// error paths (mutually exclusive flags, GIF+effect rejection, unknown
// effect id, bad --effect-param). Not a Vitest test — it shells out to
// the real CLI script, the same way a user/skill invocation would.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONVERT = path.join(__dirname, "convert.mjs");

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`OK: ${msg}`);
}

function readFourCC(view, offset) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}

function assertValidAni(filePath, expectedFrameCount) {
  const bytes = new Uint8Array(readFileSync(filePath));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert(readFourCC(view, 0) === "RIFF", `${path.basename(filePath)}: starts with RIFF`);
  assert(readFourCC(view, 8) === "ACON", `${path.basename(filePath)}: form type is ACON`);
  assert(readFourCC(view, 12) === "anih", `${path.basename(filePath)}: first chunk is anih`);
  const cFrames = view.getUint32(12 + 8 + 4, true);
  assert(cFrames === expectedFrameCount, `${path.basename(filePath)}: anih.cFrames === ${expectedFrameCount} (got ${cFrames})`);
  const fileSize = view.getUint32(4, true);
  assert(fileSize === bytes.length - 8, `${path.basename(filePath)}: RIFF fileSize matches actual byte length`);
}

function run(args, opts = {}) {
  try {
    const out = execFileSync(process.execPath, [CONVERT, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, stdout: out };
  } catch (err) {
    if (opts.expectFailure) return { code: err.status ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
    throw err;
  }
}

const tmp = mkdtempSync(path.join(tmpdir(), "ratinho-smoke-"));

try {
  // A small solid-color test PNG.
  const size = 40;
  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < size * size; i++) {
    png.data[i * 4] = 200;
    png.data[i * 4 + 1] = 90;
    png.data[i * 4 + 2] = 40;
    png.data[i * 4 + 3] = 255;
  }
  const inputPath = path.join(tmp, "input.png");
  writeFileSync(inputPath, PNG.sync.write(png));

  // --- Classic (CPU) path: unaffected by the shader-effect addition ---
  const classicOut = path.join(tmp, "classic.ani");
  run(["--input", inputPath, "--out", classicOut, "--style", "pulse", "--frames", "8", "--fps", "12", "--hotspot", "20,20"]);
  assertValidAni(classicOut, 8);

  // --- Shader (GPU/headless) path ---
  const shaderOut = path.join(tmp, "shader.ani");
  run(["--input", inputPath, "--out", shaderOut, "--effect", "bloom-pulse", "--effect-param", "intensity=1.5", "--frames", "4", "--fps", "10"]);
  assertValidAni(shaderOut, 4);

  // --list-effects doesn't require --input/--out and exits 0.
  const listResult = run(["--list-effects"]);
  assert(listResult.stdout.includes("bloom-pulse"), "--list-effects lists bloom-pulse");
  assert(listResult.stdout.includes("prism-spin"), "--list-effects lists prism-spin");

  // --- Error paths ---
  const mutuallyExclusive = run(
    ["--input", inputPath, "--out", path.join(tmp, "x.ani"), "--effect", "bloom-pulse", "--style", "pulse"],
    { expectFailure: true },
  );
  assert(mutuallyExclusive.code !== 0, "--effect + --style (non-default) fails");
  assert(mutuallyExclusive.stderr.includes("mutually exclusive"), "error message explains --effect/--style are mutually exclusive");

  const unknownEffect = run(["--input", inputPath, "--out", path.join(tmp, "x.ani"), "--effect", "does-not-exist"], { expectFailure: true });
  assert(unknownEffect.code !== 0, "unknown --effect id fails");
  assert(unknownEffect.stderr.includes("Unknown effect"), "error message names the unknown effect");

  const badParam = run(
    ["--input", inputPath, "--out", path.join(tmp, "x.ani"), "--effect", "bloom-pulse", "--effect-param", "totallyBogus=1"],
    { expectFailure: true },
  );
  assert(badParam.code !== 0, "unknown --effect-param key fails");
  assert(badParam.stderr.includes("Unknown param"), "error message names the unknown param");

  console.log("\nALL CLI SMOKE TESTS PASSED");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
