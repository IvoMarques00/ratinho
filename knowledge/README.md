---
title: Knowledge
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [knowledge]
related: [LIFECYCLE.md, ../domains/README.md, ../memory/README.md]
---

# knowledge/

## Purpose

Holds atomic reference notes — single facts, concepts, or explanations small
enough to link to from multiple places without duplication — and the
Knowledge Lifecycle process that governs how all durable content in this
repository gets captured, classified, and maintained.

## Contents

- `LIFECYCLE.md` — the Capture → Classification → Normalization → Linking →
  Storage → Validation → Improvement → Review process. Read this before
  adding any new durable content anywhere in the repository, not just here.
- `example-atomic-note.md` — a seed note demonstrating the pattern.

## Ownership

Ivo. Notes here are meant to be low-friction to add — an atomic note is one
fact, not a project.

## Maintenance Rules

- One concept per note. If a note is accumulating multiple unrelated facts,
  split it.
- Every note should be linked from at least one `domains/` README (its
  subject area) or `projects/` README (the initiative that produced it).
  An unlinked note is a sign the Linking stage of the lifecycle was skipped.
- Follow the Knowledge Lifecycle for anything added here.

## AI Usage Rules

Before writing a new note, search existing notes and `domains/` content for
overlap — the lifecycle prioritizes integration over accumulation. Use
`templates/knowledge-note-template.md` as the starting structure.

## Relationships

- **`domains/`** aggregates multiple `knowledge/` notes into a subject area —
  knowledge is the atomic unit, domains are the grouping.
- **`memory/`** is different in kind: memory is a small pointer/index,
  knowledge is the actual reference content memory might point to.
- **`projects/`** links out to relevant knowledge notes rather than
  duplicating the underlying facts inline.
