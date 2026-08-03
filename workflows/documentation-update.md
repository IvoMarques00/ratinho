---
title: Documentation Update
type: workflow
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [workflow, documentation]
related: [README.md, ../skills/documentation.md]
---

# Documentation Update

## Trigger

Existing documentation is found to be incomplete, inaccurate, or stale.

## Preconditions

The document to update is identified.

## Steps

1. Review the current content and identify what's wrong or missing. —
   invokes [Documentation](../skills/documentation.md).
2. Update it, keeping frontmatter (`updated` date, `status`) current. —
   invokes [Documentation](../skills/documentation.md).
3. Check whether the change affects other documents that link to or
   restate this content, and update those too. — invokes
   [Knowledge Management](../skills/knowledge-management.md).

## Skills Referenced

- [Documentation](../skills/documentation.md)
- [Knowledge Management](../skills/knowledge-management.md)

## Outputs

An updated document with correct frontmatter and links, and any dependent
documents kept consistent.

## Filing

Wherever the document already lives — this workflow updates in place.
