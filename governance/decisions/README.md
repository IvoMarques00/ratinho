---
title: Decisions
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [governance, adr]
related: [../README.md, ../../templates/adr-template.md]
---

# governance/decisions/

## Purpose

Architecture Decision Records (ADRs) — a permanent log of significant
decisions and their rationale, for this repository's own architecture and
for any codebase within it (e.g. `image-to-ani-converter`).

## When to write one

When a decision would be non-obvious to revisit later: why a structure was
chosen over an alternative, why a folder split happened the way it did, why
a technical approach was picked. Not needed for small, easily-reversed
choices.

## Process

1. Use `templates/adr-template.md`.
2. Number sequentially: `0001-short-title.md`, `0002-...`, never reused or
   renumbered even if a decision is later reversed (write a new ADR that
   supersedes it instead).
3. Link the ADR from whatever it concerns (a folder README, a `domains/` or
   `projects/` entry).

## Contents

- `0001-pma-repo-coexistence.md` — the first ADR, recording why the PMA
  lives in this repository alongside the existing app.
