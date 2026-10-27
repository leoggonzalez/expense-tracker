# Server And Data

This chapter defines the preferred backend and data-access structure for table-backed features in Currento.

`AGENTS.md` remains the repo-wide standard. This chapter adds the server-specific guidance for actions, shared model classes, helpers, and database query structure.

## Goals

- Keep server actions thin and predictable.
- Centralize table-specific database logic in one shared class per table.
- Make query behavior reusable across routes and actions.
- Prepare the codebase for future migration from Prisma-heavy flows to more direct SQL where it improves performance.
- Preserve behavior while improving clarity and performance.

## File Responsibilities

### `src/actions/*`

Action files are the server-action surface. They should focus on:

- authentication and ownership context
- input validation
- calling shared model or data methods
- mapping errors to user-facing error keys
- cache revalidation
- shaping route-specific payloads when needed

Action files must not become the main home for table-specific database logic.

### `src/lib/*`

Shared model and data classes belong in `src/lib`, along with generic server helpers.

Examples:

- Prisma error guards
- revalidation helpers
- shared amount normalization
- shared serialization or date helpers reused across features

## Canonical Table Class Pattern

Each table-backed feature should have one canonical shared class that owns database interaction for that table.

Examples in the current domain:

- `UserAccount`
- `Space`
- `Transaction`

Preferred class shape:

```ts
export class Space {
  public data: SpaceCreateData | SpacePersistedData;

  public constructor(data: SpaceCreateData | SpacePersistedData) {
    this.data = data;
  }
}
```

### Class Rules

- Use one class per main table, named after the entity.
- Make that class the single public abstraction for database access related to the table.
- Prefer a hybrid API:
  - instance methods for row-oriented mutations
  - static methods for queries, listings, aggregates, and synchronization workflows

### Data Shape Rules

- Store instance state under `data`, not many parallel public properties.
- Prefer layered types:
  - base data
  - persisted row data
  - create or input data
- Keep aggregate DTOs separate from entity data.

Examples:

- `SpaceBaseData`
- `SpacePersistedData`
- `SpaceCreateData`
- `SpaceMonthSummaryRecord`
- `TransactionListRecord`

## Instance Methods

Use instance methods for mutations that conceptually act on one row.

Preferred examples:

- `create()`
- `updateName(...)`
- `archive()`
- `unarchive()`

Rules:

- Methods that require a persisted row must enforce that requirement through a strict helper or getter.
- Prefer returning a fresh class instance after mutation instead of silently mutating in-memory state.

## Static Methods

Use static methods for reusable query paths and table-level workflows.

Preferred examples:

- `findOwnedById(...)`
- `findActiveByName(...)`
- `listActiveByUser(...)`
- `getDetailPageQueryResult(...)`
- `syncCurrentMonthTransactionCount(...)`

Rules:

- Return class instances when loading real entity rows.
- Return purpose-built DTOs for aggregates, summaries, counters, and projections.
- Keep method names explicit about intent.

## Server Action Structure

Within an action file, group exports in CRUD order and mark sections with short comments:

```ts
// Create
// Read
// Update
// Delete/Archive
```

Keep shared helpers above these sections. Keep route-specific serialization local unless it is reused elsewhere.

## Shared Helper Rules

### Error Helpers

- Prisma error guards must live in shared helpers, not inside a table action file.
- Prefer reusable helpers such as `isPrismaErrorWithCode(...)`.

### Revalidation Helpers

- Revalidation helpers should be named after the route groups they invalidate.
- Do not name a helper as though it were table-specific if it invalidates shared surfaces.

Preferred patterns:

- `revalidateSharedMutationPages()`
- `revalidateSpaceMutationPages()`
- `revalidateTransactionMutationPages()`

## Query And Performance Rules

- Eliminate avoidable in-memory sorting when SQL or Prisma ordering can return the desired order directly.
- Centralize repeated `select` shapes.
- Select only the columns the caller needs.
- Reuse shared date-bound helpers when they represent the same business rule.
- Avoid loading the same record multiple times within one request path.

### Hybrid Protected Shell Pattern

When a protected page should feel instant on navigation, prefer a static shell plus client-mounted personalized sections over a single server-rendered page payload.

Rules:

- keep the route shell free of personalized values
- split personalized reads by section rather than keeping one large page payload
- prefer authenticated route handlers for client-mounted read fetching
- return `401` JSON from those handlers when auth is missing or expired
- mark personalized route responses as private and `no-store`
- keep server actions thin by shaping section payloads from shared model methods or adjacent read helpers

