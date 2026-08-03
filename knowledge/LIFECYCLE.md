---
title: Knowledge Lifecycle
type: knowledge
status: stable
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [knowledge, lifecycle, process]
related: [README.md, ../governance/maintenance-framework.md, ../workflows/new-information.md]
---

# Knowledge Lifecycle

Every new piece of information moving into this repository passes through
these stages, in order. This is the process every workflow that produces
durable content (`workflows/new-information.md`, `new-project.md`,
`research-activity.md`, `documentation-update.md`, `knowledge-review.md`)
walks through explicitly. The point is integration, not accumulation:
information is never just appended — it's connected, categorized, and kept
correct.

## Stages

1. **Capture** — Something new arrives: a decision, a fact, a research
   result, a preference. Trigger: any point where new information surfaces.
   Action: write it down somewhere durable (a task, a scratch note) even
   before it's fully processed. Output: a raw capture, unclassified.

2. **Classification** — Decide what *kind* of content this is (`type` in the
   frontmatter schema) and which folder it belongs in: `identity/`,
   `knowledge/`, `domains/`, `projects/`, `memory/`, or `tasks/` if it's not
   durable at all. Action: check `language/glossary.md` for the canonical
   term before inventing a new category.

3. **Normalization** — Rewrite the capture into the repository's standard
   form: apply the frontmatter schema (`standards/frontmatter-schema.md`),
   the naming convention (`standards/file-naming.md`), and the relevant
   `templates/` file for its type.

4. **Linking** — Connect the new content to what already exists: add
   `related:` entries, add inline links, update the domain/project README
   that should reference it. Action: search existing `knowledge/`, `domains/`,
   `projects/` content first — this is the step that prevents duplication.

5. **Storage** — Commit the normalized, linked file to its final path in the
   repository. This is the point where the repository (not memory, not chat
   history) becomes the source of truth for this piece of information.

6. **Validation** — Check the content is accurate, the links resolve, and it
   doesn't contradict or duplicate something already stored. See
   `governance/maintenance-framework.md` for the concrete checks.

7. **Improvement** — If validation surfaces something better — a clearer
   framing, a merge opportunity with existing content, a correction — apply
   it now rather than filing it as a future task.

8. **Review** — Periodically (see `workflows/weekly-review.md` and
   `monthly-review.md`), revisit stored content for staleness, drift, or
   content that should be archived (`archive/README.md`).

## Who performs each stage

Capture is often human-initiated (something happened, someone said
something) but can also be AI-initiated during a workflow. Classification
through Improvement can be done by a human or an AI agent following this
document and `language/glossary.md`. Review is typically AI-assisted but
human-confirmed, since judging staleness/relevance is a human call at v0.1
(see `agents/documentation-maintainer.md` and `agents/archivist.md` for how
this may later be delegated further).
