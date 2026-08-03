# ratinho

This repository holds two things:

1. **The image-to-.ani cursor converter app** — `apps/`, `packages/`,
   `.claude/skills/image-to-ani/`, `.github/workflows/ci.yml`, root
   `package.json`/`tsconfig*`. See root `README.md` for how to build/test it.
2. **The Personal Master Architecture (PMA)** — everything else at root.
   The long-term system for organizing Ivo's work, projects, learning, and
   decisions. The repository — not chat history — is the source of truth;
   this file must stay useful even if the AI model changes.

## Map

| Folder | What it is |
|---|---|
| [`identity/`](identity/README.md) | Durable preferences, principles, objectives |
| [`strategy/`](strategy/README.md) | Vision, roadmap, active priorities |
| [`memory/`](memory/README.md) | Small pointers/indexes — not a knowledge dump |
| [`knowledge/`](knowledge/README.md) | Atomic reference notes + the lifecycle |
| [`domains/`](domains/README.md) | Subject-matter areas aggregating knowledge |
| [`projects/`](projects/README.md) | Time-bound/ongoing initiatives |
| [`skills/`](skills/README.md) | Reusable capability definitions (docs only) |
| [`workflows/`](workflows/README.md) | Repeatable procedures referencing skills |
| [`tasks/`](tasks/README.md) | Ephemeral action items |
| [`templates/`](templates/README.md) | Canonical starting point per content type |
| [`language/`](language/README.md) | Canonical terminology |
| [`standards/`](standards/README.md) | Current concrete rules |
| [`governance/`](governance/README.md) | Rationale (ADRs) + maintenance policy |
| [`infrastructure/`](infrastructure/README.md) | Specs for future PMA tooling |
| [`agents/`](agents/README.md) | Future AI role specs (no code) |
| [`archive/`](archive/README.md) | Superseded content + redirect rules |

## Knowledge Lifecycle

New information moves through Capture → Classification → Normalization →
Linking → Storage → Validation → Improvement → Review — see
[`knowledge/LIFECYCLE.md`](knowledge/LIFECYCLE.md). Information gets
integrated, not just appended.

## Conventions

Frontmatter schema, linking strategy, and file naming are defined once —
see [`standards/frontmatter-schema.md`](standards/frontmatter-schema.md),
[`standards/linking-strategy.md`](standards/linking-strategy.md),
[`standards/file-naming.md`](standards/file-naming.md). Don't restate them
elsewhere.

## `skills/` vs. `.claude/skills/`

[`skills/`](skills/README.md) holds durable, model-agnostic capability
*definitions* — documentation only, never auto-loaded. `.claude/skills/`
is Claude Code's live, executable skill mechanism (currently just
`image-to-ani`). Promoting a `skills/*.md` definition into a live
`.claude/skills/` wrapper is a deliberate, later, per-skill decision — see
[`governance/decisions/0001-pma-repo-coexistence.md`](governance/decisions/0001-pma-repo-coexistence.md).

## For AI agents

- Read [`identity/`](identity/README.md) and [`strategy/`](strategy/README.md)
  for durable context before planning or research work.
- Check [`language/glossary.md`](language/glossary.md) before introducing
  new terminology.
- Follow [`workflows/`](workflows/README.md) for repeatable procedures;
  each references the [`skills/`](skills/README.md) it needs.
- Keep [`memory/`](memory/README.md) updates to short pointers, not
  knowledge dumps — the actual content belongs in `knowledge/`, `domains/`,
  or `projects/`.
- Use [`templates/`](templates/README.md) when creating new content of any
  type.
- Record significant architecture decisions as ADRs in
  [`governance/decisions/`](governance/decisions/README.md).
- Do not modify `apps/`, `packages/`, `.claude/skills/image-to-ani/`, or
  `.github/workflows/ci.yml` as part of PMA work — those belong to the
  cursor-converter app.

This file is a pointer, not a source — content changes belong in the linked
files, not here.