The dashboard is the reference implementation for this pattern:

- header summary fetches separately
- upcoming payments fetch separately
- recent activity fetches separately

Projection now follows the same pattern:

- the month shell renders from the URL alone
- header totals fetch separately
- chart data fetches separately
- spaces-with-transactions fetch separately

Transactions now use the same approach across listing, detail, and creation flows:

- the filterable list shell renders from the URL and fetches the results card separately
- the detail route mounts a client detail section behind an authenticated endpoint
- new-transaction forms fetch their own space and recent-activity data after mount

Spaces now use the same approach across overview, archived, detail, and edit flows:

- the month shell renders from the URL alone
- the overview and archived lists fetch behind authenticated endpoints
- the detail route mounts a client detail section behind an authenticated endpoint
- the edit route keeps a static shell and fetches its editable payload after mount

Settings and account are the lightweight follow-on cases:

- settings keeps a static shell and mounts client-only preferences UI without adding a server fetch
- account keeps a static shell and fetches the current profile behind an authenticated endpoint

This keeps navigation fast while preserving per-user correctness.

### Detail Page Queries

Prefer a dedicated detail-query method when a page needs:

- entity metadata
- counters
- totals
- paginated rows
- selected-month subsets

Separate count and row queries when pagination correctness needs it. Consolidate metrics into focused SQL when that is clearer and faster.

### SQL Use

Raw SQL is allowed when it makes reporting or aggregate queries significantly clearer or more performant.

Rules:

- keep raw SQL encapsulated inside the shared table class
- use explicit aliases and minimal selected columns
- preserve current business behavior exactly when replacing Prisma with SQL

## Behavior Preservation

Structural refactors must not silently change:

- public action signatures
- error keys
- ownership enforcement
- ordering
- pagination semantics
- amount normalization
- month-bound inclusion rules

If behavior changes, it should be a deliberate product change rather than an architectural side effect.

## Transaction Categories

Transactions store one `TransactionCategory` and a `TransactionCategorySource`.
The fixed catalog and its localized labels live in `src/lib/category_catalog.ts`
and `src/locales/`; category keys are stable data values and must not be derived
from display copy. Existing rows receive `uncategorized` with source `fallback`
when the additive migration is applied.

Matching data lives in the database:

- `CategoryDefault` holds shared defaults for all users. Rules have a pattern,
  transaction type, match mode (`exact`, boundary-aware `phrase`, or `all`),
  ascending priority, and an enabled flag. `CategoryDefault.listActive` is the
  shared read boundary. Edit these rows to change defaults without deploying code.
- `CategoryMatch` holds personal exact matches and reviewed personal phrases,
  scoped to an account and transaction type. Manual selection always teaches an
  exact match. A personal exact match wins over personal phrases; personal matches
  win over shared defaults. Shared ties use stable IDs. Unknowns use Uncategorized.
- `src/lib/category_matching.ts` is a pure resolver, with no merchant or personal
  data lists. Both browser and server resolve the same database-supplied rules.

`20261027150000_database_category_defaults` creates and initially seeds the shared
rules. Seed rows are installation data; runtime reads the database. The local
reviewed personal mappings were imported only for `user_leo_gonzalez`, including a
personal Santiago phrase for Pets. Sophia’s existing transactions and matches
were left unchanged. Personal examples such as Jardin Tizi never become global
rules. Existing financial and classification fields remain unchanged by this move.

Normalize descriptions through `normalizeTransactionDescription` and keep its
version in sync with changes to its behavior. An explicit choice updates the
transaction, exact learned match, and `UserAccount.categoryRulesVersion` in one
transaction. Repeating the same choice does not increment the version. Automatic
assignments do not teach; deleting a transaction does not delete learned knowledge.
Account deletion cascades to personal matches. Income defaults are database rules
as well; the missing-bootstrap fallback is Uncategorized for either type.

The authenticated `/api/transactions/category-matches` bootstrap returns the
current account’s matches/version plus shared defaults and a content fingerprint,
with `private, no-store` headers. Account-scoped memory deduplicates requests and
applies personal save patches immediately, including saves overlapping bootstrap.
Typing and repeated entries use local matching without extra requests. Form
activation, tab visibility, or window focus revalidates snapshots older than one
minute; there is no polling. Shared inserts, edits, disabling, and deletion change
the fingerprint even when performed directly in the database. Server saves read
authoritative defaults; bulk saves load defaults and personal knowledge once per
batch. Defaults edits do not rewrite historical transactions. Amazon has a low-priority
shared Shopping default, so more specific rules still win. Shift and Total
February are intentional Uncategorized choices for Leo, stored as exact personal
matches rather than global rules. Mass edits preserve
categories and do not teach. Transfers remain excluded from category matching.

