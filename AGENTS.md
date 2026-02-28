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

export function Navigation(
  props: NavigationProps,
): React.ReactElement {
  return <nav />;
}
```

## Localization Conventions

- `locales/en.json` is the canonical source for English UI copy.
- All user-facing text must come from locale messages instead of hardcoded JSX strings, page metadata strings, or other inline literals.
- New features must add their strings to `locales/en.json` before using them.
- The repository will adopt a formal i18n runtime later, but new hardcoded UI strings are already prohibited.

Message key rules:

- Use feature-based namespaces such as `navigation.dashboard`, `navigation.projection`, and `dashboard.current_month_overview`.
- Use `lower_snake_case` for leaf keys.
- Prefer semantic names over literal text fragments.

Future localization contract:

- Source message file: `locales/en.json`
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

Known gaps in the current codebase:

- Component and model filenames are currently mostly PascalCase.
- Several files still use relative internal imports.
- Many components use `React.FC` and arrow-function exports.
- UI copy and metadata strings are currently hardcoded.
- No i18n runtime is present today.

## Exceptions and Framework Constraints

- Next.js special files such as `page.tsx` and `layout.tsx` keep their framework-required names.
- Prisma files follow Prisma conventions.
- Temporary exceptions must be documented in the relevant change description and must not be introduced silently.

## Review Scenarios

Use these scenarios when reviewing future changes against this document:

- A new component author should be able to determine the correct filename, import style, and component signature without making additional decisions.
- A contributor touching an old PascalCase component should be able to determine whether to rename it in the same change or defer it into a dedicated migration.
- A contributor adding new UI text should be able to determine that hardcoded strings are disallowed and that the English source belongs in `locales/en.json`.
- A contributor working in `src/app/layout.tsx` should be able to distinguish between a framework exception such as `layout.tsx` and a non-exception such as hardcoded metadata strings.

## Assumptions and Defaults

- This file is the canonical repo-level standard instead of `CODE_GUIDELINES.md` or `docs/code_guidelines.md`.
- This phase defines both the rules and the migration policy.
- `locales/en.json` is standardized now, but the i18n runtime choice is intentionally deferred.
- The function-over-arrow preference applies to exported components and shared helpers, not every inline callback.
- Full compliance is phased through touched-file migration and dedicated cleanup changes.
