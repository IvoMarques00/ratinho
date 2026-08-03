---
title: Software Development
type: skill
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [skill, software-development]
related: [README.md, ../domains/software-architecture/README.md, ../workflows/feature-development.md]
---

# Software Development

## Description

Implement a change to a codebase (feature, fix, refactor) with the
resulting technical knowledge captured back into the PMA, not left only in
the diff.

## Scope

Applies to actual code changes in any project, including the existing
`image-to-ani-converter` app in this repo. Pairs with
`workflows/feature-development.md`, `bug-fix.md`, and `refactoring.md`,
which sequence this skill alongside `documentation.md` and
`knowledge-management.md`.

## Inputs

A requirement, bug report, or refactor goal, plus the target codebase.

## Required Context

The relevant `projects/` entry and `domains/` content for the codebase in
question (e.g. `domains/software-architecture/` for `image-to-ani-converter`).

## Process

1. Understand existing code/patterns before writing new code — reuse over
   duplication, matching this repository's general engineering standard.
2. Implement the change, following the target codebase's own conventions
   (e.g. `image-to-ani-converter`'s TypeScript/eslint setup, not PMA
   conventions — those are separate).
3. Test the change per the target codebase's own test setup.
4. If the change surfaces a durable technical fact worth keeping (like the
   premultiplied-alpha note), capture it via `knowledge-management.md` into
   `knowledge/` and link it from the relevant domain.
5. Update the relevant `projects/` entry's status.

## Outputs

A code change in the target codebase, plus (when applicable) new
`knowledge/` notes and an updated `projects/` status.

## Validation Criteria

Change builds/tests pass in the target codebase; any genuinely durable
technical insight is captured in `knowledge/`, not left only in commit
history.

## Improvement Rules

If the same technical insight is being rediscovered across multiple
development sessions, that's a sign the Knowledge Lifecycle's Linking stage
was skipped last time — fix it before continuing.
