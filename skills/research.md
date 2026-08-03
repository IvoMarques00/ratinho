---
title: Research
type: skill
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [skill, research]
related: [README.md, ../knowledge/README.md, ../domains/README.md]
---

# Research

## Description

Investigate a question or topic and turn the findings into durable,
integrated knowledge — not a one-off answer that disappears once the
conversation ends.

## Scope

Applies to any open-ended investigation: technology research, learning a
new topic, evaluating an approach. Complements `software-development.md`,
which applies once an approach has been chosen and is being built.

## Inputs

A research question, and the existing `domains/`/`knowledge/` content
already covering related ground (checked first, to avoid redundant
investigation).

## Required Context

`domains/README.md`, `knowledge/LIFECYCLE.md`, `language/glossary.md`.

## Process

1. Check existing `knowledge/` and `domains/` content for what's already
   known before starting new investigation.
2. Investigate the question.
3. Run findings through the Knowledge Lifecycle (`knowledge/LIFECYCLE.md`):
   classify, normalize, link into the relevant domain, store.
4. Note open questions that remain, in the relevant domain's README.

## Outputs

One or more `knowledge/` notes, linked into a `domains/` folder; possibly a
new `domains/` entry if none fit.

## Validation Criteria

Findings are stored as atomic, linked notes rather than left only in
conversation history; the relevant domain's "open questions" section is
updated to reflect what's now resolved.

## Improvement Rules

If research on a topic keeps needing to be redone, that means prior
findings weren't stored or weren't discoverable — treat that as a linking
gap and fix it via `knowledge-management.md`.
