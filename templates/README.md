---
title: Templates
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [templates]
related: [../standards/frontmatter-schema.md]
---

# templates/

## Purpose

The canonical starting point for every content type in this repository, so
new content is created consistently instead of freeformed each time.

## Contents

| Template | For content in |
|---|---|
| `skill-template.md` | `skills/` |
| `workflow-template.md` | `workflows/` |
| `project-template.md` | `projects/` |
| `domain-template.md` | `domains/` |
| `knowledge-note-template.md` | `knowledge/` |
| `task-template.md` | `tasks/` |
| `adr-template.md` | `governance/decisions/` |
| `review-template.md` | `memory/reviews/` |

## Ownership

Ivo.

## Maintenance Rules

The frontmatter schema is defined once in `standards/frontmatter-schema.md`
— templates apply it, they don't redefine it. If the schema changes, update
every template's frontmatter block to match.

## AI Usage Rules

Start from the matching template when creating new content of any of the
above types, rather than inventing structure ad hoc.

## Relationships

Every other folder that produces content (`skills/`, `workflows/`,
`projects/`, `domains/`, `knowledge/`, `tasks/`, `governance/decisions/`,
`memory/reviews/`) draws its structure from here.
