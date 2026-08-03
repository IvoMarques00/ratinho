---
title: Domains
type: readme
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [domains]
related: [../knowledge/README.md, ../projects/README.md]
---

# domains/

## Purpose

Subject-matter areas that aggregate multiple `knowledge/` notes into a
coherent topic — e.g. "software-architecture," and in the future things like
a hobby, a research area, or a field of study. A domain is not time-bound
(unlike a project) and is not a single fact (unlike a knowledge note) — it's
the grouping between them.

## Contents

- `software-architecture/` — the first seed domain, aggregating general
  software-design knowledge encountered across projects.

Each domain is a subfolder with its own `README.md` following
`templates/domain-template.md`.

## Ownership

Ivo.

## Maintenance Rules

- Create a new domain folder only once multiple knowledge notes on a topic
  exist or are clearly coming — don't pre-create empty domains speculatively.
- A domain's README should list every knowledge note that belongs to it;
  an orphaned knowledge note (belonging to no domain) is a linking gap.

## AI Usage Rules

Before creating a new domain, check whether the topic fits an existing one.
Domains are meant to reduce fragmentation, not multiply categories.

## Relationships

`knowledge/` notes are the atomic units a domain aggregates. `projects/`
link to the domains relevant to their work rather than duplicating domain
content inline.
