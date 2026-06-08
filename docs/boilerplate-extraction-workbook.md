# Boilerplate Extraction Workbook

## Purpose

This workbook is the source of truth for turning Currento into a reusable boilerplate repository.

It is a decision document, not a migration guide. Its role is to help us review the repo area by area and decide what belongs in a minimal reusable starter, what should be generalized, what should become an optional module, and what should be left behind.

Use this document during folder-by-folder review sessions. Record decisions here first, then implement extraction work in separate changesets later.

## Decision Legend

### Status Meanings

- `Keep`: Move into the boilerplate unchanged except for rename or branding cleanup.
- `Keep with generalization`: Preserve the pattern but remove Currento-specific naming, copy, domain types, or workflows.
- `Optional module`: Do not include in the minimal starter by default, but preserve as a copyable module or documented add-on.
- `Remove`: Leave out of the boilerplate entirely.

### Decision Rubric

Use these prompts when reviewing each area:

- Is this framework or core architecture?
- Is this domain-specific to finance or current product behavior?
- Is this reusable but not essential for day-one starter value?
- Does this depend on local tooling, Codex, MCP, or personal workflow assumptions?

## Boilerplate Target

The target is a **minimal reusable core**.

Default bias:

- Keep framework, architecture, core tooling, conventions, and reusable primitives.
- Strip finance-specific product workflows unless they are clearly useful as generic examples.
- Prefer generic starter content over Currento-branded or finance-branded copy.
- Treat agent- and MCP-specific setup as reviewable additions, not automatic boilerplate defaults.

Working assumptions for the first pass:

- Prisma and PostgreSQL stay in the baseline.
- User account handling stays in the baseline, including login by email and code, user settings, and the avatar component.
- Any folder noted as containing retained user-facing logic is confirmed to include user interaction that should be preserved or intentionally generalized.
- Email integration is kept only to the extent required by email-and-code login; extra provider-specific behavior should still be reviewed for generalization.
- Localisation stays in the baseline with a minimal English structure.
- Demo content should become generic starter content.

### Feature Decisions Already Locked

#### Features To Keep

- User account handling
- Login with email and code
- User page settings
- Avatar component
- General app layout
- Side navigation on desktop and bottom navigation on mobile
- Card component with icon and title support
- Buttons
- Icons
- Settings page controls for language and appearance

#### Keep Folders As They Are

- `docs`
- `eslint-rules`
- `src/elements`

#### Keep With Generalization

- `prisma` - contains retained user-facing logic
- `scripts`
- `src/actions`
- `src/lib` - contains retained user-facing logic
- `src/locales` - contains retained user-facing logic
- Root `locales` if still needed after review

#### Reduce To Boilerplate

- `src/app`
- `src/components`
- `src/model` - contains retained user-facing logic
- `src/styles`

#### Documentation Handling

- Move non-`README.md` markdown documentation into `docs/` in the extracted boilerplate.
- Keep `README.md` at repo root as the entrypoint and index of where each document lives.
- Update `docs/new-project-quickstart.md` so it explicitly covers coding guidelines, agent behavior, and which boilerplate files should exist from day one.

## Review Order

Review the repo in this order so high-level repo policy decisions happen before deeper app cleanup:

1. Top-level config and metadata
2. Tooling and repo conventions
3. Data layer
4. App code
5. Legacy and misc root files
6. MCP, agent, and workflow layer

## Folder Decisions

Use this template for every review item:

- `Purpose today`
- `Boilerplate recommendation`
- `Status`
- `What to keep`
- `What to generalize`
- `What to remove`
- `Notes / dependencies`

### Top-Level Config And Metadata

#### `.github`

- `Purpose today`: CI and repo automation.
- `Boilerplate recommendation`: Review workflows for general CI value versus Currento-specific assumptions.
- `Status`: `Keep with generalization`
- `What to keep`: Generic validation workflows, reusable automation patterns.
- `What to generalize`: Repo names, environment assumptions, deployment-specific references.
- `What to remove`: Any workflow tied only to Currento operations or one-off maintenance.
- `Notes / dependencies`: Depends on whether the boilerplate ships with the same lint/type/test contract.

#### `AGENTS.md`

- `Purpose today`: Repo-level coding guidance and links into the handbook.
- `Boilerplate recommendation`: Evaluate whether a generalized agent-facing repo guide improves maintainability without locking the template to one tool.
- `Status`: `Keep with generalization`
- `What to keep`: Reusable coding conventions and handbook entrypoint behavior.
- `What to generalize`: Product naming, repo-specific examples, agent assumptions that are too Currento-specific.
- `What to remove`: Guidance that only makes sense for this product or this exact working style.
- `Notes / dependencies`: Final decision depends on MCP and agent-tooling review below.