Historical classification proposals are generated by
`scripts/category_backfill_proposals.ts`. The command is dry-run-only, rejects
non-local or unexpected database identities, and writes its versioned proposal
report under `/private/tmp`. It does not update transactions or learned matches.
`CategoryBackfillProposalGenerator` owns the local connection and separates data
loading, classification, and group summaries. Shared `CategoryBackfillProposal`
and `CategoryBackfillReview` models in `scripts/category_backfill_models.ts` own
snapshot checksums (including the shared-defaults fingerprint), stable group
identities, review linkage, and approval
validation. Their JSDoc describes the invariants and failure conditions shared
by the commands.
`scripts/category_backfill_review_template.ts` creates an editable review file
with safe, resolved groups proposed for approval and unresolved groups skipped
by default. `scripts/category_backfill_freeze_manifest.ts` requires an explicit
approved review status and freezes only reviewed transaction IDs and expected
record versions into a checksummed manifest; freezing does not apply it.

## Dashboard Category Allocations

`/api/dashboard/allocations` is authenticated, per-request, and `private, no-store`.
The dashboard’s static card shell loads it through its own section controller.
`Transaction.getMonthCategoryAllocationsForUser` shares the complete occurrence
query with monthly dashboard totals: recurring and installment occurrences inherit
the stored category, day-of-month values clamp to month end, and credit-card
statement cutoffs select the same reporting month. There is no preview limit or
participant join. Each occurrence is counted once; internal transfers are excluded.

Two Recharts donut cards show expenses and income separately, in that order.
They share one authenticated snapshot/request. Each card uses only its type’s
positive magnitude, total, percentage denominator, and category ordering. A mixed
category can appear in both cards with its separate amounts. Zero-value sides are
omitted; empty states are independent. The desktop layout places the chart cards
in the first row, with Upcoming Transactions and Recent Activity in the second
row. Narrow screens stack the cards in that same reading order.

Each legend shows category icons, localized names, amounts, and percentage shares.
The card title identifies the transaction type, so legend rows omit type icons.
Uncategorized remains visible
when present. The accessible legend provides the full data alongside the
decorative chart. Category palette tokens and icon metadata are shared through
the catalog. Empty, loading, and retry states preserve card titles and captions.

Run `RUN_DATABASE_TESTS=1 node --env-file=.env --test
scripts/tests/category_allocations_test.mjs` for owner isolation, mixed categories,
transfers, split counting, complete schedules, and statement-boundary coverage.

## Validation

After backend or data refactors:

- run `yarn lint:types`
- run focused ESLint on touched files
- run broader validation only when the change affects routing, production behavior, or build-sensitive code

## Review Checklist

- Is there one canonical shared class for the table?
- Does that class own table-specific DB interaction?
- Is instance state grouped under `data`?
- Are instance methods limited to row-oriented mutations?
- Are static methods used for queries, lists, aggregates, and sync workflows?
- Are generic helpers kept out of table action files?
- Are action exports grouped in CRUD order?
- Has obvious query waste been removed while preserving behavior?

## Credit-Card Statement Cutoff

For cards with a configured `periodEndDay`, that day starts the next statement period, inclusive from midnight. The field retains its existing database name for compatibility; the UI calls it the statement cutoff day. A statement closing in a calendar month is paid the following month, on `paymentDueDay` (clamped to the last day in shorter months). The due day does not select the payment month.

For cutoff 24, purchases September 24 through October 23 are paid in November; purchases October 24 through November 23 are paid in December. Clamp the cutoff itself to the last day of shorter months. Keep the SQL function and `CreditCardSpace` calculation aligned. Relevant transaction lists, totals, projections, and upcoming payments must use the same payment month.

Cards whose cutoff is null retain the legacy transaction-month reports and saved settlement timing. Editing those cards must not require inventing a cutoff. Entering a cutoff opts the card into statement periods.

Run `RUN_DATABASE_TESTS=1 node --test scripts/tests/credit_card_compatibility_test.cjs` against a migrated local database for boundary checks and rolled-back fixtures covering relevant lists, totals, and projections.

## Shared Space Members And Transaction Splits

