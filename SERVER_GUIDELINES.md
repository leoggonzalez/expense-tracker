# Server And Data Layer Guidelines

This file remains the root entrypoint for backend and database guidance. The full version now lives in the handbook:

- [docs/server-and-data.md](./docs/server-and-data.md)

Use this guide together with [`AGENTS.md`](./AGENTS.md).

## Core Principles

- Keep server actions thin and predictable.
- Centralize table-specific database logic in one shared class per table.
- Prefer instance methods for row-level mutations and static methods for queries and aggregates.
- Keep generic helpers in `src/lib`, not inside a single table action file.
- Preserve behavior during structural refactors.

## Expected Shape

- shared table class in `src/lib/<table>.ts`
- thin server-action file in `src/actions/<table>.ts`
- shared helpers in `src/lib`
- explicit query methods for listings, aggregates, and detail views

## Validation

After backend or data refactors:

- run `yarn lint:types`
- run focused ESLint on touched files
- run broader validation only when routing, build behavior, or production-sensitive behavior changes

For file responsibilities, class patterns, revalidation naming, SQL guidance, query rules, and review checklist details, use the handbook chapter linked above.
