# Server And Data Layer Guidelines

This document defines the preferred server-side and data-access architecture for table-backed features in this repository.

Use this guide together with `AGENTS.md`. `AGENTS.md` remains the canonical repo-wide standard. This file adds implementation guidance for server actions, model classes, shared helpers, and database query structure.

## Goals

- Keep server actions thin and predictable.
- Centralize table-specific database logic in one shared class per table.
- Make query behavior reusable across routes and actions.
- Prepare the codebase for future migration from Prisma-heavy flows to more direct SQL where it improves performance.
- Keep behavior stable while improving structure and performance.

## File Responsibilities

### `src/actions/*`

- Action files are the server-action surface.
- They should focus on:
  - authentication and ownership context
  - input validation
  - calling shared model/data methods
  - mapping errors to user-facing error keys
  - cache revalidation
  - shaping page payloads when the shape is route-specific
- Action files must not become the primary home for table-specific database logic.
- Generic helpers do not belong in a table action file.

### `src/lib/*`

- Shared model/data classes belong in `src/lib`.
- Generic server helpers also belong in `src/lib`.
- Examples of shared helpers:
  - Prisma error guards
  - revalidation helpers
  - shared amount normalization
  - shared serialization or date helpers when reused across features

## Table Class Pattern

Each table-backed feature should have one canonical shared class that owns all database interaction for that table.

Example shape:

```ts
export class Space {
  public data: SpaceCreateData | SpacePersistedData;

  public constructor(data: SpaceCreateData | SpacePersistedData) {
    this.data = data;
  }
}
```

### Class Rules

- Use one class per main table, named after the entity, such as `Space`, `Entry`, or `UserAccount`.
- The class should be the single public abstraction for database access related to that table.
- Prefer a hybrid API:
  - instance methods for row-oriented mutations
  - static methods for lookup, listing, aggregation, and synchronization
- Avoid splitting the same table logic across an action wrapper class and a repository class unless there is a very strong reason.

### Data Shape Rules

- Store instance state under `data`, not as many parallel public properties.
- Prefer layered types instead of overlapping near-duplicates:
  - base data type for shared fields
  - persisted data type for database-loaded rows with required `id` and timestamps
  - create/input data type for new records
- Keep aggregate DTOs separate from entity data.

Example categories:

- `SpaceBaseData`
- `SpacePersistedData`
- `SpaceCreateData`
- `SpaceMonthSummaryRecord`
- `SpaceTransactionRecord`

### Instance Methods

Use instance methods for mutations that conceptually act on one row.

Preferred examples:

- `create()`
- `updateName(...)`
- `archive()`
- `unarchive()`

Rules:

- Instance methods that require a persisted row must enforce that requirement with a strict helper or getter.
- Prefer returning a fresh class instance after a mutation rather than mutating in-memory state silently.

### Static Methods

Use static methods for reusable query paths and table-level workflows.

Preferred examples:

- `findOwnedById(...)`
- `findActiveByName(...)`
- `findArchivedByName(...)`
- `findOrCreateActive(...)`
- `listActiveByUser(...)`
- `listByArchiveStateWithMonthTotals(...)`
- `getDetailPageQueryResult(...)`
- `syncCurrentMonthTransactionCount(...)`

Rules:

- Return class instances when loading real entity rows.
- Return purpose-built DTOs for aggregates, summaries, counters, and projections.
- Keep method names explicit about intent.

## Server Action Structure

Within an action file, group exports in CRUD order and mark each section with a short comment.

Preferred section order:

```ts
// Create
// Read
// Update
// Delete/Archive
```

Rules:

- Keep helper functions above the CRUD sections.
- Use comments only for meaningful structure, not line-by-line narration.
- If an action file contains route-specific serialization, keep that serialization local to the action file unless it is reused elsewhere.

## Shared Helper Rules

### Error Helpers

- Prisma error guards must live in shared helpers, not inside a specific table action file.
- Prefer one reusable helper such as `isPrismaErrorWithCode(...)`.

### Revalidation Helpers

- Revalidation helpers must be named for the route group they invalidate, not for whichever file currently calls them.
- If a helper invalidates shared pages like dashboard, transactions, projection, or settings, do not name it as though it were table-only.

Preferred pattern:

- `revalidateSharedMutationPages()`
- `revalidateSpaceMutationPages()`
- `revalidateTransactionMutationPages()`

## Query And Performance Rules

When writing or refactoring list/detail methods, prefer query simplification and fewer round-trips when behavior remains clear and stable.

### General Rules

- Eliminate avoidable in-memory sorting when SQL or Prisma ordering can return the correct order directly.
- Centralize repeated `select` shapes so list/detail methods do not redefine the same transaction projection repeatedly.
- Prefer selecting only the columns actually needed by the caller.
- Reuse date-bound helpers when they represent the same business rule.
- Avoid loading the same record multiple times in the same request path.

### Detail Page Queries

- Prefer a dedicated detail-query method when a page needs:
  - entity metadata
  - counters
  - totals
  - paginated rows
  - selected-month subsets
- It is acceptable to use a small number of focused queries, but the query plan should be intentional rather than organically duplicated across actions.
- If count and rows must remain separate for pagination correctness, keep them explicit.
- If related metrics can be safely consolidated into one SQL query, prefer that.

### SQL Use

- Raw SQL is allowed when it makes aggregates, counters, or reporting queries significantly clearer or faster.
- Keep raw SQL encapsulated inside the shared table class, not scattered through actions.
- Use explicit aliases and minimal selected columns.
- Preserve current business behavior exactly when replacing Prisma queries with SQL.

## Behavior Preservation Rules

Structural refactors must not silently change:

- public action signatures
- error keys
- ownership enforcement
- ordering
- pagination semantics
- amount normalization rules
- month-bound inclusion rules

If behavior must change, that should be a deliberate product change, not a side effect of architectural cleanup.

## Validation Rules

After refactoring server/data code:

- Run `yarn lint:types`.
- Run focused ESLint on the touched files.
- Run broader validation only when the change affects routing, build-sensitive behavior, or production-only behavior.

## Review Checklist

Use this checklist when reviewing a new table-backed server/data implementation:

- Is there one canonical shared class for the table?
- Does the class own all table-specific DB interaction?
- Is instance state grouped under `data`?
- Are instance methods limited to row-oriented mutations?
- Are static methods used for queries, lists, aggregates, and sync workflows?
- Are generic helpers kept out of the table action file?
- Are action exports grouped in CRUD order with clear section comments?
- Are repeated selects centralized?
- Has obvious query waste been removed?
- Are action signatures and error keys preserved?

## Example Intent

When adding support for another table, the desired shape is:

- shared class in `src/lib/<table>.ts`
- thin server-action file in `src/actions/<table>.ts`
- shared generic helpers in `src/lib`
- reusable, explicit query methods
- route-specific payload shaping only where needed

That pattern should be preferred over:

- fat action files with embedded DB logic
- duplicate repository and action-service layers for the same table
- table-specific files containing generic helpers
- repeated select/query definitions scattered across actions
