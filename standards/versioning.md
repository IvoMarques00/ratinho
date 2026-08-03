---
title: Versioning
type: standard
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [standards, versioning, lifecycle]
related: [frontmatter-schema.md, ../governance/maintenance-framework.md, ../archive/README.md]
---

# Versioning

This repo doesn't version documents with numbers — it versions them with the
`status` field plus git history. Git already gives full change history; the
`status` field gives the current lifecycle stage at a glance without opening
the log.

## Status transitions

```
draft → active → stable → deprecated → archived
```

- **draft** — being written, not yet relied on by other documents.
- **active** — in current use, may still change as understanding improves.
- **stable** — settled enough that other documents can depend on it without
  expecting frequent change.
- **deprecated** — superseded but not yet moved; still in place so inbound
  links don't break while the replacement is finalized.
- **archived** — moved to `archive/` (or left in place as a redirect stub);
  see `archive/README.md` for the mechanics.

## Rules

- Bump `updated` whenever the body changes materially. Typo/formatting fixes
  don't require it; content, scope, or structural changes do.
- A document can skip `stable` and go straight from `active` to `deprecated`
  — not everything needs to pass through every stage.
- Don't delete a document to "version" it — change `status`, and only move it
  to `archive/` following the archive process once its replacement exists.
