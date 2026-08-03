---
title: Tasks
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [tasks]
related: [../skills/README.md, ../workflows/README.md, ../templates/task-template.md]
---

# tasks/

## Purpose

Ephemeral action items — the temporary layer, distinct from the two
permanent/repeatable layers below.

## The three-way distinction

| Concept | Lifespan | Contains | Example |
|---|---|---|---|
| **Skill** (`skills/`) | Permanent | A reusable capability's process | "Research" |
| **Workflow** (`workflows/`) | Permanent, repeatable | An ordered sequence of skill references | "New Project" |
| **Task** (`tasks/`) | Temporary | A single, concrete action item | "Draft the roadmap entry for X" |

A skill defines *how* to do a kind of work. A workflow defines *when and in
what order* skills get invoked for a recurring situation. A task is a
one-off instance of work to do, often produced by running a workflow.

## Contents

No seed tasks — tasks are genuinely ephemeral and created on demand using
`templates/task-template.md`, not pre-populated.

## Ownership

Ivo.

## Maintenance Rules

- Tasks live flat under `tasks/` while active.
- On completion: if the task produced something durable (a decision, a
  fact, a project update), promote that content into `knowledge/`,
  `domains/`, `projects/`, or `memory/` first — then delete the task file.
  A task should never be the permanent record of something worth keeping.
- A task with no promotable output is simply deleted once done.
- A task lingering long after it should be done is a signal for
  `workflows/weekly-review.md` to flag it.

## AI Usage Rules

Don't leave completed tasks in this folder "for the record" — that's what
promotion into the permanent folders (and git history) is for. If unsure
whether a task's output is worth promoting, err on checking
`knowledge/LIFECYCLE.md`'s Classification stage rather than defaulting to
silently deleting it.

## Relationships

`workflows/` often produce tasks as their concrete output (see
`workflows/new-project.md`). `skills/project-organization.md` covers
ongoing task hygiene.
