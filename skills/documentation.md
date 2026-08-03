---
title: Documentation
type: skill
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [skill, documentation]
related: [README.md, ../standards/markdown-conventions.md, ../standards/linking-strategy.md]
---

# Documentation

## Description

Write or update a document so it's clear, correctly linked, and consistent
with the rest of the repository — as opposed to just getting words down.

## Scope

Applies to writing/editing any markdown file in the PMA: README updates,
skill/workflow definitions, project docs, ADRs. Does not cover deciding
*what* content should exist (see `knowledge-management.md` for that) — this
skill is about the writing/formatting quality once the content is decided.

## Inputs

A draft, an outline, or an existing document that needs updating.

## Required Context

`standards/markdown-conventions.md`, `standards/frontmatter-schema.md`,
`standards/linking-strategy.md`, and the relevant `templates/` file for the
document's type.

## Process

1. Identify the document's `type` and confirm the matching template.
2. Write/edit following the markdown conventions (heading levels, scannable
   structure, code fences for structured content).
3. Ensure frontmatter is present and correct, including `related:`.
4. Add/update inline links using relative paths per the linking strategy.
5. Re-read for whether a human skimming and an AI parsing would both get
   what they need quickly.

## Outputs

A markdown file that conforms to `standards/` and is properly linked.

## Validation Criteria

Frontmatter present and correct; headings well-structured; all links
resolve; no unnecessary duplication of content that exists elsewhere (link
instead of restating).

## Improvement Rules

If a document keeps needing the same fix (e.g. missing `related:` links),
consider whether the relevant template needs a stronger prompt for that
field.
