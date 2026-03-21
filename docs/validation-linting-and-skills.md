# Validation, Linting, And Skills

This chapter documents the repo checks that keep Currento consistent and the cleanup skills that emerged from the codebase's recurring pain points.

## Validation Philosophy

- Do not run a full production build after every small change.
- Prefer the smallest relevant check while iterating.
- Run broader verification when a coherent batch is ready or when routing and build-sensitive behavior changes.

## Core Scripts

From `package.json`:

- `yarn lint`: runs the full repo validation entrypoint
- `yarn lint:eslint`: runs ESLint with custom local rules
- `yarn lint:repo`: runs repository rule checks that go beyond ESLint
- `yarn lint:types`: runs `tsc --noEmit`
- `yarn review:page-primitives`: reviews wrapper-like page components
- `yarn review:prefer-primitives`: reviews custom layout and typography that may be better expressed with primitives
- `yarn format`: runs Prettier over app source and markdown in `src/`
- `yarn build`: reserved for meaningful checkpoints rather than every small iteration

## Custom ESLint Rules

Currento uses `next/core-web-vitals` and `next/typescript`, plus custom rules in `eslint-rules/`.

Enforced rules:

- `internal-import-alias`: internal imports under `src/` must use `@/`
- `no-react-fc`: disallows `React.FC` and `FC`
- `component-export-style`: prefers exported function declarations over arrow-function components
- `component-return-type`: requires explicit `React.ReactElement` return types on exported components
- `component-props-shape`: requires explicit named props types or interfaces
- `no-inline-style-prop`: disallows inline `style` props outside approved exceptions
- `no-disallowed-component-props`: blocks `style` and `className` props on shared components and elements
- `no-page-component-name`: blocks route-like wrapper components such as `*_page`
- `no-hardcoded-ui-strings`: warns on user-facing copy that should move into locales
- `warn-use-effect`: warns when `useEffect` appears and prompts review instead of automatic acceptance

## Repo Rule And Review Scripts

### `scripts/lint/check_repo_rules.mjs`

This repo-level checker covers conventions that are awkward to express through ESLint alone, such as:

- filesystem naming expectations
- SCSS placement rules
- locale key shape checks
- repo-specific structure rules

### `scripts/review/page_primitive_review.mjs`

This review highlights components that are mostly thin page wrappers and may be better replaced by direct primitive composition in the route.

### `scripts/review/prefer_primitives_review.mjs`

This review highlights structural CSS that may be better expressed through `Box`, `Stack`, `Grid`, or `Text`.

## Pain Points We Learned To Fix

The current skill set is a direct map of recurring cleanup categories in this repo:

- React signature drift
- Styling ownership drift
- Hardcoded UI strings
- File and directory naming inconsistency
- Hardcoded color literals
- Wrapper components that should just be route composition
- Structural CSS that should use shared primitives
- Cross-component SCSS ownership leaks

## Cleanup Skills And What They Fix

### `cleanup-react`

Use when fixing:

- relative imports under `src/`
- `React.FC`
- arrow-function exported components
- missing `React.ReactElement` return types
- missing explicit props types
- unnecessary memoization
- questionable `useEffect` usage that needs review

### `cleanup-styling`

Use when fixing:

- inline `style` props
- `className` and `style` props on shared components
- route-owned SCSS under `src/app`
- SCSS basename mismatches
- hardcoded color literals in UI styling

### `cleanup-localisation`

Use when fixing:

- hardcoded user-facing strings
- hardcoded metadata strings
- missing English source entries in `src/locales/en.json`
- locale keys that do not follow semantic `lower_snake_case`

### `cleanup-filesystem-naming`

Use when fixing:

- non-framework files or directories not in `snake_case`
- SCSS files placed under `src/app`
- mismatched component and SCSS basenames
- broken imports after renames

### `cleanup-page-primitive-review`

Use to review whether a component is mostly a route wrapper and should be replaced by direct route composition.

### `prefer-primitives`

Use to review whether custom structural CSS should be replaced by:

- `Box`
- `Stack`
- `Grid`
- `Text`

### `color-variable-normalization`

Use when replacing literal colors in SCSS, TSX, JSX, SVG helpers, and icon code with shared CSS variables or theme tokens.

### `component-style-boundaries`

Use when one component's SCSS reaches into another component's styling and the ownership needs to move back into the styled component through semantic props.

### `quick-cleanup`, `partial-cleanup`, and `full-cleanup`

These orchestrate cleanup scope:

- `quick-cleanup`: current uncommitted files
- `partial-cleanup`: branch diff or PR scope
- `full-cleanup`: repo-wide cleanup

They batch findings by concern and apply the focused sub-skills deliberately rather than mixing cleanup into arbitrary product edits.

## Recommended Validation Flow

For routine work:

1. Run the smallest relevant lint or type check for the touched area.
2. Run `yarn lint:types` after TypeScript-facing refactors.
3. Run repo or review scripts when working on naming, styling, or primitive-composition concerns.
4. Use `yarn build` for final checkpoints, routing-sensitive changes, or production-only investigation.
