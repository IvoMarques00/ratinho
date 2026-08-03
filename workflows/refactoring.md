---
title: Refactoring
type: workflow
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [workflow, refactoring]
related: [README.md, ../skills/software-development.md, ../skills/architecture-review.md]
---

# Refactoring

## Trigger

Code structure needs improving without changing external behavior.

## Preconditions

Existing tests cover the behavior being preserved (or are added first).

## Steps

1. Confirm the refactor's motivation and scope, checking for architectural
   implications. — invokes [Architecture Review](../skills/architecture-review.md).
2. Perform the refactor, verifying behavior is preserved via tests. —
   invokes [Software Development](../skills/software-development.md).
3. If the refactor reflects a broader design decision, record it. —
   invokes [Architecture Review](../skills/architecture-review.md).

## Skills Referenced

- [Architecture Review](../skills/architecture-review.md)
- [Software Development](../skills/software-development.md)

## Outputs

Restructured code with unchanged behavior; optionally a new ADR in
`governance/decisions/`.

## Filing

Target codebase; `governance/decisions/` if a design decision was recorded.
