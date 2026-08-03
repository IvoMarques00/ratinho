---
title: Agents
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [agents]
related: [../skills/README.md, ../workflows/README.md]
---

# agents/

## Purpose

Specifications for future AI agent roles — Responsibility, Inputs, Outputs,
Boundaries, which skills/workflows they draw on, and handoff points. This
folder contains **no implementations**, no code, no live agent
configuration. Agents emerge from the environment defined elsewhere in this
repository (`skills/`, `workflows/`, `standards/`, `governance/`); they are
not the foundation of it.

## Contents

- `router.md` — matches a request to a workflow/skill.
- `planner.md` — turns a goal into a plan.
- `builder.md` — executes a plan.
- `reviewer.md` — checks output against validation criteria.
- `documentation-maintainer.md` — runs the maintenance framework.
- `archivist.md` — handles archiving.

## Ownership

Ivo.

## Maintenance Rules

- A spec here should never define new process — it should only reference
  existing `skills/`/`workflows/` and describe how a role uses them.
- Do not implement any of these as live Claude Code agents/configuration
  until the environment (skills, workflows, standards) has been used
  directly (without an agent) enough to prove it out. Optimize for
  maintainability of the environment, not for agent autonomy.

## AI Usage Rules

Treat these as reference specs for a possible future division of labor, not
as instructions to act as one of these roles right now unless explicitly
asked to.

## Relationships

Every spec here draws on `skills/` and `workflows/` rather than defining its
own logic — this folder is downstream of, not parallel to, the rest of the
PMA.