#### `SERVER_GUIDELINES.md`

- `Purpose today`: Root entrypoint for backend and data guidance.
- `Boilerplate recommendation`: Keep only if it remains a helpful top-level pointer instead of duplicating `docs/`.
- `Status`: `Keep with generalization`
- `What to keep`: Repo-entry guidance pattern for backend conventions.
- `What to generalize`: Domain terms and Currento-specific backend examples.
- `What to remove`: Product-specific instructions that duplicate handbook detail.
- `Notes / dependencies`: Depends on whether the boilerplate retains the split between root guidance and detailed docs.

#### `README.md`

- `Purpose today`: Project introduction, setup, and handbook links.
- `Boilerplate recommendation`: Replace with generic starter README tailored to the extracted template.
- `Status`: `Keep with generalization`
- `What to keep`: Setup shape, script overview, handbook references if still applicable.
- `What to generalize`: Product name, app description, env examples, local setup copy.
- `What to remove`: Finance-specific positioning and Currento-only narrative.
- `Notes / dependencies`: Should align with final starter scope and optional modules.

#### `QUICKSTART.md`

- `Purpose today`: Fast-start instructions for this repo.
- `Boilerplate recommendation`: Keep only if the starter benefits from a short onboarding layer separate from `README.md`.
- `Status`: `Keep with generalization`
- `What to keep`: Fast local setup pattern if it reduces onboarding friction.
- `What to generalize`: Product-specific setup text and naming.
- `What to remove`: Any setup step tied only to Currento workflows.
- `Notes / dependencies`: May be merged into `README.md` if separate quickstart feels redundant.

#### `next.config.js`

- `Purpose today`: Next.js runtime and build configuration.
- `Boilerplate recommendation`: Preserve the baseline config if it reflects the desired starter runtime.
- `Status`: `Keep`
- `What to keep`: React Compiler setting, build/lint behavior, server action defaults if still desired.
- `What to generalize`: Any app-specific or deployment-specific configuration if found.
- `What to remove`: Unused project-only flags.
- `Notes / dependencies`: Validate against the intended Next.js starter experience.

#### `tsconfig.json`

- `Purpose today`: TypeScript compiler configuration and alias setup.
- `Boilerplate recommendation`: Preserve as part of the starter contract.
- `Status`: `Keep`
- `What to keep`: Strictness, path alias, project-wide compiler defaults.
- `What to generalize`: Any narrow include/exclude rules tied to Currento-only files.
- `What to remove`: Stale or generated-file assumptions.
- `Notes / dependencies`: Should stay aligned with lint, build, and script expectations.

#### `package.json`

- `Purpose today`: Dependencies, scripts, and repo workflow contract.
- `Boilerplate recommendation`: Keep the baseline workflow shape, then trim domain-specific packages and optional modules.
- `Status`: `Keep with generalization`
- `What to keep`: Core Next.js, TypeScript, Prisma, SCSS, lint/review script contracts.
- `What to generalize`: App metadata and dependency set for optional capabilities.
- `What to remove`: Finance-specific runtime dependencies and tooling not needed in the starter.
- `Notes / dependencies`: Strong dependency on decisions for auth, email, charts, and review scripts.

#### `vercel.json`

- `Purpose today`: Deployment platform configuration.
- `Boilerplate recommendation`: Include only if it adds value as a default hosting baseline.
- `Status`: `Keep with generalization`
- `What to keep`: Generic deployment settings that are safe for template reuse.
- `What to generalize`: Project names, environment expectations, deploy assumptions.
- `What to remove`: Currento-only deployment behavior.
- `Notes / dependencies`: Depends on whether the boilerplate wants an opinionated hosting target.

#### `.eslintrc.json`

- `Purpose today`: ESLint configuration entrypoint.
- `Boilerplate recommendation`: Preserve as part of the baseline validation contract.
- `Status`: `Keep`
- `What to keep`: ESLint stack and rule wiring.
- `What to generalize`: Any overrides tied to Currento-only files or conventions that should not be template defaults.
- `What to remove`: Dead exceptions.
- `Notes / dependencies`: Coupled to `eslint-rules` and lint scripts.

### Tooling And Repo Conventions

#### `docs`

