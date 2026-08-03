---
title: "0001: PMA and the existing app coexist in one repository"
type: adr
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [adr, governance]
related: [../README.md, ../../skills/README.md, ../../standards/folder-structure.md]
---

# 0001: PMA and the existing app coexist in one repository

## Context

`ratinho` already contained a working TypeScript monorepo (the
image-to-.ani cursor converter: `apps/`, `packages/`, one Claude Code skill
at `.claude/skills/image-to-ani/`) when the Personal Master Architecture
(PMA) was scaffolded. The PMA needed a home, and this repository — owned by
the same person the PMA organizes work for — was the natural candidate.

## Decision

The PMA is scaffolded at the root of this same repository, alongside the
existing app, rather than in a separate repository. Two coexistence rules
follow from this:

1. **`skills/` (PMA, documentation-only) vs. `.claude/skills/` (Claude
   Code's live skill mechanism)** stay separate. `skills/` holds durable,
   model-agnostic capability definitions that are never auto-loaded.
   `.claude/skills/image-to-ani/` is untouched and remains the only live
   Claude Code skill. Promoting a `skills/*.md` definition into a
   `.claude/skills/` wrapper is a deliberate, later, per-skill action.
2. **`governance/` vs. `standards/` vs. `infrastructure/`** are split so
   each has one job: `standards/` is the current concrete rules,
   `governance/` is the rationale and maintenance policy (this ADR lives
   here), `infrastructure/` is deferred tooling specs, kept separate from
   the app's own `.github/workflows/ci.yml`.

The existing app is documented inside the PMA as its first real
`projects/` entry (`projects/image-to-ani-converter/`) rather than being
left undocumented from the PMA's perspective.

## Alternatives considered

- **Separate repository for the PMA.** Rejected: the PMA's stated purpose
  is to organize *all* of Ivo's work, including this app; splitting it out
  would immediately create the cross-repo fragmentation the PMA exists to
  prevent.
- **Merge `skills/` into `.claude/skills/`.** Rejected: would make every
  documentation-only capability definition into a live, auto-loaded Claude
  Code skill, which conflates a durable knowledge artifact with a
  disposable tool-specific mechanism — violating "agents are consumers of
  this system, not its foundation."

## Consequences

- New root-level PMA folders introduce no naming or tooling conflicts with
  the npm workspace (`package.json` scopes `workspaces` to `packages/*` and
  `apps/*` only).
- Anyone extending this repository needs to know the app/PMA split exists;
  `CLAUDE.md` and `standards/folder-structure.md` make this explicit so it
  isn't rediscovered by trial and error.
- Future skill promotion (`skills/` → `.claude/skills/`) has no criteria
  defined yet — deferred, tracked in `standards/README.md`'s and
  `skills/README.md`'s v0.2+ notes.
