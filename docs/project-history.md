# Project History

This is a curated first-parent history of how Currento reached its 1.0 state on `main`.

## Phase 1: Initial Product Shape

On February 8, 2026, the project started with a burst of foundational commits:

- `129461b` `first commit`
- `dc16046` `more manual changes`
- `e82b47f` `second row of features`
- `1dabec1` `formatted`

This phase established the first working product surface and early code structure.

## Phase 2: Convention Cleanup Begins

On February 28, 2026, the project started aligning implementation with stronger standards:

- `12bc449` `first commit`
- `ac4c00e` `renamed files`
- `0857907` `fixed return types`
- `02d144c` `actual rename of files`
- `8b59aa9` `added localisation`
- `110789f` `more changes`
- `f8694b2` `removed inline styling`
- `85a3c97` `fixed string convertion`

This is where the current conventions became visible in practice: naming cleanup, explicit component signatures, localisation discipline, and the push away from inline styles.

## Phase 3: Auth, Responsiveness, And Rollout Preparation

On March 1, 2026, the app matured from a feature prototype into a more complete product baseline:

- `b8e026b` `created login`
- `9f46bb0` `formatted`
- `cd10210` `added auth`
- `8a5a3a6` `mobile friendly`
- `afcdf69` `added icon component`
- `0f63efc` `prepare for rolling out (#1)`
- `d24d25f` `Prepare for rollout (#2)`
- `1030e1d` `new features (#3)`
- `09cdedb` `new features (#4)`

This phase introduced login and session flows, improved responsive behavior, added shared icon infrastructure, and prepared the app for broader use.

## Phase 4: Feature Expansion

From March 3 to March 12, 2026, Currento expanded into richer product flows:

- `24e402f` `bug fixes and user settings (#8)`
- `d48bed7` `Rework specific components (#9)`
- `9bdd589` `Rework accounts (#10)`
- `9885952` `Rework accounts page (#11)`
- `576dfac` `Transfers (#12)`
- `4c547bc` `test vercel migration deploy`
- `ac9613c` `bugs and entry page (#13)`

This phase added stronger account management, settings, transfer flows, deployment hardening, and more complete detail and entry pages.

## Phase 5: UI Architecture Rework

On March 16 and 17, 2026, the UI was heavily refined:

- `4f7a97a` `Rework UI style (#14)`
- `265c942` `Hero fixes (#15)`

These changes restyled major screens, removed page-specific wrapper components, strengthened the hero system, improved filters, and pushed the app closer to the final design language.

## Phase 6: Product Polish

On March 19, 2026:

- `9f4236c` `Feature tags (#16)`

This phase refined mobile navigation, hero actions, inputs, and detail interactions while continuing the polish pass across the app.

## Phase 7: Guardrails Become First-Class

On March 20, 2026:

- `465e5b3` `Linting and skills (#17)`

This was a major turning point for maintainability:

- custom ESLint rules were added
- repo-level lint scripts were formalized
- review scripts for page wrappers and primitive preference were introduced
- cleanup skills were codified from the team's recurring lessons

This commit is the clearest marker of the project graduating from ad hoc cleanup to enforceable conventions.

## Phase 8: Final Domain Refinement

On March 21, 2026:

- `cd769fd` `Rename tables (#18)`

This final major pass renamed the domain to the cleaner Currento vocabulary:

- accounts became spaces
- entries became transactions
- user became user account

It also modernized backend classes, updated routes and UI, aligned color variables, and increased primitive usage. This is the clearest milestone for the current 1.0 shape of the app.

## Phase 9: Hybrid Protected Navigation

The next architectural step after 1.0 is the hybrid protected-page pattern:

- keep the protected route shell static when it contains no personalized values
- move personalized data into independently fetched client sections
- prefer authenticated route handlers for those section reads
- keep titles, icons, descriptions, and actions visible immediately
- use shimmer placeholders only for the data-bearing region

The dashboard is the first reference migration for this approach.

Migration steps for future pages:

1. Remove page-level personalized data fetching from the route shell.
2. Keep only static chrome in the shell.
3. Split personalized reads into section-level server helpers and authenticated route handlers.
4. Mount client section components that fetch, cache the last successful payload, and revalidate on mount.
5. Keep `401` handling explicit and isolate non-auth failures to the affected section.

## Why This History Matters

The important lesson is not just that features were added. The repo steadily moved toward:

- stronger naming and filesystem discipline
- thinner server actions and better data ownership
- better localisation habits
- fewer inline and page-owned styling shortcuts
- more deliberate primitive usage
- enforceable linting instead of informal preferences

That evolution is the real reusable asset for the next project.
