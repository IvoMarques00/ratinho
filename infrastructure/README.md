---
title: Infrastructure
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [infrastructure]
related: [tooling-conventions.md, automation-backlog.md, ../governance/README.md]
---

# infrastructure/

## Purpose

Specs for tooling that would automate the PMA's own maintenance checks
(link validation, duplicate detection, etc.) plus general PMA-specific
tooling conventions. Explicitly distinct from the existing app's own
`.github/workflows/ci.yml` and `scripts/` — those belong to
`image-to-ani-converter` and are untouched by anything here.

## Contents

- `tooling-conventions.md` — how future PMA tooling should be structured
  and kept separate from the app's CI.
- `automation-backlog.md` — deferred ideas for automating
  `governance/maintenance-framework.md`'s checks.

## Ownership

Ivo.

## Maintenance Rules

Nothing is implemented here yet at v0.1 — keep this folder as specs/backlog
only until there's a concrete, recurring pain point that manual review
isn't handling.

## AI Usage Rules

Do not build automation from this backlog unless explicitly asked — these
are recorded ideas, not an approved implementation plan.

## Relationships

Downstream of `governance/maintenance-framework.md`: that file defines
*what* gets checked; this folder is *how it might eventually be automated*.
