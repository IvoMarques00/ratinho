---
title: Knowledge Management
type: skill
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [skill, knowledge-management]
related: [README.md, ../knowledge/LIFECYCLE.md, ../language/glossary.md]
---

# Knowledge Management

## Description

Capture new information and integrate it into the repository correctly,
following the Knowledge Lifecycle, instead of just appending it somewhere.

## Scope

Applies whenever new durable information appears — a fact, a decision, a
research finding, a correction to something already stored. Does not cover
ephemeral action items (see `project-organization.md` / `tasks/`) or the
act of writing polished prose (see `documentation.md`).

## Inputs

The new piece of information, in whatever raw form it arrived (a note, a
conversation outcome, a research result).

## Required Context

`knowledge/LIFECYCLE.md`, `language/glossary.md`, and the destination
folder's README (`knowledge/`, `domains/`, `identity/`, or `memory/`).

## Process

1. Capture the raw information without losing it (see Lifecycle stage 1).
2. Classify: decide the `type` and destination folder, checking
   `language/glossary.md` for existing categories/terms first.
3. Normalize: apply `standards/frontmatter-schema.md` and the matching
   `templates/` file.
4. Link: search existing content for overlap; add `related:` entries and
   inline links; update the relevant `domains/`/`projects/` README.
5. Store: commit the file at its final path.
6. Validate: confirm links resolve and nothing contradicts existing content.
7. Improve: fix anything better while it's fresh, rather than filing a task.

## Outputs

A normalized, linked, stored file in the correct folder.

## Validation Criteria

The new content is discoverable from at least one existing document (not
orphaned), doesn't duplicate an existing note, and follows the frontmatter
schema.

## Improvement Rules

If classification repeatedly feels ambiguous for a recurring kind of
content, that's a signal to add a term/category to `language/glossary.md`
rather than re-deciding it each time.
