---
title: Knowledge Review
type: workflow
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [workflow, knowledge-review]
related: [README.md, ../governance/maintenance-framework.md]
---

# Knowledge Review

## Trigger

Run periodically (see `weekly-review.md`/`monthly-review.md`) or whenever
content in `knowledge/`/`domains/` is suspected to be stale or duplicated.

## Preconditions

None.

## Steps

1. Run the checks in
   [governance/maintenance-framework.md](../governance/maintenance-framework.md):
   duplicate detection, link validation, obsolete-content detection,
   terminology consistency, drift prevention.
2. For anything stale or superseded, follow
   [archive/README.md](../archive/README.md).
3. For anything inaccurate or improvable, update it. — invokes
   [Documentation](../skills/documentation.md) and
   [Knowledge Management](../skills/knowledge-management.md).

## Skills Referenced

- [Documentation](../skills/documentation.md)
- [Knowledge Management](../skills/knowledge-management.md)

## Outputs

Corrected/updated content; archived stubs for superseded content; a note of
findings (used by `weekly-review.md`/`monthly-review.md` if run as part of
those).

## Filing

In place for corrections; `archive/` for superseded content.
