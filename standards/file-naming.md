---
title: File Naming
type: standard
status: active
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [standards, naming]
related: [folder-structure.md, linking-strategy.md]
---

# File Naming

## Rules

- Files and folders: `kebab-case`, e.g. `architecture-review.md`,
  `software-architecture/`.
- Every content file uses the `.md` extension.
- No dates embedded in evergreen filenames — use the `created`/`updated`
  frontmatter fields instead (`file-naming.md`, not `file-naming-2026.md`).
- `README.md` is always uppercase, matching the git-host convention that
  renders it automatically for a folder.

## Exceptions

- **ADRs** (`governance/decisions/`): `NNNN-short-title.md` with a 4-digit
  zero-padded sequence number, e.g. `0001-pma-repo-coexistence.md`. Sequence
  order matters more than kebab-case purity here.
- **Dated review records** (`memory/reviews/`): `YYYY-MM-DD-weekly-review.md`
  or `YYYY-MM-DD-monthly-review.md`. These are point-in-time snapshots, not
  evergreen documents, so sortable dating is the right identifier.
