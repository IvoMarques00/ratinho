---
title: Markdown Conventions
type: standard
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [standards, markdown, formatting]
related: [frontmatter-schema.md, file-naming.md]
---

# Markdown Conventions

- One `#` H1 per file, matching the frontmatter `title`.
- Section headings start at `##`; avoid nesting past `####`.
- Use fenced code blocks with a language tag (` ```yaml `, ` ```md `) for any
  structured content, including frontmatter examples.
- Prefer short paragraphs and bullet lists over long prose blocks — this
  repository is read by both humans skimming and AI agents parsing; dense
  scannable structure serves both.
- Tables are fine for comparisons (e.g. skill vs. workflow vs. task) but
  should not replace prose where a decision's reasoning needs explaining.
- No trailing whitespace; end files with a single trailing newline.
