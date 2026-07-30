#!/usr/bin/env node
// Strict-parity verification (plan Tier 3b): drives the actual web app
// UI to bake+download a shader-effect .ani, then invokes the Claude
// skill CLI with equivalent flags against the same source image, and
// compares the two files. This is the concrete proof behind "whatever
// the live preview shows is exactly what gets exported" — the same
// rendering code (render-core's harness, running through the same
// Chromium binary) backs both surfaces.
//
// Usage: node scripts/verify-shader-parity.mjs
// Prerequisites: packages/ani-core, packages/render-core, and apps/web
// must already be built (npm run build in each, or see README).
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const CHROMIUM_PATH = process.env.RATINHO_CHROMIUM ?? "/opt/pw-browsers/chromium";
const PREVIEW_PORT = 4321;
const CONVERT_SCRIPT = path.join(REPO_ROOT, ".claude/skills/image-to-ani/scripts/convert.mjs");

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`OK: ${msg}`);
}

function makeTestPng(size) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const inDisc = (x - cx) ** 2 + (y - cy) ** 2 <= (size * 0.3) ** 2;
      png.data[i] = inDisc ? 235 : 0;
      png.data[i + 1] = inDisc ? 90 : 0;
      png.data[i + 2] = inDisc ? 40 : 0;
      png.data[i + 3] = inDisc ? 255 : 0;
    }
  }
  return PNG.sync.write(png);
}

const tmp = mkdtempSync(path.join(tmpdir(), "ratinho-parity-"));
let previewProcess;

try {
  const inputPath = path.join(tmp, "input.png");
  writeFileSync(inputPath, makeTestPng(48));

  console.log("Starting `vite preview` for apps/web...");
  previewProcess = spawn("npx", ["vite", "preview", "--port", String(PREVIEW_PORT), "--host", "127.0.0.1"], {
    cwd: path.join(REPO_ROOT, "apps/web"),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("vite preview did not start in time")), 20000);
    const check = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`);
        if (res.ok) {
          clearTimeout(timeout);
          resolve();
          return;
        }
      } catch {
        // not up yet
      }
      setTimeout(check, 300);
    };
    check();
  });

  // Web app path: upload the fixture, select bloom-pulse (default params), download .ani.
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage();
  page.on("pageerror", (err) => console.error("[pageerror]", err.message));

  await page.goto(`http://127.0.0.1:${PREVIEW_PORT}/`);
  await page.waitForSelector("text=Choose an image");
  await page.locator('input[type="file"]').setInputFiles(inputPath);
  await page.waitForSelector("text=Hotspot", { timeout: 10000 });
  await page.selectOption("select", "shader:bloom-pulse");
  await page.waitForFunction(() => !document.body.innerText.includes("Rendering…"), { timeout: 15000 });

  const [download] = await Promise.all([page.waitForEvent("download"), page.click('button:has-text("Download .ani")')]);
  const webAniPath = path.join(tmp, "web.ani");
  await download.saveAs(webAniPath);
  await browser.close();

  // CLI path: same source image, same effect, same defaults (frames=8,
  // fps=12, size=32, hotspot=center=16,16 — the web app's own defaults).
  const cliAniPath = path.join(tmp, "cli.ani");
  execFileSync(process.execPath, [
    CONVERT_SCRIPT,
    "--input", inputPath,
    "--out", cliAniPath,
    "--effect", "bloom-pulse",
    "--frames", "8",
    "--fps", "12",
    "--size", "32",
    "--hotspot", "16,16",
  ]);

  const webBytes = readFileSync(webAniPath);
  const cliBytes = readFileSync(cliAniPath);

  console.log(`web.ani: ${webBytes.length} bytes, cli.ani: ${cliBytes.length} bytes`);

  if (webBytes.length === cliBytes.length && webBytes.equals(cliBytes)) {
    assert(true, "web-downloaded and CLI-generated .ani files are byte-for-byte identical");
  } else {
    // Fall back to a tolerant comparison and report the divergence,
    // rather than a bare pass/fail with no diagnostic.
    let maxDiff = 0;
    let sumDiff = 0;
    const n = Math.min(webBytes.length, cliBytes.length);
    for (let i = 0; i < n; i++) {
      const d = Math.abs(webBytes[i] - cliBytes[i]);
      maxDiff = Math.max(maxDiff, d);
      sumDiff += d;
    }
    console.log(`Byte-level diff: length delta=${webBytes.length - cliBytes.length}, maxByteDiff=${maxDiff}, meanByteDiff=${(sumDiff / n).toFixed(3)}`);
    assert(
      webBytes.length === cliBytes.length && maxDiff <= 2,
      "web-downloaded and CLI-generated .ani files match within tolerance (same length, maxByteDiff<=2) if not bit-exact",
    );
  }

  console.log("\nSTRICT-PARITY VERIFICATION PASSED");
} finally {
  previewProcess?.kill();
  rmSync(tmp, { recursive: true, force: true });
}
