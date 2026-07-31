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
encoder. Richer GPU-shader animation (`--effect`) is powered by
`packages/render-core`, which renders through the same headless-Chromium
engine the interactive app's browser uses, so the shader path also stays
in parity with what the web app previews.

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

## Shader effects (GPU, richer than `--style`) — Experimental

For more elaborate motion than the CPU `--style` styles can express (real
bloom/glow, chromatic aberration, per-channel color fringing), use
`--effect` instead of `--style`. These render via WebGL in a headless
Chromium (`packages/render-core`), so they take longer (~1-3s vs.
instant) and require that browser to be available — but the exact same
rendering code also powers the web app's live preview, so what you see
there is exactly what gets exported.

**Experimental**: this path has only ever been validated against headless
Chromium's SwiftShader software renderer (this sandbox's own headless
Chromium). Real-GPU/browser driver behavior (a user's actual Chrome,
Firefox, Safari, or mobile browser) hasn't been verified.

- `--effect <id>` — shader effect id (e.g. `bloom-pulse`, `prism-spin`).
  Mutually exclusive with `--style`.
- `--effect-param key=value` — repeatable. Valid keys/types/ranges are
  per-effect; run `--list-effects` to see them. Numbers, booleans, and
  colors (`"r,g,b,a"` 0..1 or `"#rrggbb"`/`"#rrggbbaa"`) are all supported.
- `--supersample <1..4>` — internal render resolution multiplier (default:
  chosen automatically from `--size`).
- `--list-effects` — print every available effect with its full param
  list, defaults, and ranges. Doesn't require `--input`/`--out`.
- Not yet supported for GIF input (a static PNG/JPEG source only) — for
  GIF input, use `--style` (or no style) to keep the GIF's own frames.

```
node .claude/skills/image-to-ani/scripts/convert.mjs --list-effects
```

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

A glowing neon-bloom cursor via the GPU shader path:
```
node .claude/skills/image-to-ani/scripts/convert.mjs \
  --input logo.png --out glow.ani \
  --effect bloom-pulse --effect-param intensity=1.8 --effect-param tint="#ffcc88" \
  --frames 8 --fps 12
```

## Prerequisites

`ani-core` must be built once before first use (`npm install && npm run
build -w packages/ani-core` from the repo root). If the script fails with a
module-resolution error mentioning `ani-core`, run that build first.

For `--effect` (the shader path), `render-core` must also be built
(`npm run build -w packages/render-core`), and a headless-Chromium-capable
`playwright-core` install is required — both are already set up in this
environment. Run `node packages/render-core/scripts/check-webgl.mjs` to
diagnose if the shader path fails to launch.

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
