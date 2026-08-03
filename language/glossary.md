---
title: Glossary
type: knowledge
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [language, glossary, terminology]
related: [README.md, ../standards/frontmatter-schema.md]
---

# Glossary

The single source of truth for terminology in this repository. Skills,
workflows, and any future agent should use these terms consistently rather
than inventing synonyms. If a new concept needs a name, add it here first.

## Core concepts

| Term | Definition |
|---|---|
| **PMA (Personal Master Architecture)** | This repository's long-term system for organizing work, projects, knowledge, and decisions. Survives any specific AI model. |
| **Knowledge Lifecycle** | The Capture → Classification → Normalization → Linking → Storage → Validation → Improvement → Review process (`knowledge/LIFECYCLE.md`) every piece of durable content goes through. |
| **Skill** | A reusable, model-agnostic capability definition (`skills/`). Permanent. Describes *how* to do a kind of work. |
| **Workflow** | A repeatable, multi-step procedure (`workflows/`) that invokes one or more skills in sequence. Permanent, but composed of skill references rather than its own logic. |
| **Task** | A single, ephemeral action item (`tasks/`). Temporary — exists until done, then is removed or promoted into durable knowledge. |
| **Domain** | A subject-matter area (`domains/`) aggregating multiple knowledge notes on a topic, e.g. "software-architecture." |
| **Project** | A time-bound or ongoing initiative (`projects/`) with its own goals and status, linking to relevant domains and knowledge. |
| **Atomic note** | A single self-contained fact or concept stored in `knowledge/`, small enough to be linked from multiple places. |
| **ADR (Architecture Decision Record)** | A record in `governance/decisions/` of a significant decision and its rationale, numbered sequentially. |
| **Agent** | A future AI role (Router, Planner, Builder, Reviewer, Documentation Maintainer, Archivist) specified in `agents/` as documentation only — not implemented at v0.1. |

## Entities

| Entity | Where defined |
|---|---|
| Ivo (owner) | `identity/profile.md` |
| ratinho (this repo) | root `README.md`, `CLAUDE.md` |
| image-to-ani-converter (existing app) | `projects/image-to-ani-converter/README.md` |

## Relationships (how the concepts connect)

- A **workflow** references **skills**; it does not duplicate their process.
- A **task** may, on completion, produce durable content that gets promoted
  into **knowledge**, a **project** update, or **memory** — after which the
  task itself is removed.
- A **domain** aggregates **knowledge** notes; a **project** links out to
  both **domains** and **knowledge** rather than restating them.
- Every **project** and **task** should be traceable to something in
  `strategy/` — if it isn't, that's a signal to either connect it or
  question why it's being done.

## Tags and aliases

- Prefer existing `tags:` values already used elsewhere (grep the repo)
  before introducing a new tag.
- No formal alias table yet at v0.1 — if a term collision or synonym problem
  actually arises, add an "Aliases" section here rather than solving it ad
  hoc in individual documents.
