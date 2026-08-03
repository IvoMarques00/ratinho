---
title: Project Organization
type: skill
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [skill, project-organization]
related: [README.md, ../projects/README.md, ../tasks/README.md]
---

# Project Organization

## Description

Keep a project's structure, status, and task breakdown current and
traceable — the ongoing bookkeeping that keeps `projects/` and `tasks/`
trustworthy rather than stale.

## Scope

Applies throughout a project's life, not just at creation (that's
`planning.md`'s job). Covers status updates, task breakdown/cleanup, and
keeping the project's `related:` links to `strategy/` and `domains/`
current.

## Inputs

An existing `projects/` entry and its current set of related `tasks/`.

## Required Context

`tasks/README.md` (the skill/workflow/task distinction and completion
rules), `projects/README.md`.

## Process

1. Break the project's goal into `tasks/` entries as needed, using
   `templates/task-template.md`.
2. Keep the project's `status` field current as work progresses.
3. On task completion: promote any durable output into `knowledge/`,
   `domains/`, or the project's own README, then remove the task file.
4. Periodically confirm the project's `related:` links to `strategy/` and
   `domains/` are still accurate.

## Outputs

An up-to-date `projects/*/README.md`, a clean `tasks/` list (no completed-
but-lingering tasks), and any promoted knowledge.

## Validation Criteria

No completed tasks left sitting in `tasks/`; project status reflects
reality; nothing durable was lost when a task was removed.

## Improvement Rules

If tasks are routinely completed without their outputs being promoted
anywhere, tighten the completion step in `workflows/` that produced them.
