---
title: Governance
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [governance]
related: [maintenance-framework.md, decisions/README.md, ../standards/README.md]
---

# governance/

## Purpose

The meta-layer: why the architecture is shaped this way (Architecture
Decision Records) and the policy for actively resisting entropy
(maintenance framework). `standards/` holds the concrete rules in force
today; this folder holds the reasoning behind them and the process for
keeping them enforced.

## Contents

- `maintenance-framework.md` — duplicate detection, link validation,
  obsolete-content detection, terminology consistency, drift prevention,
  knowledge refactoring; currently manual, run via review workflows.
- `decisions/` — ADRs, numbered sequentially, starting with `0001`.

## Ownership

Ivo.

## Maintenance Rules

- A standard should never be restated here — link to `standards/` instead.
- Every non-trivial structural decision gets an ADR, even a short one; the
  cost of skipping it is re-litigating the same question later with no
  record of why it was settled the first time.

## AI Usage Rules

Before proposing a structural change (new top-level folder, a different
skills/workflow split, etc.), check `decisions/` for whether this was
already decided and why.

## Relationships

`standards/` is downstream of `governance/` — a standard should be
traceable to a decision here if it wasn't simply obvious.
`infrastructure/automation-backlog.md` is downstream of
`maintenance-framework.md` — it lists what would automate these checks.
