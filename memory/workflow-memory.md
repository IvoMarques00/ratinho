---
title: Workflow Memory
type: memory
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [memory, workflows]
related: [README.md, ../workflows/README.md]
---

# Workflow Memory

## What it stores

A pointer to when each repeatable `workflows/` entry was last run — mainly
relevant for the cadence-based ones (`weekly-review.md`, `monthly-review.md`)
so it's obvious whether they're actually being kept up.

## Storage rule

One line per cadence-based workflow: name, last-run date, link to the most
recent record in `memory/reviews/`.

## Validation rule

Last-run date should match the most recent file in `memory/reviews/`.

## Update rule

Update immediately after running `weekly-review.md` or `monthly-review.md`.

## Retention rule

Only the most recent run per workflow needs to stay here; history lives in
`memory/reviews/` as dated files.
