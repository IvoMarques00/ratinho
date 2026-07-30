# Ratinho — Image → .ANI Cursor Converter

Converts a JPG, JPEG, PNG, or animated GIF into a high-fidelity Windows
`.ani` animated cursor (or a static `.cur`/`.ico`). Two ways to use it,
one shared implementation:

- **`apps/web`** — a browser-based tool with a live preview and export.
- **`.claude/skills/image-to-ani`** — a Claude Code skill that runs the
  same conversion headlessly from the command line.

Both are built on **`packages/ani-core`**, a pure-TypeScript library with
no native/compiled dependencies, so it runs unmodified in the browser and
in Node. That's also why both surfaces produce byte-identical output for
the same input.

This is step 1 of a larger plan — a cursor-pack generator (step 2) and a
web animation "wow factor" showcase (step 3) are intentionally deferred.

## How it works

- A single static image has no motion on its own, so the converter
  **synthesizes** animation frames from it using a chosen style (pulse,
  wiggle, bounce, rotate) with configurable frame count and FPS.
- An animated **GIF** instead uses its own real frames and per-frame
  timing, correctly composited according to each frame's GIF disposal
  method.
- Frames are resized to the target cursor size(s) with a hand-rolled
  Lanczos resampler operating in premultiplied-alpha space (no color
  fringing at transparent edges), then encoded as real 32bpp BGRA
  ICO/CUR images with a proper AND mask, and assembled into a RIFF/ACON
  `.ani` container.

See `packages/ani-core/src/encode/ani.ts` and `ico.ts` for the binary
format details, and `packages/ani-core/test/` for the structural/
round-trip tests that validate it.

## Repo layout

```
packages/ani-core/    Shared converter library (browser + Node)
apps/web/              Browser app (Vite + React + Tailwind)
.claude/skills/image-to-ani/   Claude skill: CLI wrapper over ani-core
```

## Getting started

```
npm install
npm run build            # builds packages/ani-core
npm run test              # runs ani-core's unit test suite
npm run dev:web            # starts the web app at http://localhost:5173
```

## Using the web app

Drop in a PNG/JPEG/GIF, pick an animation style (or let the GIF drive its
own frames), set the hotspot by clicking the preview, and download the
`.ani` (plus bonus `.cur`/`.ico`). Everything runs client-side — nothing
is uploaded anywhere.

## Using the Claude skill / CLI directly

```
node .claude/skills/image-to-ani/scripts/convert.mjs \
  --input logo.png --out cursor.ani \
  --style pulse --frames 8 --fps 12 --hotspot 16,16
```

Run with `--help` for the full flag reference. See
`.claude/skills/image-to-ani/SKILL.md` for more examples and details.

## Notes

- Output is validated structurally (RIFF/ICO/CUR byte layout, round-trip
  parsing) via `packages/ani-core`'s test suite — this environment can't
  verify "does Windows actually load this as a cursor" directly.
- `ani-core`'s public entry point (`ani-core`) is environment-agnostic;
  browser and Node consumers import platform-specific image decoding via
  the `ani-core/decode/browser` and `ani-core/decode/node` subpaths,
  respectively, so bundlers never pull Node-only decoders into a browser
  bundle.