- `Purpose today`: Handbook, conventions, history, and quickstart material.
- `Boilerplate recommendation`: Keep the handbook concept and use `docs/` as the canonical home for non-README markdown documentation.
- `Status`: `Keep`
- `What to keep`: Reusable conventions, architecture guidance, starter documentation structure, quickstart, and workbook-style planning docs.
- `What to generalize`: Project-specific naming and examples inside reusable docs.
- `What to remove`: Historical material that only matters to Currento unless archived elsewhere.
- `Notes / dependencies`: Root markdown files other than `README.md` should move here in the extracted boilerplate.

#### `eslint-rules`

- `Purpose today`: Custom repo-specific lint rules.
- `Boilerplate recommendation`: Keep if the rules express reusable architecture standards; otherwise trim or soften them.
- `Status`: `Keep with generalization`
- `What to keep`: Framework-agnostic or starter-aligned enforcement of naming, styling, and architecture conventions.
- `What to generalize`: Rule messages, repo path assumptions, Currento-specific terminology.
- `What to remove`: Rules that only protect finance-domain structure or personal preferences with low template value.
- `Notes / dependencies`: Must stay aligned with handbook guidance and scripts.

#### `scripts`

- `Purpose today`: Lint orchestration and architectural review helpers.
- `Boilerplate recommendation`: Preserve reusable validation and review tooling, but generalize project assumptions.
- `Status`: `Keep with generalization`
- `What to keep`: Lint runner shape, review scripts that reinforce reusable architecture.
- `What to generalize`: Hardcoded paths, project naming, output text, domain assumptions.
- `What to remove`: One-off maintenance scripts that are not part of the starter workflow.
- `Notes / dependencies`: Strongly tied to `package.json`, `eslint-rules`, and documentation.

### Data Layer

#### `prisma`

- `Purpose today`: Schema, migrations, and seed setup for the app data model.
- `Boilerplate recommendation`: Keep Prisma/PostgreSQL baseline and preserve user-facing account flows, but replace finance-domain schema and seed content with starter-safe examples.
- `Status`: `Keep with generalization`
- `What to keep`: Prisma structure, migration flow, seed entrypoint pattern.
- `What to generalize`: Schema models, seed data, domain naming, and auth/data ownership assumptions, while preserving reusable user-account flows.
- `What to remove`: Currento-specific entities, business rules, and historical migrations not relevant to the starter.
- `Notes / dependencies`: Requires a deliberate decision on what a minimal starter schema should contain.

#### `prisma.config.ts`

- `Purpose today`: Prisma config for schema, migrations, datasource, and seed path.
- `Boilerplate recommendation`: Preserve as baseline Prisma wiring.
- `Status`: `Keep`
- `What to keep`: Config structure and env-driven datasource pattern.
- `What to generalize`: Naming and paths only if the boilerplate structure changes.
- `What to remove`: Nothing by default.
- `Notes / dependencies`: Depends on keeping Prisma in the baseline.

### App Code

#### `src/app`

- `Purpose today`: Route files and page composition.
- `Boilerplate recommendation`: Reduce to a single localized index route that says welcome to your app, while keeping the App Router structure.
- `Status`: `Keep with generalization`
- `What to keep`: App Router conventions, layout structure, route composition patterns.
- `What to generalize`: Route copy, metadata, and homepage content into a boilerplate welcome experience.
- `What to remove`: Finance workflows and extra pages that are not part of the minimal starter.
- `Notes / dependencies`: Keep enough app structure to support the retained user flows and localized homepage.

#### `src/actions`

- `Purpose today`: Server actions for auth, spaces, transactions, and user account flows.
- `Boilerplate recommendation`: Keep the folder, preserve user-account-related actions, and generalize or remove finance-domain mutations.
- `Status`: `Keep with generalization`
- `What to keep`: Server action pattern, user-account handling, email-code login flows, and settings mutations.
- `What to generalize`: Naming, payloads, and generic reusable action patterns.
- `What to remove`: Finance-domain mutations and product-specific workflows from the baseline.
- `Notes / dependencies`: Must stay aligned with retained user flows and the simplified app surface.

#### `src/components`

- `Purpose today`: Reusable rendered UI sections and feature components.
- `Boilerplate recommendation`: Reduce to boilerplate and keep only clearly general-purpose components. This folder needs the most thorough review.
- `Status`: `Keep with generalization`
- `What to keep`: App shell patterns, responsive navigation, avatar, reusable form/UI composition, generic feedback/dialog/loading components, cards, buttons, hero blocks, form fields, and other general-purpose pieces.
- `What to generalize`: Naming, copy, props, and any domain-coupled component contracts.
- `What to remove`: Product-specific components with no starter value.
- `Notes / dependencies`: Review component-by-component later using this workbook as the tracker. Ask before removing anything that may be reusable but is not obviously domain-specific.

