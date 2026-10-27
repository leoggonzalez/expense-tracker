# Transaction Categories — Implementation Plan

Status: planning only. This document does not authorize implementation, deployment,
or database changes. Initial implementation and classification backfill will be
tested against the local production copy. Production requires the user's explicit
green light after reviewing the local results.

## Database Matching Update

Matching data now lives in `CategoryDefault` (shared rules) and `CategoryMatch`
(account-specific exact matches and reviewed phrases). The matching module contains
only the resolver. Shared defaults are loaded alongside personal matches and
fingerprinted by content; they can be edited in the database without a deployment.
Personal corrections never change global rules. Revalidate the browser snapshot on
form activation or focus after one minute; do not fetch while typing or poll.
The original built-in-rule references below are superseded by this database model.
The category enum, localized labels, and visual catalog remain in code.

## 1. Objective

Give every transaction one category so that a later dashboard feature can show
where money is being spent. Categories should be suggested automatically, improve
through explicit corrections, and work efficiently when entering many expenses
one after another.

The categorization feature establishes the data and editing flows. Dashboard
charts are a subsequent feature, not part of this implementation's initial UI.

## 2. Agreed Decisions

- A transaction has exactly one category for now; these are categories, not a
  multi-tag system.
- Use a fixed category catalog. Users cannot create, rename, or delete categories.
- Store the category as a scalar database value. Do not use a semicolon-separated
  list or introduce a category join table.
- Recommended implementation: a Prisma enum plus a shared code catalog for
  localized labels, icons, ordering, and chart tokens. No `Category` table is
  required for this fixed catalog.
- Persist learned description-to-category matches in a separate table, scoped to
  the authenticated account and transaction type.
- Load learned matches once for the transaction-creation session. Calculate
  suggestions locally; typing and clearing the form must not trigger category
  database reads.
- Explicit category choices can teach the system. Automatically assigned
  categories must never train it on its own guesses.
- Mass editing has no category control. It preserves categories and classification
  sources even when names, dates, types, spaces, or values change. It does not
  create or update learned matches.
- Historical classification is reviewed and applied locally first. No production
  connection, write, migration, deployment, or automatic production backfill is
  part of the local rollout.

## 3. Initial Category Catalog

| Stable key                       | Display name                     | Typical examples                                                     |
| -------------------------------- | -------------------------------- | -------------------------------------------------------------------- |
| `shopping`                       | Shopping                         | Clothing, electronics, retail purchases                              |
| `food_groceries`                 | Food & Groceries                 | Supermarkets and everyday groceries                                  |
| `bars_restaurants`               | Bars & Restaurants               | Cafes, restaurants, takeaways, food delivery                         |
| `leisure_entertainment`          | Leisure & Entertainment          | Streaming, cinema, concerts, hobbies                                 |
| `housing_public_services`        | Housing & Public Services        | Rent, utilities, internet                                            |
| `transport_car`                  | Transport & Car                  | Transit, fuel, ride services, car expenses                           |
| `atm`                            | ATM                              | Cash withdrawals                                                     |
| `income`                         | Income                           | Salary, incoming earnings, refunds by default                        |
| `family_friends`                 | Family & Friends                 | Personal payments and reimbursements                                 |
| `insurance`                      | Insurance                        | Insurance premiums except pet insurance                              |
| `pets`                           | Pets                             | Santiago, pet food, litter, vet bills, pet insurance                 |
| `savings_investments`            | Savings & Investments            | Investment contributions; tracked-account transfers remain transfers |
| `health_personal_care`           | Health & Personal Care           | Medicines, pharmacy, personal care                                   |
| `travel`                         | Travel                           | Flights, hotels, visas                                               |
| `subscriptions_digital_services` | Subscriptions & Digital Services | Apps, cloud storage, digital services                                |
| `donations`                      | Donations                        | Charitable giving, including CARE                                    |
| `uncategorized`                  | Uncategorized                    | Uncertain or unmatched transactions                                  |

