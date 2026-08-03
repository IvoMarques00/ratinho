---
title: Weekly Review
type: workflow
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [workflow, review, cadence]
related: [README.md, ../templates/review-template.md, ../memory/reviews/README.md]
---

# Weekly Review

## Trigger

Run weekly (cadence, not event-triggered).

## Preconditions

None.

## Steps

1. Summarize the week's activity across active `projects/` and `tasks/`.
2. Check active work against `strategy/roadmap.md` for drift. — invokes
   [Project Organization](../skills/project-organization.md).
3. Spot-check for stale/unlinked content. — invokes
   [Knowledge Review](knowledge-review.md).
4. Write the record using
   [templates/review-template.md](../templates/review-template.md).
5. Update `memory/workflow-memory.md` with the run date.

## Skills Referenced

- [Project Organization](../skills/project-organization.md)

## Outputs

A dated review record.

## Filing

`memory/reviews/YYYY-MM-DD-weekly-review.md`; update `memory/workflow-memory.md`.