#### `src/elements`

- `Purpose today`: Low-level UI primitives.
- `Boilerplate recommendation`: Preserve as part of the starter design system baseline and copy all primitive dependencies alongside them.
- `Status`: `Keep`
- `What to keep`: Primitive components, the icon system, card support for title and icon headers, and SCSS ownership model.
- `What to generalize`: Tokens, example icons, and any naming that reflects finance-specific use.
- `What to remove`: Primitive assets that only exist for Currento domain features.
- `Notes / dependencies`: When extracting primitives, make sure every dependent style, icon asset, helper, and type needed by the kept primitives is carried over too.

#### `src/lib`

- `Purpose today`: Helpers, infrastructure code, data abstractions, auth, email, and domain utilities.
- `Boilerplate recommendation`: Keep with generalization, preserving user-account support and core infrastructure while stripping finance-only logic.
- `Status`: `Keep with generalization`
- `What to keep`: Generic infrastructure such as Prisma client wiring, utilities, reusable app helpers, and the pieces required for user-account handling.
- `What to generalize`: Auth, email, and reusable abstractions so they become starter-safe rather than Currento-specific.
- `What to remove`: Finance-domain helpers and product-specific business logic from the minimal baseline.
- `Notes / dependencies`: This is likely one of the highest-effort review areas because it mixes core and domain concerns.

#### `src/model`

- `Purpose today`: Domain models and model-adjacent helpers.
- `Boilerplate recommendation`: Reduce to boilerplate while preserving any user-account model shape needed by retained user flows.
- `Status`: `Keep with generalization`
- `What to keep`: Reusable model-layer organization if it clarifies domain boundaries.
- `What to generalize`: Type names, model examples, i18n/model coupling, and any user-facing model abstractions that can be made generic.
- `What to remove`: Finance-specific models from the baseline.
- `Notes / dependencies`: May shrink dramatically if the starter uses a thinner example domain, but it must still support retained user flows.

#### `src/styles`

- `Purpose today`: Shared tokens and global styles.
- `Boilerplate recommendation`: Reduce to the minimum styles and variables needed for the boilerplate.
- `Status`: `Keep with generalization`
- `What to keep`: Variables, globals, and only the baseline theme structure needed by kept routes and components.
- `What to generalize`: Brand colors, typography, and starter visual identity into a neutral grayscale gradient scheme.
- `What to remove`: Product-specific visual branding.
- `Notes / dependencies`: The default palette should be a replaceable gray gradient so future projects can re-theme easily.

#### `src/locales`

- `Purpose today`: Application locale message files.
- `Boilerplate recommendation`: Preserve a minimal locale structure as part of the baseline and keep user-facing copy required by retained user flows.
- `Status`: `Keep with generalization`
- `What to keep`: Locale file structure, localization pattern, and copy required by retained user-account features.
- `What to generalize`: Metadata and app copy into generic starter language, including the localized welcome route.
- `What to remove`: Finance-domain and Currento-branded content.
- `Notes / dependencies`: Tied to route metadata and starter demo content.

### Legacy And Misc Root Files

#### `locales`

- `Purpose today`: Legacy or parallel locale-related folder outside `src/`.
- `Boilerplate recommendation`: Keep with generalization only if it still serves a user-facing localization role after extraction.
- `Status`: `Keep with generalization`
- `What to keep`: Any locale assets or patterns still needed after the boilerplate review.
- `What to generalize`: Structure and naming so there is one clear localization story in the starter.
- `What to remove`: Duplicate or obsolete locale structure if `src/locales` fully replaces it.
- `Notes / dependencies`: Confirm whether this stays, merges into `src/locales`, or disappears once the extracted boilerplate is simplified.

#### `migrate-old-transactions.ts`

- `Purpose today`: One-off migration support for legacy transaction data.
- `Boilerplate recommendation`: Exclude from the boilerplate.
- `Status`: `Remove`
- `What to keep`: Nothing by default.
- `What to generalize`: Nothing by default.
- `What to remove`: Entire script.
- `Notes / dependencies`: Safe default unless we intentionally create a generic data-migration example elsewhere.

#### `prompts.md`

- `Purpose today`: Prompt or workflow notes tied to repo usage.
- `Boilerplate recommendation`: Review under the MCP and agent-tooling lens rather than carrying it by default.
- `Status`: `Remove`
- `What to keep`: Nothing in the minimal starter by default.
- `What to generalize`: Only if part of a deliberate agent-friendly workflow package.
- `What to remove`: Current file unless later reclassified into generalized tooling guidance.
- `Notes / dependencies`: Depends on the MCP and agent-tooling decisions.

