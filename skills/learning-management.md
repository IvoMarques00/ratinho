---
title: Learning Management
type: skill
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [skill, learning]
related: [README.md, ../domains/README.md, ../knowledge/LIFECYCLE.md]
---

# Learning Management

## Description

Turn a learning activity (a course, a book, practicing a new skill) into
durable, organized knowledge and track progress over time, rather than
letting the learning evaporate once the activity ends.

## Scope

Applies to any ongoing learning effort not already covered by
`research.md` (research answers a specific question; learning management
covers building an area of competence over time).

## Inputs

The learning activity and its subject area.

## Required Context

The relevant `domains/` folder for the subject (create one if it doesn't
exist yet).

## Process

1. Identify or create the `domains/` folder for the subject.
2. As learning happens, capture notable facts/concepts as `knowledge/`
   notes linked into that domain (via `knowledge-management.md`).
3. Track progress/status in the domain's README or, if the learning effort
   is substantial enough to have its own goals and timeline, as a
   `projects/` entry instead.
4. Periodically review the domain for gaps or open questions during
   `workflows/knowledge-review.md`.

## Outputs

Growing `knowledge/` notes under a `domains/` folder; optionally a
`projects/` entry if the learning effort is project-like.

## Validation Criteria

Knowledge gained is captured as it happens, not reconstructed from memory
later; the domain's open questions section reflects genuine current gaps.

## Improvement Rules

If a domain accumulates many notes with no structure, consider whether it
should split into sub-areas — but only once the need is concrete, not
speculatively.
