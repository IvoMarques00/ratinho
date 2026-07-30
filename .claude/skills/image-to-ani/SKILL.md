---
name: image-to-ani
description: Convert a JPG, JPEG, PNG, or animated GIF image into a high-fidelity Windows .ANI animated cursor (or a static .CUR/.ICO). Use when the user asks to turn an image into a cursor, animated cursor, .ani file, .cur file, or wants cursor-pack-style assets generated from an image, from the command line (no browser needed).
---

# Image → .ANI Cursor Converter

Converts a static image (PNG/JPEG) or an animated GIF into a real Windows
`.ani` animated cursor, or a static `.cur`/`.ico`. This is a thin CLI
wrapper around the `ani-core` package (`packages/ani-core`), which also
powers the browser-based converter app in `apps/web` — both produce
byte-identical output for the same inputs, since they share the same
encoder.

## When to use this

Use this whenever the user wants an image converted into a cursor file,
including:
- "turn this image into an animated cursor"
- "make a .ani file from this PNG/JPEG"
- "convert this GIF into a Windows cursor"
- "give me a .cur file with a custom hotspot from this image"

## How to run it

```
node .claude/skills/image-to-ani/scripts/convert.mjs --input <file> --out <file> [options]
```

Run `node .claude/skills/image-to-ani/scripts/convert.mjs --help` for the
full flag reference. Key options:

- `--input <path>` — required. PNG, JPEG, or animated GIF.
- `--out <path>` — required. Where to write the result.
- `--style <none|pulse|wiggle|bounce|rotate>` — for a static image, how to
  synthesize animation frames (a single image has no motion on its own, so
  the tool procedurally generates it). Ignored for GIF input, which uses
  the GIF's own real frames instead. Default `none` (single static frame).
- `--frames <n>` — number of synthesized frames (default 8).
- `--fps <n>` — playback rate (default 12).
- `--size <n[,n...]>` — cursor pixel size(s) to embed, e.g. `32` or `32,48`
  (default `32`, the standard Windows cursor size).
- `--hotspot <x,y>` — the click point, in pixels of the base size (default:
  image center).
- `--format <ani|cur>` — output container (default `ani`).

## Examples

Animated cursor from a logo, with a gentle pulse:
```
node .claude/skills/image-to-ani/scripts/convert.mjs \
  --input logo.png --out cursor.ani \
  --style pulse --frames 8 --fps 12 --hotspot 16,16
```

Static cursor with a custom hotspot and both 32px and 48px sizes embedded:
```
node .claude/skills/image-to-ani/scripts/convert.mjs \
  --input pointer.png --out pointer.cur \
  --format cur --size 32,48 --hotspot 4,4
```

Animated cursor from a real animated GIF (uses the GIF's own frames/timing):
```
node .claude/skills/image-to-ani/scripts/convert.mjs \
  --input dance.gif --out dance.ani
```

## Prerequisites

`ani-core` must be built once before first use (`npm install && npm run
build -w packages/ani-core` from the repo root). If the script fails with a
module-resolution error mentioning `ani-core`, run that build first.

## Notes on fidelity

- Cursor images are 32×32 (or the requested size) 32bpp BGRA with a proper
  AND mask — real Windows cursor format, not just a resized PNG wrapped in
  a container.
- Resizing uses a hand-rolled Lanczos resampler operating in
  premultiplied-alpha space, so partially-transparent edges don't pick up
  dark/light color fringing.
- This environment cannot verify "does Windows actually load this as a
  cursor" — output is validated structurally (RIFF/ICO/CUR byte layout,
  round-trip parsing) via `packages/ani-core`'s test suite. If something
  looks visually wrong on an actual Windows machine, that's useful
  signal to report back.
