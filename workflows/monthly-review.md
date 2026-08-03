---
title: Monthly Review
type: workflow
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [workflow, review, cadence]
related: [README.md, ../templates/review-template.md, ../governance/maintenance-framework.md]
---

# Monthly Review

## Trigger

Run monthly (cadence, not event-triggered) — broader than
`weekly-review.md`.

## Preconditions

None.

## Steps

1. Review `strategy/roadmap.md` for whether priorities still hold; update
   `strategy/vision.md` only if the long-term direction itself has changed.
2. Run the full [governance/maintenance-framework.md](../governance/maintenance-framework.md)
   checklist across the repository, not just recent content.
3. Review `memory/preference-memory.md` for entries to promote to
   `identity/profile.md` or prune.
4. Archive anything superseded per [archive/README.md](../archive/README.md).
5. Write the record using
   [templates/review-template.md](../templates/review-template.md).
6. Update `memory/workflow-memory.md` with the run date.

## Skills Referenced

- [Project Organization](../skills/project-organization.md)
- [Knowledge Management](../skills/knowledge-management.md)

## Outputs

A dated review record; updated `strategy/`, `identity/profile.md`, and
`memory/` as needed; archived content where applicable.

## Filing

`memory/reviews/YYYY-MM-DD-monthly-review.md`; update `memory/workflow-memory.md`.
