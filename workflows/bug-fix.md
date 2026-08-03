---
title: Bug Fix
type: workflow
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [workflow, bug-fix]
related: [README.md, ../skills/software-development.md]
---

# Bug Fix

## Trigger

A bug is identified in a project's codebase.

## Preconditions

The bug is reproducible or at least clearly describable.

## Steps

1. Root-cause the bug before changing code. — invokes
   [Software Development](../skills/software-development.md).
2. Implement and test the fix. — invokes
   [Software Development](../skills/software-development.md).
3. If the root cause reveals a durable technical fact (e.g. a subtle format
   quirk), capture it. — invokes
   [Knowledge Management](../skills/knowledge-management.md).
4. Update the project's status if relevant. — invokes
   [Project Organization](../skills/project-organization.md).

## Skills Referenced

- [Software Development](../skills/software-development.md)
- [Knowledge Management](../skills/knowledge-management.md)
- [Project Organization](../skills/project-organization.md)

## Outputs

A tested fix in the target codebase; optionally a new `knowledge/` note
documenting the root cause.

## Filing

Target codebase; `knowledge/` if a durable insight was found.
