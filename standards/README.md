---
title: Standards
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [standards]
related: [../governance/README.md, ../CLAUDE.md]
---

# standards/

## Purpose

The concrete, apply-directly rules for how content in this repository's
Personal Master Architecture (PMA) is written and organized. If you're asking
"what format should this file be in," the answer is here.

## Contents

- `folder-structure.md` — the canonical root map.
- `file-naming.md` — kebab-case rules and exceptions.
- `markdown-conventions.md` — heading/formatting conventions.
- `frontmatter-schema.md` — the one metadata schema used everywhere.
- `linking-strategy.md` — relative links + `related:` frontmatter, and why.
- `versioning.md` — the `status` lifecycle field and its transitions.

## Ownership

Ivo. Changes here affect every other document, so treat edits as structural
— cross-check `CLAUDE.md` and folder READMEs still agree after a change.

## Maintenance Rules

- These are the rules "in force today." If a rule changes for a documented
  reason, record the reasoning as an ADR in `governance/decisions/` first,
  then update the standard here.
- No document outside this folder should restate these rules — they link
  here instead. If you find a restatement elsewhere, that's documentation
  drift; fix it per `governance/maintenance-framework.md`.

## AI Usage Rules

Read this folder before creating or restructuring any content. When in doubt
about format, frontmatter, naming, or linking, these files are authoritative
— don't improvise a new convention.

## Relationships

`governance/` defines *why* these standards exist and how they get
maintained; this folder defines *what* the current rules are. `templates/`
applies these rules concretely to each content type.
