---
title: "Example atomic note: premultiplied alpha in ICO/CUR encoding"
type: knowledge
status: stable
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [example, image-encoding, reference]
related: [README.md, ../domains/software-architecture/README.md, ../projects/image-to-ani-converter/README.md]
---

# Example atomic note: premultiplied alpha in ICO/CUR encoding

This file exists to demonstrate the shape of a `knowledge/` note — one
self-contained fact or concept, frontmatter included, linked into a domain
and a project rather than left standalone.

## The note

32bpp BGRA ICO/CUR images store color channels premultiplied by alpha:
`stored_channel = raw_channel * (alpha / 255)`. Decoders that skip
un-premultiplying before compositing get a darkened fringe around
semi-transparent edges. This matters for any cursor/icon export pipeline
targeting the Windows `.ico`/`.cur`/`.ani` formats.

## Why this is atomic

It's one fact, small enough to link to from multiple places without
duplicating it: the `software-architecture` domain can reference it as a
general encoding concept, and the `image-to-ani-converter` project can
reference it as the specific reason its encoder does the premultiply step.
Neither needs to restate the fact — they link here.
