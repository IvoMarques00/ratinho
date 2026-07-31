# render-core

A small, extensible WebGL shader-effect engine for animating a cursor
image — the GPU counterpart to `ani-core`'s CPU affine styles (pulse,
wiggle, bounce, rotate). See the root [`README.md`](../../README.md) for
the full project picture; this file covers just this package.

## Entry points

- `.` — pure TS: types, uniform-schema resolution, timing, the GL-free
  render-plan validator, GLSL assembly/lint, and the effect registry
  (`listEffects`/`getEffect`). No GL, no DOM, safe in Node/Vitest.
- `./gl` — browser-only: the WebGL2 renderer (`ShaderRenderer`) and
  `bakeCursorFrames()`. Requires a `Canvas`.
- `./node` — Node-only, ESM-only (`import.meta.url`-based path
  resolution, so it has no `require()` condition): `renderFramesHeadless()`,
  which launches headless Chromium via `playwright-core` and runs the
  browser harness (`dist/harness.global.js`) — the same rendering code the
  browser build uses, for byte-for-byte parity between the interactive
  app and the CLI/skill.

## Build & test

```
npm run build      # tsup: builds ./ , ./gl , ./node , and the harness IIFE bundle
npm run test        # Vitest — pure, GPU-free unit tests
npm run test:gl      # GPU-level checks via headless Chromium (test-e2e/*.e2e.mjs)
npm run check:gl      # standalone WebGL2 preflight — run this first if test:gl fails
```

`npm run build` must run before `test:gl` (or before anything imports
`./node`) — the headless path loads `dist/harness.global.js` directly and
throws a clear error if it's missing.

## Adding a new effect

See the root README's "Adding a new shader effect" section for the full
recipe. Short version: define a `UniformSchema`, write
`passes: (params) => PassSpec[]` (reuse `src/passes/blur.ts` and
`threshold.ts` where you can), register it in `src/effects/index.ts`, and
add a GPU-level test in `test-e2e/` modeled on `bloom-pulse.e2e.mjs` or
`prism-spin.e2e.mjs`. The web app's controls and the skill CLI's
`--effect-param` flags are generated from the schema automatically — no
UI or CLI code needed per effect.

## Why two renderer lifecycles

`bakeCursorFrames()` constructs and disposes its own `ShaderRenderer` per
call, rather than taking a long-lived renderer. This keeps the harness
(one bake per `page.evaluate()` call) and the web app (bakes debounced
behind slider changes) using the identical function. The web app avoids
real WebGL-context churn by reusing one persistent `<canvas>` across
bakes (`apps/web/src/lib/renderer.ts`) — per the WebGL spec, repeated
`canvas.getContext("webgl2", <same attrs>)` calls on the same canvas
return the same underlying context, so each `ShaderRenderer` instance
just re-wraps it rather than creating a new one.
