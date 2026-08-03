---
title: Technical Memory
type: memory
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [memory, technical]
related: [README.md, ../domains/README.md]
---

# Technical Memory

## What it stores

Pointers to technical context that's easy to lose track of but expensive to
rediscover — e.g. "which domain/knowledge note explains why we made this
technical choice." Not a substitute for `domains/` or `knowledge/` content —
those hold the actual explanation.

## Storage rule

Short bullet entries: a technical topic + link to the domain/knowledge note
or ADR that has the real detail.

## Validation rule

Each entry must resolve to a real, current file. A broken pointer here is a
maintenance-framework finding.

## Update rule

Add when a technical decision or fact is made that would otherwise be easy
to forget existed; update if the underlying note moves or is superseded.

## Retention rule

Prune entries whose underlying content has been archived, unless the
pointer itself is still useful as a historical note (rare — usually just
remove it).
