---
title: Workflows
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [workflows]
related: [../skills/README.md, ../tasks/README.md, ../templates/workflow-template.md]
---

# workflows/

## Purpose

Repeatable, multi-step procedures that sequence one or more `skills/`
together. A workflow contains no process logic of its own beyond ordering
and filing rules — the actual "how" lives in the skills it references.

## Contents

- `new-information.md`
- `new-project.md`
- `research-activity.md`
- `feature-development.md`
- `bug-fix.md`
- `refactoring.md`
- `documentation-update.md`
- `knowledge-review.md`
- `weekly-review.md`
- `monthly-review.md`

Each follows `templates/workflow-template.md`.

## Ownership

Ivo.

## Maintenance Rules

- A workflow must not duplicate a skill's process — if a step needs more
  than a one-line description, that description belongs in the referenced
  skill, not inline here.
- If two workflows are converging on the same undocumented step, extract it
  into a skill.

## AI Usage Rules

Follow a workflow's steps in order, opening each referenced skill file for
the actual process rather than guessing from the step's short description.

## Relationships

`skills/` supplies the reusable process; `tasks/` is what a workflow often
produces as its concrete, ephemeral to-do items (see `tasks/README.md` for
how workflow, skill, and task differ).
