# Repo Coding Guidelines

This file is the canonical source of truth for coding conventions in this repository.

New code must follow these rules immediately. Existing code that does not comply should be updated when touched for feature work or refactors unless the required migration would make the change disproportionately large. In those cases, follow the migration policy in this document and isolate the cleanup into a dedicated follow-up change.

## Naming Conventions

- All new filenames must use `snake_case`.
- React component directories and component files must both use `snake_case`.
- SCSS files paired to components must use the same basename as the component file.
- Type, interface, and type-alias names stay PascalCase in code.
- React component identifiers stay PascalCase in code even when the file is `snake_case`.

Examples:

- `src/components/navigation/navigation.tsx`
- `src/components/navigation/navigation.scss`
- `src/app/entries/all/page.tsx` remains valid because Next.js route filenames are framework-defined and should remain framework-compliant.

## Import Conventions

- Internal imports must use the `@/` alias whenever the target resolves under `src/`.
- Relative imports are allowed only when `@/` cannot express the import cleanly because the target is outside `src/` or a framework convention requires a local relative path.
- Barrel files may remain temporarily, but imports from them must also use `@/`.

Examples:

Preferred:

```ts
import { Container } from "@/components";
```

Not preferred:

```ts
import { Container } from "../Container/Container";
```

## React Component Conventions

- Prefer function declarations over arrow-function components.
- Exported React components must declare the return type as `React.ReactElement`.
- Do not use `React.FC` for component typing.
- Props must be declared with an explicit `type` or `interface`.
- Local helper callbacks inside components may use arrow functions when that is the clearest option. The function-declaration preference applies primarily to exported components and shared helpers.

Canonical example:

```tsx
type NavigationProps = {
  // props here
};

export function Navigation(props: NavigationProps): React.ReactElement {
  return <nav />;
}
```

## Styling And Composition Conventions

- All component styling must be mobile-first. Base styles target phones first, then layer larger-screen adjustments with media queries.
- The only standard responsive breakpoints are:
  - tablet: `min-width: 768px`
  - desktop: `min-width: 1280px`
- Prefer flat-design UI treatments across the app. Avoid heavy shadows, glassmorphism, decorative gradients, and lift-on-hover effects unless a change documents a clear exception.
- Do not use inline styling in JSX or TSX. Avoid patterns such as `style={{ ... }}` and other inline style props.
- The only allowed inline-style exception is declaring CSS custom properties inside shared layout primitives. This exception is for primitives such as `Stack`, `Box`, and `Grid`, not for page or feature components.
- If layout, spacing, or presentation is needed, express it through component markup and SCSS classes, not inline style objects or page-local wrapper styling.
- Use the shared layout primitives for general layout work:
  - `Stack` for flex layout and wrapping
  - `Box` for box layout with padding and max-width controls
  - `Grid` for CSS grid layout
- Prefer component-owned SCSS files paired with the component that owns the markup.
- `src/app` is for route entrypoints, data loading, and composition. Route files such as `page.tsx` and `layout.tsx` should compose components instead of owning presentational UI sections.
- Reusable or rendered UI sections with their own markup and styling must live under `src/components`, even when they are currently used by only one route.
- Do not add new `.scss` files under `src/app`. Non-global styling belongs in `src/components/<component>/<component>.scss`.
- Global application styles imported from `src/styles` remain valid. The prohibition applies to page-local SCSS under `src/app`, not shared global styles.

## Validation Conventions

- Do not run a full production build after every change by default. Frequent `yarn build` runs interrupt the live development process and should be reserved for meaningful checkpoints.
- Prefer validating with the smallest relevant check while iterating, then run broader validation once a coherent batch of work is ready.
- Use `yarn build` for final verification before handoff, when changing routing/build-sensitive behavior, or when investigating a production-only issue.

## Routing And State Conventions

- Page-level filter, search, sort, and pagination state that materially changes page content must live in the URL query string.
- Pages with filterable content must read their initial state from the URL and update the URL when filters change.
- Reload, bookmark, and browser back/forward navigation must preserve the same filtered result set.
- “Clear filters” actions must reset both the visible controls and the related query parameters.
- Pages that render authenticated, user-specific data must not rely on static rendering defaults. Treat account, entry, dashboard, projection, and settings pages as per-request/dynamic pages to avoid cross-user data leakage.

Examples:

Preferred:

```tsx
// src/app/entries/all/page.tsx
import { AllEntriesPage } from "@/components/all_entries_page/all_entries_page";

export default function Page(): React.ReactElement {
  return <AllEntriesPage />;
}
```

