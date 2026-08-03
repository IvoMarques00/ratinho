---
title: Maintenance Framework
type: standard
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [governance, maintenance]
related: [README.md, ../workflows/knowledge-review.md, ../infrastructure/automation-backlog.md]
---

# Maintenance Framework

The mechanisms this repository uses to actively resist entropy: duplicate
content, broken links, obsolete material, terminology drift, and
documentation that no longer matches reality. At v0.1 these are manual
checklists, run via `workflows/knowledge-review.md`,
`workflows/weekly-review.md`, and `workflows/monthly-review.md`.
Automating them is deferred — see `infrastructure/automation-backlog.md`.

## Duplicate Detection

Before adding new content, search `knowledge/`, `domains/`, and `projects/`
for existing coverage of the same fact or concept. If found, link to it
instead of restating it, or merge the two if the existing content is
outdated.

## Link Validation

Periodically (weekly/monthly review), spot-check that relative links and
`related:` frontmatter entries resolve to real files. A broken link is
either a rename that wasn't followed through, or content that should have
left an archive stub.

## Obsolete Content Detection

Content whose `status` should be `deprecated`/`archived` but isn't — check
for documents describing plans that already happened, technical facts about
removed code, or priorities superseded by a newer `strategy/roadmap.md`
entry.

## Terminology Consistency

Check new and existing content against `language/glossary.md`. Two
documents using different words for the same concept is drift — resolve to
one canonical term and update both.

## Documentation Drift Prevention

Watch for standards or conventions being restated (rather than linked) in
more than one place — `standards/README.md` and `governance/README.md` both
warn about this. If found, remove the restatement and link to the
canonical source instead.

## Knowledge Refactoring

When a domain accumulates enough notes that its structure no longer fits
(too broad, too granular), restructure it — split or merge — rather than
letting new content force awkward categorization into the old shape.

## Cadence

- `workflows/knowledge-review.md` — run this checklist on demand or as part
  of the reviews below.
- `workflows/weekly-review.md` — a light pass.
- `workflows/monthly-review.md` — the full checklist across the whole
  repository.
