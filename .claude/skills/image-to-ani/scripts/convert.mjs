#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import {
  convertGifToAni,
  convertImageToAni,
  convertImageToCur,
  detectImageFormat,
  framesToAni,
} from "ani-core";
import { decodeImageNode } from "ani-core/decode/node";
import { coerceFromCliStrings, describeSchema, getEffect, listEffects } from "render-core";

const HELP = `Usage: node convert.mjs --input <file.png|jpg|jpeg|gif> --out <file.ani|.cur> [options]

Required:
  --input <path>        Source image: PNG, JPEG, or animated GIF.
  --out <path>           Output path. Written as .ani unless --format cur.

Animation, CPU/classic (instant, no extra dependencies; ignored for GIF
input, which drives its own frames):
  --style <name>          none | pulse | wiggle | bounce | rotate  (default: none)
  --frames <n>             Frame count for the synthesized animation (default: 8)
  --fps <n>                 Playback rate in frames per second (default: 12)
  --amplitude <0..1>        Effect strength, meaning depends on style (default: style-specific)
  --cycles <n>               Oscillation cycles per loop (wiggle/bounce)
  --max-angle <deg>          Max rotation angle in degrees (wiggle "shake" / rotate "rock")
  --rotate-mode <spin|rock>  Rotate style mode (default: spin)

Animation, GPU/shader (richer effects — bloom, chromatic aberration —
but launches a headless Chromium, ~1-3s; not supported for GIF input;
mutually exclusive with --style):
  --effect <id>            Shader effect id, e.g. "bloom-pulse" or "prism-spin"
  --effect-param k=v         Repeatable. Value type/range depends on the effect
                              (run --list-effects to see each effect's params)
  --supersample <1..4>       Internal render resolution multiplier (default: auto)
  --seed <n>                  Deterministic seed passed to the effect (default: 0)
  --list-effects            Print available shader effects and their params, then exit

Cursor options:
  --size <n[,n...]>    Cursor pixel size(s) to embed, e.g. "32" or "32,48" (default: 32)
  --hotspot <x,y>        Click-point hotspot in pixels of the base size (default: center)
  --format <ani|cur>    Output container. cur ignores animation options (default: ani)

Examples:
  node convert.mjs --input logo.png --out cursor.ani --style pulse --frames 8 --fps 12
  node convert.mjs --input photo.jpg --out pointer.cur --format cur --hotspot 4,4
  node convert.mjs --input dance.gif --out dance.ani --size 32,48
  node convert.mjs --input logo.png --out glow.ani --effect bloom-pulse --effect-param intensity=1.8
  node convert.mjs --list-effects
`;

function fail(message) {
  process.stderr.write(`Error: ${message}\n\n${HELP}`);
  process.exit(1);
}

function parseSizeList(raw) {
  const sizes = raw.split(",").map((s) => Number.parseInt(s.trim(), 10));
  for (const s of sizes) {
    if (![32, 48, 64].includes(s)) {
      fail(`Unsupported cursor size "${s}". Supported sizes: 32, 48, 64.`);
    }
  }
  return sizes;
}

function parseHotspot(raw) {
  const parts = raw.split(",").map((s) => Number.parseInt(s.trim(), 10));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
    fail(`Invalid --hotspot "${raw}", expected "x,y" (e.g. "16,16").`);
  }
  return { x: parts[0], y: parts[1] };
}

function parseEffectParamPairs(pairs) {
  const raw = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq === -1) {
      fail(`Invalid --effect-param "${pair}", expected "key=value" (e.g. "intensity=1.8").`);
    }
    raw[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return raw;
}

function printEffectList() {
  const effects = listEffects();
  for (const effect of effects) {
    process.stdout.write(`\n${effect.id} — ${effect.label}\n  ${effect.description}\n`);
    const fields = describeSchema(effect.schema);
    if (fields.length === 0) {
      process.stdout.write(`  (no params)\n`);
      continue;
    }
    for (const f of fields) {
      const range = f.range ? ` [${f.range}]` : f.options ? ` {${f.options.join("|")}}` : "";
      process.stdout.write(`  --effect-param ${f.key}=<${f.type}>${range} (default: ${JSON.stringify(f.default)}) — ${f.label}\n`);
    }
  }
  process.stdout.write("\n");
}

const { values } = parseArgs({
  options: {
    input: { type: "string" },
    out: { type: "string" },
    style: { type: "string", default: "none" },
    frames: { type: "string", default: "8" },
    fps: { type: "string", default: "12" },
    amplitude: { type: "string" },
    cycles: { type: "string" },
    "max-angle": { type: "string" },
    "rotate-mode": { type: "string" },
    effect: { type: "string" },
    "effect-param": { type: "string", multiple: true, default: [] },
    supersample: { type: "string" },
    seed: { type: "string" },
    "list-effects": { type: "boolean", default: false },
    size: { type: "string", default: "32" },
    hotspot: { type: "string" },
    format: { type: "string", default: "ani" },
    help: { type: "boolean", default: false },
  },
});

