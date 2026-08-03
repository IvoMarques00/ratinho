---
title: image-to-ani-converter
type: project
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [project, software-development, image-encoding]
related: [../README.md, ../../domains/software-architecture/README.md, ../../strategy/roadmap.md]
---

# image-to-ani-converter

## Goal

Convert a JPG/PNG/animated GIF into a high-fidelity Windows `.ani` animated
cursor (or static `.cur`/`.ico`), from both a browser UI (`apps/web`) and a
headless CLI (`.claude/skills/image-to-ani`), sharing one implementation
(`packages/ani-core`, `packages/render-core`) so both surfaces produce
byte-identical output.

## Status

Active, beta (`0.1.0-beta.1`). Currently shipping: classic CPU animation
styles, six WebGL shader effects with verified web/CLI parity, GIF input
support. Next planned (not yet built): a full cursor-pack generator bundling
the complete set of Windows cursor roles.

This is the actual pre-existing codebase in this repository (`apps/`,
`packages/`, `scripts/verify-shader-parity.mjs`, root `package.json`, and the
`.claude/skills/image-to-ani/` Claude Code skill) — this project entry
documents it inside the PMA rather than duplicating its code-level detail,
which stays in the root `README.md` and the code itself.

## Traces to

[strategy/roadmap.md](../../strategy/roadmap.md) — not yet formally linked
to a named priority beyond "the app that already exists here"; add a
specific roadmap entry once new work on it is planned.

## Related domains

- [software-architecture](../../domains/software-architecture/README.md) —
  encoding-format and rendering-architecture concepts this project surfaces.

## Related knowledge

- [Premultiplied alpha in ICO/CUR encoding](../../knowledge/example-atomic-note.md)

## Notes

The project's own contributor-facing detail (build/test commands, adding a
new shader effect, repo layout) lives in the root `README.md` — this file is
the PMA-side pointer and status record, not a replacement for it.
