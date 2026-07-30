#!/usr/bin/env node
// Runs every packages/render-core/test-e2e/*.e2e.mjs script in a child
// process (sequentially, so Chromium instances don't compete) and reports
// a summary. These are plain Node scripts, not Vitest tests, because
// WebGL doesn't work under jsdom — they drive real headless Chromium.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e2eDir = path.join(__dirname, "..", "test-e2e");

const files = readdirSync(e2eDir)
  .filter((f) => f.endsWith(".e2e.mjs"))
  .sort();

if (files.length === 0) {
  console.log("run-e2e: no *.e2e.mjs files found in test-e2e/");
  process.exit(0);
}

function runOne(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(e2eDir, file)], { stdio: "inherit" });
    child.on("exit", (code) => resolve({ file, code }));
  });
}

const results = [];
for (const file of files) {
  console.log(`\n=== ${file} ===`);
  results.push(await runOne(file));
}

console.log("\n=== E2E summary ===");
let failed = 0;
for (const { file, code } of results) {
  console.log(`${code === 0 ? "PASS" : "FAIL"}  ${file}`);
  if (code !== 0) failed++;
}

process.exit(failed > 0 ? 1 : 0);
