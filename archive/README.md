---
title: Archive
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [archive]
related: [../standards/versioning.md, ../governance/maintenance-framework.md]
---

# archive/

## Purpose

Where deprecated/superseded content ends up, without breaking links that
still point to it.

## Contents

Nothing yet — no content has been superseded since the PMA was created.

## Ownership

Ivo.

## Maintenance Rules

### When content qualifies for archiving

When it's been superseded by a replacement (per `standards/versioning.md`'s
`deprecated` → `archived` transition) — not simply because it's old.
Old-but-still-accurate content stays in place.

### Redirect mechanism

Do not simply delete or move-and-forget a superseded file. Instead:

1. Set `status: archived` in the original file's frontmatter.
2. Replace its body with a single line: `Moved to: [new path](relative/link.md)`
   if it was truly superseded by a specific replacement, or a short note on
   why it's archived if there's no direct replacement.
3. Either leave the stub at its original path, or move the full original
   content into `archive/` and leave the stub behind at the old path
   pointing into `archive/` — either way, the old path must keep resolving
   to *something*, never a 404.

### Retention

Kept indefinitely. Git history is the deeper record if more than the stub
is ever needed.

## AI Usage Rules

Never hard-delete PMA content as a way of "cleaning up" — archive it per
the process above. Deletion without a stub is only appropriate for content
that was never linked from anywhere and never should have existed (e.g. a
true duplicate caught immediately).

## Relationships

`governance/maintenance-framework.md`'s Obsolete Content Detection is what
identifies archiving candidates; `agents/archivist.md` specifies a future
role for performing this mechanically.
