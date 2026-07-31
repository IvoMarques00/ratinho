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

Animation comes from two engines that plug into the same encoder:
- **Classic (CPU)** — instant, dependency-free 2D affine transforms
  (pulse, wiggle, bounce, rotate).
- **Shader (GPU)** — richer WebGL effects (real bloom/glow, chromatic
  aberration) built on **`packages/render-core`**, a small extensible
  effect framework (see "Adding a new shader effect" below). The exact
  same rendering code runs in the interactive browser app and, headlessly
  via Playwright/Chromium, in the CLI — so what the web app previews is
  byte-for-byte what gets exported, verified in `scripts/verify-shader-parity.mjs`.

A cursor-pack generator (bundling a full set of Windows cursor roles) is
the next planned step, intentionally not built yet.

## How it works

- A single static image has no motion on its own, so the converter
  **synthesizes** animation frames from it — either via a classic style
  (CPU, instant) or a shader effect (GPU, richer, ~1-3s including a
  headless-Chromium launch on the CLI path).
- An animated **GIF** instead uses its own real frames and per-frame
  timing, correctly composited according to each frame's GIF disposal
  method. (GIF input doesn't yet support the shader engine — see Notes.)
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
packages/ani-core/     Shared converter/encoder library (browser + Node)
packages/render-core/   WebGL shader-effect engine (browser + headless Node)
apps/web/                Browser app (Vite + React + Tailwind)
.claude/skills/image-to-ani/   Claude skill: CLI wrapper over both packages
scripts/                 Cross-package verification scripts
```

## Getting started

```
npm install
npm run build                                # builds packages/ani-core
npm run build -w packages/render-core          # builds render-core (+ its browser harness)
npm run test                                    # runs ani-core's unit test suite
npm run test -w packages/render-core             # runs render-core's unit test suite
npm run test:gl -w packages/render-core           # GPU-level checks via headless Chromium
npm run dev:web                                    # starts the web app at http://localhost:5173
```

## Using the web app

Drop in a PNG/JPEG/GIF, pick an animation (Classic or Shader), set the
hotspot by clicking the preview, and download the `.ani` (plus bonus
`.cur`/`.ico`). Everything runs client-side — nothing is uploaded
anywhere, including the shader-effect rendering (it's your browser's own
WebGL, not a server).

## Using the Claude skill / CLI directly

```
node .claude/skills/image-to-ani/scripts/convert.mjs \
  --input logo.png --out cursor.ani \
  --style pulse --frames 8 --fps 12 --hotspot 16,16

# or, for a GPU shader effect:
node .claude/skills/image-to-ani/scripts/convert.mjs \
  --input logo.png --out glow.ani \
  --effect bloom-pulse --effect-param intensity=1.8 --frames 8 --fps 12

node .claude/skills/image-to-ani/scripts/convert.mjs --list-effects
```

Run with `--help` for the full flag reference. See
`.claude/skills/image-to-ani/SKILL.md` for more examples and details.

## Adding a new shader effect

This is the actual point of `render-core`'s design: adding an effect is
one file + one registry line, and the web UI, CLI flags, and most tests
come for free.

1. Define a `UniformSchema` — params with type/default/range, e.g.
   `{ intensity: { type: "float", label: "Intensity", default: 1, min: 0, max: 3 } }`.
2. Write `passes: (params) => PassSpec[]` — each pass is a GLSL ES 3.00
   fragment-shader body (no boilerplate needed; built-in uniforms like
   `uPhase`/`uResolution`/`uSource` and your schema uniforms are declared
   automatically) plus which named buffers it reads/writes. Reuse
   `packages/render-core/src/passes/blur.ts` (Gaussian blur) or
   `threshold.ts` (bright-pass) instead of rewriting them, and
   `glsl/lib.ts`'s small stdlib (`rot2`, `luma`, premultiply helpers,
   `sampleClamped`, noise) auto-inlines into any pass that references it.
3. Register it in `packages/render-core/src/effects/index.ts`.
4. Keep all animation periodic in `uPhase` (`sin(TAU * k * uPhase)` /
   `fract()` forms) so cursors loop seamlessly — a lint
   (`test/effects.test.ts`, no GPU needed) catches violations
   automatically once registered, along with schema-range and
   duplicate/undeclared-uniform checks.
5. Add a GPU-level E2E test (`packages/render-core/test-e2e/`, run via
   `npm run test:gl`) that compiles at min/default/max params and asserts
   something semantically specific to the effect — `bloom-pulse.e2e.mjs`
   and `prism-spin.e2e.mjs` are templates to copy.

See `packages/render-core/src/effects/bloomPulse.ts` and `prismSpin.ts`
for two complete, real examples (bloom/glow and chromatic aberration).

## Notes

- Output is validated structurally (RIFF/ICO/CUR byte layout, round-trip
  parsing) via `packages/ani-core`'s test suite — this environment can't
  verify "does Windows actually load this as a cursor" directly.
- `ani-core`'s public entry point (`ani-core`) is environment-agnostic;
  browser and Node consumers import platform-specific image decoding via
  the `ani-core/decode/browser` and `ani-core/decode/node` subpaths,
  respectively, so bundlers never pull Node-only decoders into a browser
  bundle. `render-core` follows the same split (`.` pure, `./gl`
  browser-only, `./node` headless-Chromium-only via `playwright-core`).
- The shader engine doesn't yet support GIF input (a static image only);
  using `--effect`/a shader style with a GIF source fails with a clear
  error rather than silently ignoring the GIF's frames.
- `packages/render-core/scripts/check-webgl.mjs` is a standalone
  preflight — run it first if the shader path misbehaves, to isolate
  "is this environment's headless Chromium missing WebGL2" from "is this
  our code."
