---
title: Skills
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [skills]
related: [../workflows/README.md, ../templates/skill-template.md]
---

# skills/

## Purpose

Reusable, model-agnostic capability definitions — documentation of *how* to
do a recurring kind of work, independent of any specific AI model or tool.

## Contents

- `knowledge-management.md`
- `documentation.md`
- `planning.md`
- `research.md`
- `software-development.md`
- `architecture-review.md`
- `learning-management.md`
- `project-organization.md`

Each follows `templates/skill-template.md`: Description, Scope, Inputs,
Required Context, Process, Outputs, Validation Criteria, Improvement Rules.

## Ownership

Ivo.

## `skills/` vs. `.claude/skills/`

This folder is **documentation only** — it is never auto-loaded or executed
by Claude Code. `.claude/skills/` is a separate, pre-existing mechanism (it
currently holds exactly one live skill: `image-to-ani`, the cursor-converter
CLI) that Claude Code actively loads and runs.

A definition in this folder may later be **promoted** into a thin
`.claude/skills/<name>/SKILL.md` wrapper that points back to it — but that is
an explicit, deliberate, per-skill decision made later, never automatic.
The durable artifact is always the `.md` file here; a Claude Code wrapper is
a disposable veneer on top, consistent with "agents are consumers of this
system, not its foundation."

## Maintenance Rules

- Keep skill definitions model-agnostic — no Claude-specific tool names or
  syntax in the Process section.
- If a skill's Process keeps needing ad hoc exceptions, that's a signal the
  skill needs to be revised (per its own Improvement Rules), not worked
  around repeatedly.

## AI Usage Rules

Workflows reference these skills by relative link rather than duplicating
their process. When executing a workflow step that names a skill, read the
skill file for the actual process rather than improvising.

## Relationships

`workflows/` sequences skills into repeatable procedures. `templates/`
provides the skill's own starting structure. `agents/` (future) will specify
which roles draw on which skills.