if (values.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

if (values["list-effects"]) {
  printEffectList();
  process.exit(0);
}

if (!values.input || !values.out) {
  fail("--input and --out are required.");
}

if (!["ani", "cur"].includes(values.format)) {
  fail(`Unsupported --format "${values.format}". Use "ani" or "cur".`);
}

const validStyles = ["none", "pulse", "wiggle", "bounce", "rotate"];
if (!validStyles.includes(values.style)) {
  fail(`Unsupported --style "${values.style}". Use one of: ${validStyles.join(", ")}.`);
}

if (values.effect && values.style !== "none") {
  fail(`--effect and --style are mutually exclusive (--effect uses the GPU/shader path; --style uses the CPU/classic path).`);
}

let effect;
if (values.effect) {
  try {
    effect = getEffect(values.effect);
  } catch (err) {
    fail(err.message);
  }
}

const sizes = parseSizeList(values.size);
const hotspot = values.hotspot ? parseHotspot(values.hotspot) : undefined;
const frameCount = Number.parseInt(values.frames, 10);
const fps = Number.parseInt(values.fps, 10);

const params = {};
if (values.amplitude !== undefined) params.amplitude = Number.parseFloat(values.amplitude);
if (values.cycles !== undefined) params.cycles = Number.parseInt(values.cycles, 10);
if (values["max-angle"] !== undefined) params.maxAngleDeg = Number.parseFloat(values["max-angle"]);
if (values["rotate-mode"] !== undefined) params.rotateMode = values["rotate-mode"];

let effectParams;
if (effect) {
  try {
    effectParams = coerceFromCliStrings(effect.schema, parseEffectParamPairs(values["effect-param"]));
  } catch (err) {
    fail(err.message);
  }
}

let inputBytes;
try {
  inputBytes = new Uint8Array(readFileSync(values.input));
} catch (err) {
  fail(`Could not read --input "${values.input}": ${err.message}`);
}

let format;
try {
  format = detectImageFormat(inputBytes);
} catch (err) {
  fail(err.message);
}

if (effect && format === "gif") {
  fail(`--effect (shader path) doesn't yet support GIF input — use a static PNG/JPEG source, or omit --effect to use the GIF's own frames with --style.`);
}

let outputBytes;
let frameCountUsed;

try {
  if (effect) {
    const { renderFramesHeadless } = await import("render-core/node");
    const image = decodeImageNode(inputBytes);
    const frames = await renderFramesHeadless({
      effectId: effect.id,
      sourceImage: image,
      size: sizes[0],
      frameCount,
      fps,
      supersample: values.supersample !== undefined ? Number.parseInt(values.supersample, 10) : undefined,
      seed: values.seed !== undefined ? Number.parseInt(values.seed, 10) : undefined,
      params: effectParams,
    });
    if (values.format === "cur") {
      outputBytes = convertImageToCur(frames[0], { sizes, hotspot });
      frameCountUsed = 1;
    } else {
      const result = framesToAni(frames, { sizes, hotspot });
      outputBytes = result.bytes;
      frameCountUsed = result.frameCount;
    }
  } else if (format === "gif") {
    if (values.format === "cur") {
      fail("GIF input cannot be exported as a static .cur; use --format ani (the default).");
    }
    const result = convertGifToAni(inputBytes, { sizes, hotspot });
    outputBytes = result.bytes;
    frameCountUsed = result.frameCount;
  } else {
    const image = decodeImageNode(inputBytes);
    if (values.format === "cur") {
      outputBytes = convertImageToCur(image, { sizes, hotspot });
      frameCountUsed = 1;
    } else {
      const synth = values.style === "none" ? undefined : { style: values.style, frameCount, fps, params };
      const result = convertImageToAni(image, { sizes, hotspot, synth });
      outputBytes = result.bytes;
      frameCountUsed = result.frameCount;
    }
  }
} catch (err) {
  fail(err.message);
}

try {
  writeFileSync(values.out, outputBytes);
} catch (err) {
  fail(`Could not write --out "${values.out}": ${err.message}`);
}

const ext = extname(values.out) || (values.format === "cur" ? ".cur" : ".ani");
process.stdout.write(
  `Wrote ${values.out} (${outputBytes.length} bytes, ${frameCountUsed} frame${frameCountUsed === 1 ? "" : "s"}, size ${sizes.join("/")}px${ext !== extname(values.out) ? " — note: output has no recognized extension" : ""})\n`,
);
