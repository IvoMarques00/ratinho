---
title: Folder Structure
type: standard
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [standards, folder-structure, information-architecture]
related: [../CLAUDE.md, file-naming.md]
---

# Folder Structure

This is the canonical map of the repository root. `CLAUDE.md` links here
rather than restating it — if the two ever disagree, this file is correct and
`CLAUDE.md` should be updated to match.

## App vs. architecture

- `apps/`, `packages/`, root `package.json`/`tsconfig*`/`eslint.config.js`,
  `.github/workflows/ci.yml`, and `.claude/skills/image-to-ani/` belong to the
  image-to-.ani cursor converter app. The Personal Master Architecture (PMA)
  does not modify these.
- Everything else at root is the PMA.

## PMA folders

| Folder | Purpose |
|---|---|
| `identity/` | Durable preferences, principles, working style, objectives. |
| `strategy/` | Vision, roadmap, priorities that work should trace up to. |
| `memory/` | Minimal, high-signal indexes/pointers — not a knowledge dump. |
| `knowledge/` | Atomic reference notes and the Knowledge Lifecycle. |
| `domains/` | Subject-matter areas aggregating related knowledge notes. |
| `projects/` | Time-bound or ongoing initiatives with goals and status. |
| `skills/` | Reusable, model-agnostic capability definitions (docs only). |
| `workflows/` | Repeatable multi-step procedures that reference skills. |
| `tasks/` | Ephemeral action items — temporary, not permanent. |
| `templates/` | Canonical starting point for every content type. |
| `language/` | Canonical terminology: concepts, entities, tags, aliases. |
| `standards/` | Concrete rules in force today (this folder). |
| `governance/` | Why the architecture is shaped this way; maintenance policy. |
| `infrastructure/` | Specs for tooling that automates governance's checks. |
| `agents/` | Specifications for future AI agent roles (no code). |
| `archive/` | Superseded content and redirect rules. |

Each folder's own `README.md` has the full detail (Purpose, Contents,
Ownership, Maintenance Rules, AI Usage Rules, Relationships) — this table is
just the map.
