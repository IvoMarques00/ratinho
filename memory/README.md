---
title: Memory
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [memory]
related: [identity-memory.md, preference-memory.md, project-memory.md, technical-memory.md, workflow-memory.md, reviews/README.md]
---

# memory/

## Purpose

Small, high-signal pointers and indexes — not a knowledge dump. The bulk of
actual content lives in `identity/`, `knowledge/`, `domains/`, `projects/`.
Memory exists to answer "where do I look" quickly, not to store the answer
itself.

## Contents

- `identity-memory.md`, `preference-memory.md`, `project-memory.md`,
  `technical-memory.md`, `workflow-memory.md` — one index per category.
- `reviews/` — dated weekly/monthly review records (the one place memory
  holds actual point-in-time content, since a review record IS the pointer).

## Ownership

Ivo.

## Maintenance Rules

- If any of the five category files starts accumulating full explanations
  rather than short pointers, that content has outgrown memory — move it to
  `knowledge/`, `domains/`, or `projects/` and leave a pointer behind.
- Each category file states its own storage/validation/update/retention
  rules — check those before adding an entry.

## AI Usage Rules

Treat these files as an index, not a source. When memory points to another
file, read that file for the actual content rather than treating the
pointer's one-line summary as sufficient. Never write a long-form answer
directly into a memory file — write it in the proper folder and point to it
from here.

## Relationships

Memory is deliberately thin compared to `identity/`, `knowledge/`,
`domains/`, and `projects/` — those are the source of truth; memory just
indexes into them.
