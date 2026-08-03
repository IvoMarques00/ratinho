---
title: New Information
type: workflow
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [workflow, new-information]
related: [README.md, ../knowledge/LIFECYCLE.md, ../skills/knowledge-management.md]
---

# New Information

## Trigger

Any time a new fact, decision, or piece of durable information surfaces
that isn't already covered anywhere in the repository.

## Preconditions

None — this is the default entry point for anything new.

## Steps

1. Capture the information immediately (don't lose it). — invokes
   [Knowledge Management](../skills/knowledge-management.md).
2. Run it through the Knowledge Lifecycle: Classification, Normalization,
   Linking, Storage, Validation, Improvement. — invokes
   [Knowledge Management](../skills/knowledge-management.md), following
   [knowledge/LIFECYCLE.md](../knowledge/LIFECYCLE.md).
3. Write the resulting content per repository conventions. — invokes
   [Documentation](../skills/documentation.md).

## Skills Referenced

- [Knowledge Management](../skills/knowledge-management.md)
- [Documentation](../skills/documentation.md)

## Outputs

A new or updated file in `knowledge/`, `domains/`, `identity/`, or
`memory/`, correctly linked.

## Filing

Destination folder depends on classification (step 2) — see
`standards/folder-structure.md`.
