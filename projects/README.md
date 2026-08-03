---
title: Projects
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [projects]
related: [../strategy/README.md, ../domains/README.md]
---

# projects/

## Purpose

Time-bound or ongoing initiatives with their own goals and status, each
linking out to relevant `domains/` and `knowledge/` rather than duplicating
that content. Unlike a domain (a subject area) a project has a goal, a
status, and eventually an end or a steady state.

## Contents

- `image-to-ani-converter/` — the pre-existing cursor-converter app in this
  repo, documented as the first real project entry.

Each project is a subfolder with its own `README.md` following
`templates/project-template.md`.

## Ownership

Ivo.

## Maintenance Rules

- Every project's `related:` should trace to `strategy/roadmap.md` or
  `strategy/vision.md`. If it doesn't, either add the link or note
  explicitly that it's unattached exploratory/hobby work.
- Update a project's `status` field as it changes; don't let it go stale —
  check during `workflows/weekly-review.md`.
- When a project ends, move its status to `deprecated`/`archived` and follow
  `archive/README.md` rather than deleting it outright.

## AI Usage Rules

Before starting a new project, use `workflows/new-project.md` and
`templates/project-template.md` rather than creating an ad hoc folder.

## Relationships

`strategy/` is what a project should trace up to; `domains/` and
`knowledge/` are what a project links out to for supporting detail;
`memory/project-memory.md` is the thin status index across all projects.