This catalog expands the user's initial list with seven categories approved during
the uncategorized review. The N26 reference confirms
automatic categorization and manual correction, but does not enumerate all ten
categories as a complete official list:
[N26 Insights reference](https://support.n26.com/en-de/payments-transfers-and-withdrawals/balance-and-limits/how-to-keep-track-of-my-daily-spending).

Keep stable keys independent of display copy. Labels belong in feature-specific
locale entries, beginning with `src/locales/en.json`; keep translated siblings in
sync. Choose icons from the existing icon system and colors from Currento's
tokens. Category labels, icons, and order must be available without a database
lookup or a server-only import.

The catalog should be exhaustively typed against the enum so adding a category
cannot silently omit its display metadata. Future custom categories would justify
a separate category table; future multiple tags would justify a join table.

## 4. Data Model

### Transaction classification

Add:

- `category`: `TransactionCategory`, required, default `uncategorized`.
- `categorySource`: `TransactionCategorySource`, required, default `fallback`.

Proposed classification sources:

| Source     | Meaning                                                               |
| ---------- | --------------------------------------------------------------------- |
| `manual`   | Explicit category selection in single-transaction creation or editing |
| `learned`  | Account-specific saved description match                              |
| `rule`     | Built-in deterministic rule                                           |
| `fallback` | No sufficiently reliable match                                        |
| `backfill` | Assignment from an approved historical classification manifest        |

Existing rows initially resolve to Uncategorized. The later backfill provides
semantic classifications. Test the additive migration on the local production
copy, including its locking behavior, before considering any production rollout.

Do not require a new transaction-to-user relationship: ownership continues to come
through the transaction's space. Evaluate a `(spaceId, category)` index against
actual aggregate queries rather than adding speculative indexes.

### Learned matches

Add a `CategoryMatch` model with:

- `id`
- `userAccountId`, with an owned relationship to `UserAccount`
- `normalizedDescription`
- `transactionType` (`income` or `expense`)
- `category`
- `createdAt` and `updatedAt`

Enforce uniqueness on `(userAccountId, normalizedDescription, transactionType)`.
Matches apply across that user's spaces, while income and expense matches remain
separate. Do not match or learn across users.

Add an account-level `categoryRulesVersion` integer. Increment it only when a
learned mapping actually changes, in the same transaction as that mapping. Use it
to reconcile cached data, not to introduce polling.

Deleting a transaction does not delete learned knowledge. Account deletion should
remove its matches. A dedicated `CategoryMatch` class in `src/lib` owns its queries
and mutations, following the repository's table-class conventions.

## 5. Categorization and Learning

### Resolution order

1. An explicit category selected by the user.
2. An exact account-specific learned match for normalized description and type.
3. A high-confidence built-in rule.
4. Uncategorized.

Normalize descriptions consistently in the browser and server: Unicode
normalization, case folding, trimming, and collapsing repeated whitespace. Any
punctuation normalization must be conservative and tested. Do not indiscriminately
remove digits, accents, or meaningful words. Keep the normalization behavior
versioned in code because changing it can change learned-match identities.

Start with deterministic rules using phrase and word boundaries. More specific
phrases take precedence over broader terms. Example distinctions include Uber
Eats versus Uber trip, and food delivery versus supermarket purchases.

Do not blanket-classify ambiguous merchants such as Amazon or Apple. A description
such as "Amazon cat food" may have a clear rule, while "Amazon" should fall back
unless the user has explicitly taught that exact description. Household names or
the existence of a split group are not enough to infer Family & Friends.

Do not introduce an external AI call into interactive creation in this version.
Assisted reasoning can help prepare historical proposals, which still require
review before application.

### Learning behavior

- A single explicit correction is enough to establish or replace an exact match.
- The latest explicit choice for that user's description/type key wins.
- Learn using the description and type actually saved, including when the user
  edits those fields together with the category.
- Programmatically prefilling a selector does not count as explicit selection.
- Explicitly choosing Uncategorized can suppress a wrong automatic suggestion;
  an automatic Uncategorized fallback does not create a match.
- Single-transaction editing preserves the saved category by default. Changing a
  description alone must not silently recategorize or teach a new match.
- Learned changes affect future suggestions, not previously categorized records.
- Track whether a category was explicitly selected separately from its value.
  Preserve this intent in drafts so restoring an automatic suggestion does not
  accidentally turn it into training data.

Transaction changes, learned-match upsert, and version increment must succeed or
roll back together. Keep server actions thin; the transaction/model layer owns
the persistence and validation.

## 6. Efficient Creation-Session Cache

### Initial load

Expose an authenticated private endpoint returning the current account's learned
matches and rules version. The category catalog and built-in rules are shared
code; only learned mappings need this request.

Keep a session-level, account-scoped memory cache shared across the transaction
creation flows. Deduplicate concurrent loads with one in-flight request. Do not
refetch on every form mount, save, field clear, or income/expense tab switch.

Follow existing private response boundaries. Browser memory reuse is an explicit
application behavior; do not make personalized responses publicly cacheable. Clear
memory and in-flight ownership on logout/account changes, and reject late responses
belonging to an earlier account.

### While typing

Perform normalization and rule lookup locally. An optional short debounce controls
local suggestion updates only. Description changes must produce zero suggestion
HTTP requests and zero suggestion database reads.

Until matches finish loading, use built-in rules or Uncategorized. A late response
must not replace a manual selection, restore an old description's suggestion, or
apply results after the form has been cleared.

### Saving and resetting

The existing authenticated save request validates the category. In automatic mode,
the server re-resolves from authoritative rules; it can perform one learned-match
lookup as part of saving. There is no separate suggestion request per save.

If learning changes, return the saved transaction, updated match, and new rules
version in the save response. Patch the memory cache immediately. If nothing was
learned, do not invalidate or reload the cache.

Clearing form-specific values after saving retains learned matches. Reset the
category's manual/automatic intent for the next transaction and derive its new
suggestion from whichever description/type remains.

### Other tabs and freshness

Use an account-scoped `BroadcastChannel` event to share a match patch or mark the
cache stale after an explicit correction. Ignore events for a different account.
If invalidated, refresh once when the creation flow is next active. Do not poll.
Refetch when version gaps or out-of-order events prevent a safe patch. Start a
fresh cache on a new browser session. Do not persist the learned description list
to local storage in the initial implementation.

For a session entering 30 expenses: one initial learned-match load, no reads while
typing or resetting, and only the existing save requests with their necessary
validation and writes. Add a network-level regression check for this behavior.

## 7. UI and Transaction Flow Integration

### Single creation

- Add a category selector using existing form primitives and catalog metadata.
- Display a suggestion as the description changes, with an unobtrusive indicator
  when useful to distinguish automatic selection.
- A manual selection takes priority and stays selected as the description changes.
- Provide a clear way to return to automatic suggestion mode.
- Extend scoped and global draft persistence with category value and selection
  intent, preserving compatibility with older drafts.
- Preserve the repeated-entry workflow and its existing field-reset behavior.

### Single editing

- Prefill the saved category.
- Allow explicit changes and learning in the same save.
- Preserve existing classification when unrelated fields change.
- Preserve split, schedule, ownership, and stale-update behavior.

### Bulk creation

Resolve each new row independently using the same engine. Reuse the loaded match
cache for previews and load learned mappings once per server batch when validating,
rather than once per row. Do not treat automatic assignments as user corrections.
If the bulk-creation UI exposes an explicit category choice, carry explicit intent
per row and teach only those rows.

### Mass editing — explicit exception

Do not add a category selector, a category update field, or learning to mass editing.
The existing category and source must survive every mass-edit save unchanged,
including when description or type changes. Do not infer categories implicitly.

Add this short localized note:

> To change a category, edit the transaction individually.

Transactions with different categories remain eligible for mass editing when their
existing split/schedule compatibility checks pass. Extend the server's explicit
update allowlist tests so an unexpected category field cannot change classification.

### Transfers and existing displays

Internal transfers remain excluded from spending categorization and learning.
Store Uncategorized for them and hide their category selector. A genuine personal
payment recorded as an ordinary income/expense can use Family & Friends.

Expose category metadata on transaction detail and relevant payloads as needed.
Use a compact label/icon treatment where appropriate, preserving the existing
transaction-list layout. Do not redesign lists or add dashboard charts in this step.

## 8. Reporting Contract for Future Charts

Category aggregation must reuse complete occurrence generation and the current
reporting-month mapping, not just group stored rows by `beginDate` or `createdAt`.

- Recurring and installment occurrences inherit the stored transaction category.
- Credit-card reporting months remain unchanged. For example, the existing
  September 24–October 23 statement stays in November reports; its upcoming debit
  display remains in October as separately agreed.
- Exclude internal transfer rows to avoid double-counting money moving between
  spaces, including legacy settlement transfers recognized as internal transfers.
- Count each occurrence once, not once per split participant. Individual-share
  charts require a separate explicit reporting choice.
- Keep Uncategorized visible so uncategorized spending is measurable.
- The first proposed spending chart uses expenses by category and income
  separately. Net spending after refunds needs an explicit later reporting choice;
  do not silently change income into negative spending.
- Until charts are implemented, category changes must not change existing totals,
  projections, statement inclusion, or upcoming debit amounts.

## 9. Local-First Historical Backfill

### Boundary

Use the production copy already available locally. Do not refresh it from
production, connect to production, or run the deployed application's database
migrations as part of this phase.

Existing production migration tooling can fall back between environment variables.
Do not reuse that behavior for classification tooling. Local scripts must fail
closed unless the target is an explicitly validated local database; do not accept
a remote host through a generic override flag. Never invoke `migrate:prod` for the
local rehearsal.

### A. Back up before local writes

Before applying the local schema migration or classification changes, create a
complete local database backup, record its identity/time, and verify restoration
into a separate local database. Keep backup artifacts outside version control.
Preserve this baseline until local acceptance is complete.

The existing database-copy script's backup is a backup of its local destination;
it is not evidence of a production backup or a replacement for a verified baseline
of the database being changed here.

### B. Generate proposals without writing

Create a dry-run report grouped by account, normalized description, and type. Include:

- Original description variants and representative transactions.
- Transaction IDs, counts, and useful amounts/date ranges for review.
- Current category/source and proposed category.
- Reason: learned match, specific built-in rule, or assisted proposal.
- Confidence and an explicit unresolved flag.

Include archived spaces and historical transactions. Classify stored recurring
records once, not generated occurrences. Identify internal transfers separately.
Do not infer every purchase in a generic merchant group from one example.

Review clear proposals together and ask the user about ambiguous groups. Where
the same normalized name has different meanings, preserve per-transaction
assignments and do not seed a conflicting learned rule.

### C. Freeze an approved manifest

Record a run ID, target database identity, schema/normalization/rules versions,
manifest checksum, and review status. Each assignment records transaction ID,
account ownership, expected description/type/`updatedAt`, previous category/source,
and proposed category/source. Keep a separate list of approved learned mappings.

The apply script uses reviewed IDs and expected values, not a fresh fuzzy match.
Changing the proposal engine after review must not change an approved assignment.

### D. Rehearse and apply locally

Dry run is the default. An explicit local apply mode must:

1. Validate database identity, schema, manifest integrity, and review status.
2. Recheck ownership and expected record versions.
3. Skip records changed since review and report them for renewed review.
4. Protect manual corrections made after proposals were generated.
5. Apply bounded, transactional batches with durable progress and audit records.
6. Be resumable and idempotent without reapplying completed assignments.
7. Seed only explicitly approved, unambiguous account-specific learned mappings.

Preserve amounts, spaces, descriptions, dates, schedules, splits, and types.
Classification writes may update `updatedAt` so open editors detect stale records;
record the resulting version for rollback. Do not update financial values or
historical transaction timestamps such as `createdAt`.

### E. Validate and support rollback

Compare pre/post row counts, financial totals, category counts, and unresolved
counts. Confirm existing monthly and credit-card reports are numerically unchanged.
Review representative examples from every category and all low-confidence groups.

A classification-only rollback restores category/source only where the current
classification and version still match that run's applied values. Never overwrite
a later user correction. Include learned mappings/version changes in rollback
design so reverting assignments does not leave unintended training data behind.
The complete local backup is the fallback for restoring the entire rehearsal.

### F. Production is a later gated phase

Deliver the local results, unresolved questions, verification summary, and rollback
evidence to the user. Stop before production. A successful local rehearsal is not
permission to deploy or write production.

Only after an explicit green light: take and verify a fresh production backup,
reconcile proposals against current production records, re-review changed entries,
and apply an approved production-specific manifest. Do not blindly replay local
versions or assume production stayed unchanged during the rehearsal. Coordinate
schema/application deployment so the deployed app never queries fields before
their migration exists. No production application or data change occurs sooner.

## 10. Proposed Code Areas

| Area                                                             | Planned work                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `prisma/schema.prisma` and a new migration                       | Category/source enums, transaction fields, learned-match table, account rules version            |
| `src/lib/category_catalog.ts`                                    | Shared typed display metadata                                                                    |
| `src/lib/category_matching.ts`                                   | Normalization and deterministic inference shared by browser/server                               |
| `src/lib/category_match.ts`                                      | Canonical learned-match database class                                                           |
| `src/lib/transaction.ts`                                         | Category persistence and learning for single writes and creation batches; mass-edit preservation |
| `src/actions/transactions.ts`                                    | Validated category/intent inputs, payloads, cache patches, revalidation                          |
| New private category-matches route                               | Authenticated bootstrap of account-specific matching data                                        |
| New account-scoped client cache/hook                             | Request deduplication, session reuse, version reconciliation, tab notifications                  |
| `src/components/transaction_form/transaction_form.tsx`           | Creation/edit selector, suggestion intent, save-response handling                                |
| `src/components/bulk_transaction_form/bulk_transaction_form.tsx` | Per-row classification during bulk creation                                                      |
| `src/lib/new_transaction_draft.ts`                               | Category and intent persistence with legacy-draft compatibility                                  |
| `src/components/mass_transaction_form/mass_transaction_form.tsx` | Single-edit-only explanatory note; no category control                                           |
| Locale files                                                     | Category labels, automatic/manual messaging, errors, mass-edit note                              |
| New local-only scripts and tests                                 | Backup checks, proposal/manifest generation, dry-run/apply/rollback                              |
| `docs/server-and-data.md`                                        | Final schema, learning, cache, reporting, and backfill contracts                                 |

These filenames are proposed implementation locations, not files created by this
plan. Follow snake_case names, alias imports, component-owned styles and tokens,
the required component references, and existing private/authenticated boundaries.

## 11. Test Plan

### Model and algorithm tests

- Catalog completeness, category validation, and Uncategorized defaults.
- Normalization equivalence without collapsing meaningful distinctions.
- Exact learned match precedence and specific-rule precedence.
- Ambiguous merchant fallback and separation of income/expense matching.
- Account isolation, latest explicit correction, and no learning from guesses.
- Atomic rollback of transaction/match/version changes on failure.

### Cache and UI tests

- One bootstrap request shared by concurrent consumers.
- No suggestion network/database reads while typing or clearing fields.
- Repeated saves reuse the cache; explicit corrections patch it immediately.
- Late responses and cross-account requests cannot replace current state.
- Manual selection survives later typing, cache refresh, and draft restoration.
- Older drafts restore safely; the next transaction resets manual intent correctly.
- Cross-tab/version reconciliation without polling.
- Accessible category controls, keyboard operation, loading/error behavior, and
  desktop/mobile layout.

### Transaction and reporting regressions

- Single editing preserves categories unless explicitly changed.
- Mass editing preserves category/source and never learns, even after renaming or
  changing type; differing categories do not introduce a selection restriction.
- Bulk creation resolves rows independently and batches learned-match reads.
- Internal transfers neither teach matches nor contribute to spending aggregates.
- Recurring occurrences and credit-card statement boundaries remain correct.
- Existing balances, projections, and upcoming debit totals remain unchanged.

### Backfill tests

- Remote/default-target rejection and dry-run-by-default behavior.
- Invalid, modified, or unreviewed manifests are rejected.
- Changed records and later manual corrections are protected.
- Batches are atomic, resumable, and idempotent.
- Rollback respects subsequent edits and includes learned-match effects.
- Local backup restoration succeeds before rehearsal writes.

Run focused tests while iterating, then ESLint, repository checks, type checking,
and the relevant database regression suite. Use a production build for the final
routing/deployment checkpoint. Validate production-sized local performance without
using the production database.

## 12. Delivery Sequence and Acceptance Criteria

1. **Local schema and catalog:** back up locally; migrate the local copy; add typed
   catalog and source metadata. No existing report changes.
2. **Matching and persistence:** implement account-specific learning and atomic
   writes with model tests.
3. **Cached creation/edit UI:** implement one-load local inference, draft handling,
   save-response patches, and bulk-creation support.
4. **Mass-edit exception:** add the explanatory note and preservation tests only.
5. **Backfill tooling:** generate a local proposal, review ambiguities with the user,
   freeze a manifest, and test apply/resume/rollback.
6. **Local acceptance:** verify useful classifications, unchanged financial totals,
   safe corrections, and efficient repeated transaction entry. Present results.
7. **Wait for production authorization:** no deployment or production update until
   the user explicitly approves the reviewed local result.
8. **Later features:** dashboard category charts, possible net-refund reporting,
   match-management UI, and custom/multiple tags are separate follow-up scopes.

The feature is ready for local acceptance when each stored transaction has a valid
category, suggestions require no per-keystroke database activity, explicit choices
improve future suggestions, mass edits cannot change categories, and the reviewed
local backfill is reversible without changing financial reports.
