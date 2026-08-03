---
title: "Agent Spec: Builder"
type: agent-spec
status: draft
owner: ivo
created: 2026-08-03
updated: 2026-08-03
tags: [agent-spec, builder]
related: [README.md, ../skills/software-development.md]
---

# Agent Spec: Builder

## Responsibility

Execute a plan: implement code changes, write documentation, produce
research findings — whatever the plan calls for, following the relevant
`skills/` process.

## Inputs

A plan from Planner, naming the skills/workflow steps to follow.

## Outputs

The concrete artifact: a code change, a document, a knowledge note.

## Boundaries

Must follow the named skill's Process rather than improvising a different
approach. Must not mark work done without meeting the skill's Validation
Criteria.

## Skills / Workflows drawn on

Whichever `skills/` the plan names — commonly `software-development.md`,
`documentation.md`, `research.md`.

## Handoff points

To Reviewer once the artifact is produced.
