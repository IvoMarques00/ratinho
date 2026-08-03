---
title: "Agent Spec: Archivist"
type: agent-spec
status: draft
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [agent-spec, archivist]
related: [README.md, ../archive/README.md]
---

# Agent Spec: Archivist

## Responsibility

Move superseded/deprecated content to its archived state following
`archive/README.md`: set `status: archived`, leave a redirect stub at the
old path if needed, ensure inbound links still resolve.

## Inputs

Content flagged by Documentation Maintainer or a review workflow as
superseded.

## Outputs

An archived document (moved or stub-redirected) with no broken inbound
links remaining.

## Boundaries

Must never hard-delete content — git history plus the archive stub is the
permanent record. Must confirm no active document still treats archived
content as current before finalizing.

## Skills / Workflows drawn on

`archive/README.md`'s redirect-stub convention; `standards/versioning.md`'s
status transitions.

## Handoff points

None further — archiving is a terminal step for a piece of content, though
the Documentation Maintainer may later re-surface it if reactivated.
