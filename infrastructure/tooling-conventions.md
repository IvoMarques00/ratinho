---
title: Tooling Conventions
type: standard
status: draft
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [infrastructure, tooling]
related: [README.md, automation-backlog.md, ../governance/maintenance-framework.md]
---

# Tooling Conventions

Conventions for any future tooling that supports the PMA itself — separate
from `.github/workflows/ci.yml`, which builds/tests/lints the
`image-to-ani-converter` app and is not touched by PMA work.

## Current state (v0.1)

No PMA-specific tooling exists yet — no markdown linter, no link checker,
no frontmatter validator. All maintenance (`governance/maintenance-framework.md`)
is manual, run through review workflows.

## Conventions for when tooling is added

- Any PMA tooling script lives under `infrastructure/`, not the app's
  `scripts/` folder (which belongs to `image-to-ani-converter`).
- PMA tooling should run independently of the app's CI — a broken link in
  `knowledge/` should never fail the app's build, and vice versa. If both
  ever need to run in the same CI job, keep them as clearly separate steps.
- Prefer tools with no runtime dependency on a specific AI model — a link
  checker or frontmatter validator should be a plain script, not something
  that requires an LLM call to do a mechanical check.

## Backlog

See `automation-backlog.md` for the specific deferred tooling ideas.
