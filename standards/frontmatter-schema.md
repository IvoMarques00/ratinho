---
title: Frontmatter Schema
type: standard
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [standards, metadata, frontmatter]
related: [linking-strategy.md, file-naming.md, versioning.md, ../governance/maintenance-framework.md]
---

# Frontmatter Schema

This is the single canonical definition of the frontmatter block. Every markdown
file in this repository's Personal Master Architecture (PMA) — everything
outside `apps/`, `packages/`, and `.claude/skills/image-to-ani/` — carries this
block at the top of the file. No other document restates this schema; they
link here.

## Fields

```yaml
---
title: string
type: identity | strategy | memory | knowledge | domain | project | skill |
      workflow | task | template | standard | adr | agent-spec |
      archive-pointer | readme
status: draft | active | stable | deprecated | archived
owner: ivo
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [kebab-case, ...]
related: [relative/path/to/file.md, ...]
---
```

| Field | Purpose |
|---|---|
| `title` | Human-readable name of the document. |
| `type` | What kind of content this is. Drives which template it should follow (see `templates/`) and how maintenance tooling classifies it. |
| `status` | Lifecycle stage. See `versioning.md` for the transition rules. |
| `owner` | Currently always `ivo`; kept as a field so shared/collaborative use is possible later without a schema change. |
| `created` / `updated` | ISO dates. `updated` changes whenever the body content changes materially (not on typo fixes). |
| `tags` | Free-form kebab-case labels for grouping/search. Prefer existing tags from `language/glossary.md` over inventing new ones. |
| `related` | Relative paths to other files in this repo that this document is meaningfully connected to. This is the machine-parseable relationship graph — see `linking-strategy.md`. Inline prose links are for narrative flow; `related` is for structure, and the two are expected to overlap. |

## Rules

- Every file gets this block, including `README.md` files (`type: readme`).
- `related` lists paths relative to the file itself, matching how a human
  would follow the link, so both are always kept in sync.
- Do not add per-`type` custom fields at v0.1 — one schema, no forking. If a
  real need for type-specific fields appears, record that as a governance
  decision (`governance/decisions/`) before extending the schema.
