# Currento Handbook

This handbook captures the conventions, architecture decisions, cleanup lessons, and project history that brought Currento to version 1.0. Use it as the main reference for this repository and as a reusable base for future projects built on the same stack.

## Reading Order

1. [Tech Stack](./tech-stack.md)
2. [Filesystem And Imports](./filesystem-and-imports.md)
3. [Components](./components.md)
4. [Styling And Primitives](./styling-and-primitives.md)
5. [Routing, State, And Localisation](./routing-state-and-localisation.md)
6. [Server And Data](./server-and-data.md)
7. [Validation, Linting, And Skills](./validation-linting-and-skills.md)
8. [Project History](./project-history.md)
9. [New Project Quickstart](./new-project-quickstart.md)

## What This Handbook Covers

- The coding rules that used to live mostly in `AGENTS.md`
- The server and data rules that used to live in `SERVER_GUIDELINES.md`
- The custom linting and review rules enforced in this repo
- The recurring cleanup pain points that led to the current skill set
- The stack, scripts, and architecture conventions that define the Currento baseline
- A practical bootstrap guide for starting a new project from this foundation

## Source Of Truth

- [`AGENTS.md`](../AGENTS.md) remains the repo-level entrypoint for coding standards and links back to this handbook.
- [`SERVER_GUIDELINES.md`](../SERVER_GUIDELINES.md) remains the repo-level entrypoint for backend guidance and links back to this handbook.
- When a detailed topic exists in this `docs/` folder, prefer that page over a shorter root-level summary.

## Migration Principle

Currento uses phased compliance rather than broad churn:

- New files must follow the current rules immediately.
- Existing files should be brought into compliance when touched for feature work or refactors.
- Large mechanical migrations should be isolated into dedicated cleanup changesets.

That principle applies across naming, imports, component signatures, localisation, styling, and app-to-components extraction.
