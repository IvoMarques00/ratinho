---
title: Language
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [language]
related: [glossary.md, ../standards/README.md]
---

# language/

## Purpose

The canonical terminology framework: concepts, entities, relationships,
labels, tags, and aliases used consistently across the whole repository.
Exists to prevent meaning drift — the same idea getting three different names
in three different documents.

## Contents

- `glossary.md` — the single glossary file. Kept as one file at v0.1 rather
  than split by category, to avoid premature structure before real usage
  shows where the seams should be.

## Ownership

Ivo. This file is small on purpose — it should stay a quick reference, not
grow into a second documentation system.

## Maintenance Rules

- Add a term here the first time it's needed by more than one document.
- If two documents appear to use different words for the same concept,
  that's terminology drift — resolve it here and update the documents to
  match, per `governance/maintenance-framework.md`.

## AI Usage Rules

Check `glossary.md` before introducing new terminology, category names, or
tags anywhere in the repository. Reuse existing terms; extend the glossary
rather than silently coining a new one.

## Relationships

Every `skills/`, `workflows/`, and `agents/` document should be consistent
with the terms defined here. `standards/frontmatter-schema.md` references
this file for tag consistency.