Each `SpaceMember` belongs to one space. It is a named participant, not a separate
login or an invitation. A removed member retains its identity through `removedAt`
so old transactions and historical distributions do not change. New transactions
can select active members only; editing can retain removed participants already
selected on that same transaction. Renaming preserves the member ID. An unchanged
member list does not write member rows. Space details and member changes save in
one transaction.

`Transaction.splitParticipantIds` stores distinct participant IDs separated by
`;`. The owner is represented by their `UserAccount.id`; other participants use
`SpaceMember.id`. Null/empty legacy values attribute the transaction to its owner.
Server validation scopes every selected member to the owned space and rejects an
empty selection. Ordinary income and expense transactions support splits;
transfers are excluded from member totals. Bulk creation defaults to owner-only.

Shares are equal, rounded individually in cents, then summed for the selected
month. A three-way split of 100 yields 33.33 each, with no remainder allocation.
Member totals are informational and do not modify balances or projection totals.
They follow projection occurrence generation and credit-card statement mapping,
including all occurrences beyond the five-row projection preview. Former members
appear in months containing their shares; active members also show zero totals.

Run `RUN_DATABASE_TESTS=1 node --test scripts/tests/space_members_test.mjs
scripts/tests/copy_db_prod_test.mjs` for isolated local database coverage. The tests
create and drop temporary databases; the local PostgreSQL role needs that ability.

The space detail relevant-transactions card, its monthly PDF, and projection
space cards show
mutually exclusive participant groups. Each full occurrence amount belongs to
exactly one group of participant IDs, independent of selection order. Shared
groups appear before individual rows. Spaces without any members show only the
overall total, without a participant breakdown. Only groups with relevant occurrences
appear; members without personal occurrences have no individual row. Owner labels
use the account name (email if absent),
and former members retain their labels. These rows use the same monthly occurrence
mapping as the space total, including transfers in the owner-only row, so their
sum reconciles with that total. Projection cards use the complete monthly occurrences for their group totals,
including transactions beyond the five-row preview.

Dashboard upcoming credit-card payments use a different calendar reference from
reporting: a configured statement reported in November is debited in October on
the configured due day. Upcoming amounts query the following reporting month's
complete statement occurrences, subtracting income credits from expenses. Their links open that reporting month in the
space detail view, preserving statement inclusion and recurring transactions.
Legacy cards without a cutoff retain their saved settlement timing.

## Settlement UI Retirement

Settlement shortcuts on space and transaction details, main-space marking and
status, and automatic settlement descriptions in transfer creation are hidden.
This is a UI-only retirement: existing transfers, main-space data, server actions,
and reporting calculations remain intact. Ordinary transfer creation and
credit-card billing configuration remain available.

## Bulk Transaction Editing

The space detail relevant-transactions card supports checkbox selection and opens
`/transactions/mass-edit` with selected IDs and the originating space/month in the
URL. Cancel clears selection. Transfers, differing split groups, or differing
schedule modes/installment counts block editing, with a hover/focus tooltip.
Selection is limited to 500 transactions per batch. Mixed types/spaces default to
preserving each transaction's value; matching values are prefilled. Member-shared
transactions stay in their source space because member identities are space-scoped.

`Transaction.massUpdateForUser` locks selected rows, rechecks ownership, archived
status, eligibility, and `updatedAt`, then saves every row in one database
transaction. Changed dates retain schedule mode and installment length. Legacy
owner-only splits are normalized to the owner ID. Transfer and split controls are
not part of the editor. Authenticated reads stay per-request; successful writes
invalidate affected transaction/space pages and reporting surfaces.

The tooltip and selection pattern references were inspected on 2026-10-26 in the
Shimmer showcase (published bundle `index-D_HVckcy.js`):

- https://nerdgeschoss.github.io/shimmer-components-static/components/tooltip
- https://nerdgeschoss.github.io/shimmer-components-static/hooks/use_selection

Currento uses its existing checkbox/button/form primitives, tokens, and React
Compiler. The tooltip uses CSS positioning plus keyboard focus/Escape support
rather than the reference's inline CSS anchor plumbing; the selection hook keeps
the Set/toggle/clear pattern and scopes selection to the space and month.

Run `RUN_DATABASE_TESTS=1 node --env-file=.env --test
scripts/tests/mass_transaction_edit_test.mjs` against the local development
database for ownership, atomic rollback, stale edits, space moves, and split and
schedule preservation. The test creates disposable accounts and deletes them in
its cleanup step.
