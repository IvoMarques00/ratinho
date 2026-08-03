---
title: Architecture Review
type: skill
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [skill, architecture-review]
related: [README.md, ../governance/README.md, ../governance/decisions/README.md]
---

# Architecture Review

## Description

Evaluate a proposed or existing design (in a codebase, or in the PMA
itself) against its stated goals and record the outcome as a decision,
rather than leaving the reasoning implicit.

## Scope

Applies to significant structural decisions — a codebase's architecture, or
the PMA's own folder/process design. Not needed for small, obviously
reversible choices.

## Inputs

The design under review and the goals/constraints it needs to satisfy.

## Required Context

`governance/decisions/` (existing ADRs, to check for precedent or
conflicting prior decisions), and the relevant `domains/` content.

## Process

1. State what's being reviewed and against what criteria.
2. Check `governance/decisions/` for related prior decisions.
3. Identify alternatives actually considered, not just the chosen option.
4. Reach a conclusion and write it as an ADR in `governance/decisions/`
   using `templates/adr-template.md`, or as a `knowledge/` note if it's
   informational rather than a decision.
5. Link the outcome from the relevant `domains/` or `projects/` entry.

## Outputs

A new ADR (for a decision) or knowledge note (for a review finding), linked
from the reviewed system's domain/project.

## Validation Criteria

The reasoning and alternatives are recorded, not just the conclusion; the
record is discoverable from the thing it's about.

## Improvement Rules

If the same architectural question keeps resurfacing, that means the prior
ADR wasn't linked prominently enough — fix the linking, don't just re-answer
the question.
