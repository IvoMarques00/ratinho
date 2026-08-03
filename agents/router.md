---
title: "Agent Spec: Router"
type: agent-spec
status: draft
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [agent-spec, router]
related: [README.md, ../workflows/README.md]
---

# Agent Spec: Router

## Responsibility

Given an incoming request, determine which `workflows/` entry (or, absent a
matching workflow, which `skills/` directly) applies, and hand off
accordingly. Does not perform the work itself.

## Inputs

The raw request/goal; the current `workflows/` and `skills/` catalogs.

## Outputs

A named workflow or skill selection, with reasoning, handed to whichever
agent (Planner, Builder, etc.) executes it.

## Boundaries

Must not skip straight to execution — routing is a distinct step from
doing. Must not invent a new workflow ad hoc; if nothing fits, that's a
signal for a human (or `skills/planning.md`) to define one first.

## Skills / Workflows drawn on

Reads `workflows/README.md` and `skills/README.md` to match requests to
existing procedures.

## Handoff points

To Planner (for anything needing `skills/planning.md`), or directly to
Builder/Reviewer/Documentation Maintainer for simple, already-scoped work.
