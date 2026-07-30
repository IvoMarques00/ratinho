#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import {
  convertGifToAni,
  convertImageToAni,
  convertImageToCur,
  detectImageFormat,
} from "ani-core";
import { decodeImageNode } from "ani-core/decode/node";

const HELP = `Usage: node convert.mjs --input <file.png|jpg|jpeg|gif> --out <file.ani|.cur> [options]

Required:
  --input <path>        Source image: PNG, JPEG, or animated GIF.
  --out <path>           Output path. Written as .ani unless --format cur.

Animation (ignored for GIF input, which drives its own frames):
  --style <name>          none | pulse | wiggle | bounce | rotate  (default: none)
  --frames <n>             Frame count for the synthesized animation (default: 8)
  --fps <n>                 Playback rate in frames per second (default: 12)
  --amplitude <0..1>        Effect strength, meaning depends on style (default: style-specific)
  --cycles <n>               Oscillation cycles per loop (wiggle/bounce)
  --max-angle <deg>          Max rotation angle in degrees (wiggle "shake" / rotate "rock")
  --rotate-mode <spin|rock>  Rotate style mode (default: spin)

Cursor options:
  --size <n[,n...]>    Cursor pixel size(s) to embed, e.g. "32" or "32,48" (default: 32)
  --hotspot <x,y>        Click-point hotspot in pixels of the base size (default: center)
  --format <ani|cur>    Output container. cur ignores animation options (default: ani)

Examples:
  node convert.mjs --input logo.png --out cursor.ani --style pulse --frames 8 --fps 12
  node convert.mjs --input photo.jpg --out pointer.cur --format cur --hotspot 4,4
  node convert.mjs --input dance.gif --out dance.ani --size 32,48
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

const sizes = parseSizeList(values.size);
const hotspot = values.hotspot ? parseHotspot(values.hotspot) : undefined;
const frameCount = Number.parseInt(values.frames, 10);
const fps = Number.parseInt(values.fps, 10);

const params = {};
if (values.amplitude !== undefined) params.amplitude = Number.parseFloat(values.amplitude);
if (values.cycles !== undefined) params.cycles = Number.parseInt(values.cycles, 10);
if (values["max-angle"] !== undefined) params.maxAngleDeg = Number.parseFloat(values["max-angle"]);
if (values["rotate-mode"] !== undefined) params.rotateMode = values["rotate-mode"];

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

let outputBytes;
let frameCountUsed;

try {
  if (format === "gif") {
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
