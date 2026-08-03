---
title: Identity Memory
type: memory
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [memory, identity]
related: [README.md, ../identity/profile.md]
---

# Identity Memory

## What it stores

A short pointer to the current state of `identity/profile.md` — not a copy
of it. Use this only if a quick index of "what's currently settled about
identity" is needed without opening the full file.

## Storage rule

Pointer only: a one-line summary + link. The actual content lives in
`identity/profile.md`.

## Validation rule

If this file's summary and `identity/profile.md` disagree, `profile.md`
wins — update this pointer to match.

## Update rule

Update only when `identity/profile.md` changes materially.

## Retention rule

Kept indefinitely; it's small by construction.
