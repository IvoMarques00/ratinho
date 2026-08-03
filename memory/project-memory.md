---
title: Project Memory
type: memory
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [memory, projects]
related: [README.md, ../projects/README.md]
---

# Project Memory

## What it stores

A quick index of active `projects/` entries and their current status — a
one-line pointer per project, not the project detail itself.

## Storage rule

One line per active project: name, status, link to its `projects/*/README.md`.

## Validation rule

Must match the `status` field of the actual project README; if they drift,
the project README is authoritative.

## Update rule

Update when a project's status changes (started, paused, done) or during
review workflows.

## Retention rule

Remove an entry once its project is archived (`archive/README.md`); the
project's own README carries the historical record.
