---
title: Automation Backlog
type: standard
status: draft
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [infrastructure, automation, backlog]
related: [README.md, tooling-conventions.md, ../governance/maintenance-framework.md]
---

# Automation Backlog

Deferred ideas for automating `governance/maintenance-framework.md`'s
manual checks. Nothing here is built at v0.1 — this is a parking lot, not a
commitment.

## Ideas

- **Link checker** — walk all PMA markdown files, resolve every relative
  link and every `related:` entry, report anything that doesn't point to a
  real file.
- **Frontmatter validator** — confirm every markdown file (outside
  `apps/`, `packages/`, `.claude/skills/image-to-ani/`) has the required
  frontmatter fields from `standards/frontmatter-schema.md` with valid
  enum values for `type`/`status`.
- **Duplicate/near-duplicate detector** — flag `knowledge/` notes with
  highly similar content, as a prompt for manual merge review.
- **Terminology linter** — flag terms used in content that don't appear in
  `language/glossary.md`, as a prompt to either add them or reuse an
  existing term.
- **Stale-content flagger** — surface documents whose `updated` date is old
  relative to their `status` (e.g. an `active` document untouched for a
  long time) for `workflows/monthly-review.md` to look at.

## Non-goals for this backlog

Not aiming for CI enforcement/blocking behavior at this stage — these would
be advisory reports consumed during review workflows, not gates.