```text
src/components/entry_list/entry_list.tsx
src/components/entry_list/entry_list.scss
src/components/all_entries_page/all_entries_page.tsx
src/components/all_entries_page/all_entries_page.scss
```

Not preferred:

```tsx
<div style={{ display: "grid", gap: "32px" }} />
```

```tsx
function EntriesPage(): React.ReactElement {
  return (
    <Grid minColumnWidth={320} gap={32}>
      <Box className="entries-page__section">
        <EntryForm />
      </Box>
      <Box className="entries-page__section">
        <BulkEntryForm />
      </Box>
    </Grid>
  );
}
```

```text
src/app/entries/entry_list.tsx
src/app/entries/entry_list.scss
src/app/entries/all/all_entries_page.tsx
src/app/entries/all/all_entries_page.scss
```

## Localization Conventions

- `src/locales/en.json` is the canonical source for English UI copy.
- All user-facing text must come from locale messages instead of hardcoded JSX strings, page metadata strings, or other inline literals.
- New features must add their strings to `src/locales/en.json` before using them.
- The repository will adopt a formal i18n runtime later, but new hardcoded UI strings are already prohibited.

Message key rules:

- Use feature-based namespaces such as `navigation.dashboard`, `navigation.projection`, and `dashboard.current_month_overview`.
- Use `lower_snake_case` for leaf keys.
- Prefer semantic names over literal text fragments.

Future localization contract:

- Source message file: `src/locales/en.json`
- Message key style: feature-based `lower_snake_case`
- Future runtime integration must read from that file or a compatible structure

## Migration Policy

- New files must be compliant immediately.
- Existing files should be made compliant when they are edited for feature work or refactors.
- Avoid broad mechanical renames mixed into unrelated product changes.
- Large migrations must be split into dedicated follow-up changesets grouped by concern.

Recommended migration groupings:

- filename normalization
- import normalization
- component signature normalization
- localization rollout
- styling normalization
- app-to-components extraction

Known gaps in the current codebase:

- Component and model filenames are currently mostly PascalCase.
- Several files still use relative internal imports.
- Many components use `React.FC` and arrow-function exports.
- UI copy and metadata strings are currently hardcoded.
- No i18n runtime is present today.
- Some route files still use inline JSX `style` props.
- Some presentational UI and SCSS still live under `src/app`.
- `entry_list` and `all_entries_page` should be extracted into `src/components` when touched for related work.
- `src/app/entries/page.tsx` currently uses inline styles and should move that presentation into component classes.
- `src/app/entries/entry_list.tsx` and `src/app/entries/all/all_entries_page.tsx` currently behave like components and should not remain under `src/app`.
- `src/elements/stack/stack.tsx` and `src/elements/box/box.tsx` still rely on inline styles internally and should be normalized to CSS custom properties only.

## Exceptions and Framework Constraints

- Next.js special files such as `page.tsx` and `layout.tsx` keep their framework-required names.
- Prisma files follow Prisma conventions.
- Temporary exceptions must be documented in the relevant change description and must not be introduced silently.

## Review Scenarios

Use these scenarios when reviewing future changes against this document:

- A new component author should be able to determine the correct filename, import style, and component signature without making additional decisions.
- A contributor touching an old PascalCase component should be able to determine whether to rename it in the same change or defer it into a dedicated migration.
- A contributor adding new UI text should be able to determine that hardcoded strings are disallowed and that the English source belongs in `src/locales/en.json`.
- A contributor working in `src/app/layout.tsx` should be able to distinguish between a framework exception such as `layout.tsx` and a non-exception such as hardcoded metadata strings.
- A contributor adding spacing or layout to a page should be able to determine that inline `style` props are disallowed and that layout belongs in component classes.
- A contributor creating a rendered UI block under `src/app` should be able to determine that it belongs in `src/components`.
- A reviewer should be able to reject a page-local `.scss` file under `src/app` unless it is a documented framework exception.
- A contributor needing flex, box, or grid layout should be able to choose `Stack`, `Box`, or `Grid` instead of adding ad hoc inline styles.
- A contributor creating a responsive component should be able to determine that phone styles come first, tablet changes begin at `768px`, and desktop changes begin at `1280px`.

## Assumptions and Defaults

- This file is the canonical repo-level standard instead of `CODE_GUIDELINES.md` or `docs/code_guidelines.md`.
- This phase defines both the rules and the migration policy.
- `src/locales/en.json` is standardized now, but the i18n runtime choice is intentionally deferred.
- The function-over-arrow preference applies to exported components and shared helpers, not every inline callback.
- Full compliance is phased through touched-file migration and dedicated cleanup changes.
