---
title: Preference Memory
type: memory
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [memory, preferences]
related: [README.md, ../identity/profile.md]
---

# Preference Memory

## What it stores

Recent, contextual preference signals that haven't yet been confirmed as
durable — e.g. "seemed to prefer X in the last few interactions." This is
the holding area before a preference either graduates into
`identity/profile.md` (once confirmed durable) or expires.

## Storage rule

Short bullet entries, dated, not full documents.

## Validation rule

A preference noted here 3+ times consistently should be promoted to
`identity/profile.md` and removed from here.

## Update rule

Add an entry when a preference signal appears; prune on promotion or when
clearly no longer relevant.

## Retention rule

Not indefinite — this is a working buffer, not an archive. Stale, un-promoted
entries should be dropped during `workflows/monthly-review.md`.