## Cross-Cutting Decisions

Track these decisions explicitly even when they touch multiple folders:

| Topic | Default direction | Notes |
| --- | --- | --- |
| Branding and product naming removal | `Keep with generalization` | Replace Currento and finance-facing copy with generic starter language. |
| Authentication baseline | `Keep with generalization` | Keep user account handling, email-and-code login, settings, and avatar support in the starter. |
| Email provider integration | `Keep with generalization` | Preserve the pieces required by email-and-code login, but generalize provider-specific setup. |
| Prisma/Postgres baseline | `Keep` | Keep Prisma and PostgreSQL as core infrastructure. |
| Custom lint/review scripts | `Keep with generalization` | Retain only if they enforce reusable standards rather than Currento-only habits. |
| Localisation baseline | `Keep` | Preserve minimal English locale structure and locale-driven metadata/content patterns. |
| Demo and sample app content | `Keep with generalization` | Replace finance-specific examples with generic starter content. |
| Root markdown files | `Keep with generalization` | Move non-`README.md` markdown docs into `docs/` in the extracted boilerplate and let `README.md` point to them. |
| Boilerplate homepage | `Keep with generalization` | Reduce app routes to a single localized welcome page for the baseline starter. |
| Baseline color system | `Keep with generalization` | Default to a neutral grayscale gradient that can be replaced later. |
| General app layout | `Keep` | Preserve the overall layout structure used by the app shell. |
| Responsive navigation | `Keep` | Preserve side navigation on desktop and bottom navigation on mobile. |
| Card, button, and icon system | `Keep` | Keep these as core reusable UI building blocks in the starter. |
| Settings controls | `Keep` | Keep language and appearance controls on the settings page. |

## MCP And Agent Tooling Review

Default assumption: **the boilerplate should be tool-agnostic, with agent-oriented guidance only when it improves maintainability without locking the starter to one environment.**

Review these items explicitly:

| Item | Default direction | Questions to answer |
| --- | --- | --- |
| `AGENTS.md` in the boilerplate | `Keep with generalization` | Does a generalized repo guide help all collaborators, or only Codex-style workflows? |
| Repo-specific skills and process docs | `Remove` | Are any of these reusable enough to document generically, or are they project-maintenance artifacts? |
| Prompt or connector-oriented files | `Remove` | Do they belong in a template, or should they stay outside the starter entirely? |
| Codex-first vs MCP-compatible vs tool-agnostic setup | `Tool-agnostic` | Which guidance is universally helpful, and which creates unnecessary coupling? |

Additional review prompts:

- Does this setup assume a specific assistant, editor, or connector runtime?
- Would a new project owner understand and benefit from it without using Codex or MCP?
- Can the value be preserved as plain documentation instead of environment-specific wiring?
- If a repo-level agent file stays, can it live as a neutral collaborator guide rather than a tool-locked workflow file?

## Open Questions

Use this section to capture unresolved decisions during later review passes:

- What should the minimal starter schema contain, if any beyond a basic example model?
- Should the icon set stay broad, or be trimmed to only generic starter needs?
- Should `QUICKSTART.md` remain separate from `README.md` in the extracted repo?
- Which custom lint and review rules are strong boilerplate defaults versus Currento-specific guardrails?
- Is there any MCP or agent-facing file that is worth keeping in a neutral, non-tool-locked form?
- Which `src/components` entries are truly general-purpose enough to survive the boilerplate cut?

## Final Extraction Checklist

Use this checklist only after the workbook decisions are complete:

- Confirm every review item above has a final status and rationale.
- Confirm user account handling, email-and-code login, settings, and avatar support are preserved through the extraction.
- Confirm finance-domain workflows are either removed or intentionally moved into optional modules.
- Confirm starter docs no longer describe Currento as the target product.
- Confirm non-`README.md` markdown documentation is relocated under `docs/` in the extracted boilerplate.
- Confirm Prisma, TypeScript, Next.js, styling, and localization baseline decisions are consistent across docs and config.
- Confirm optional modules are documented clearly enough to be added later without repo archaeology.
- Confirm MCP and agent-tooling decisions are explicit rather than implied.
- Confirm `src/elements` extraction includes every dependency required by the kept primitives.
- Confirm the starter app surface is reduced to a single localized welcome route plus retained user flows.
- Confirm extraction work is scheduled in separate implementation changesets after the review is complete.
