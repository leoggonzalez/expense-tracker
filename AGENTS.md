# Repo Coding Guidelines

This file remains the repo-level entrypoint for coding standards, but the detailed handbook now lives under `docs/`.

## Start Here

- [docs/index.md](./docs/index.md)
- [docs/filesystem-and-imports.md](./docs/filesystem-and-imports.md)
- [docs/components.md](./docs/components.md)
- [docs/component_references.md](./docs/component_references.md)
- [docs/styling-and-primitives.md](./docs/styling-and-primitives.md)
- [docs/routing-state-and-localisation.md](./docs/routing-state-and-localisation.md)
- [docs/server-and-data.md](./docs/server-and-data.md)
- [docs/validation-linting-and-skills.md](./docs/validation-linting-and-skills.md)
- [docs/tech-stack.md](./docs/tech-stack.md)
- [docs/project-history.md](./docs/project-history.md)
- [docs/new-project-quickstart.md](./docs/new-project-quickstart.md)

## Core Rules

- New files must follow the current conventions immediately.
- Existing files should be updated toward compliance when touched for feature work or refactors.
- Large mechanical migrations should be isolated into dedicated cleanup changesets.
- If a detailed topic exists in `docs/`, prefer that page over this summary.

## Required Component References

For every new feature and component refactor:

- Read and follow the [nerdgeschoss component guideline](https://nerdgeschoss.de/handbook/nuts/components/).
- Check the [Shimmer component showcase](https://nerdgeschoss.github.io/shimmer-components-static/) before introducing UI components. Prefer adapting its component structure when suitable.
- Preserve Currento's custom styling and design tokens wherever possible; do not import the showcase theme wholesale.
- Follow [the local integration rules](./docs/component_references.md) for Next.js boundaries, source adaptation, and documented project exceptions.

## High-Level Standards

- Use `snake_case` for new non-framework filenames.
- Use `@/` for internal imports under `src/`.
- Prefer function-declaration components with explicit `React.ReactElement` return types.
- Do not use `React.FC`. Use explicit interfaces for component props and export one component per component file.
- Keep styling component-owned, mobile-first, and free from public `style` or `className` escape hatches.
- Do not add route-owned SCSS under `src/app`.
- Keep filter, search, sort, and pagination state in the URL when it changes page content.
- Treat authenticated user pages as dynamic and per-request.
- Put all user-facing copy in `src/locales/en.json` before use.

## Related Guidance

Backend and database-access structure lives in [`SERVER_GUIDELINES.md`](./SERVER_GUIDELINES.md) and in the detailed backend chapter at [docs/server-and-data.md](./docs/server-and-data.md).

## Exceptions

- Next.js special files such as `page.tsx`, `layout.tsx`, `route.ts`, `icon.tsx`, and `apple-icon.tsx` keep framework-required names.
- Prisma files follow Prisma conventions.
- Temporary exceptions must be documented in the relevant change description and should not be introduced silently.
