---
title: Linking Strategy
type: standard
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [standards, linking, discoverability]
related: [frontmatter-schema.md, file-naming.md]
---

# Linking Strategy

## Decision

Use plain relative markdown links — `[Knowledge Lifecycle](../knowledge/LIFECYCLE.md)`
— as the only linking mechanism. No `[[wikilinks]]`, no separate ID/UUID
scheme.

## Why

This content is read by exactly two kinds of readers: a human viewing plain
markdown on a git host, and an AI agent using file-read/glob tools. Neither is
a wiki engine. `[[wikilink]]` syntax renders as inert literal text on GitHub
and requires a name-resolution index that doesn't exist for an AI reading
files directly. A relative path, by contrast, is immediately followable by
both — clickable in a rendered markdown viewer, and directly resolvable by a
`Read` or `Glob` call with no lookup step.

The file path is treated as the document's identifier. This avoids needing a
second ID system to keep in sync with the filesystem. When a file moves,
update the links that point to it (see `archive/README.md` for the redirect
convention when content is deprecated rather than simply renamed).

## Two complementary link types

1. **Inline prose links** — normal markdown links inside body text, for
   narrative flow and human reading.
2. **`related:` frontmatter field** — the structured list of relationships for
   a document, intended for anything (human or AI) that wants the relationship
   graph without parsing prose. Every entry here should generally also appear
   as a link in the body, or vice versa — the two are meant to overlap, not
   diverge.

## Rules

- Links are always relative to the linking file's own location, not
  repo-root-absolute.
- Never link to `.claude/skills/image-to-ani/` from PMA content unless
  specifically discussing that pre-existing skill — it belongs to the app,
  not the architecture.
- When content is archived, leave a stub at the old path (see
  `archive/README.md`) so existing links resolve to a pointer instead of a
  404, rather than trying to hunt down and rewrite every inbound link.
