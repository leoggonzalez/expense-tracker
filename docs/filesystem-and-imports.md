# Filesystem And Imports

This chapter defines how files are named, where they live, and how code should reference them.

## Naming Rules

- All new filenames must use `snake_case`.
- React component directories and component files must both use `snake_case`.
- SCSS files paired to components must use the same basename as the component file.
- Type, interface, and type-alias names stay PascalCase in code.
- React component identifiers stay PascalCase in code even when the file is `snake_case`.

Examples:

- `src/components/navigation/navigation.tsx`
- `src/components/navigation/navigation.scss`
- `src/app/(protected)/transactions/page.tsx`

## Framework Exceptions

Next.js special files keep their framework-required names:

- `page.tsx`
- `layout.tsx`
- `route.ts`
- `error.tsx`
- `global-error.tsx`
- `loading.tsx`
- `not-found.tsx`
- `icon.tsx`
- `apple-icon.tsx`

Prisma files also keep Prisma conventions.

## Directory Ownership

- `src/app` is for route entrypoints, data loading, layouts, and page composition.
- `src/components` is for reusable rendered UI sections and composed interface pieces.
- `src/elements` is for shared primitives such as `Box`, `Stack`, `Grid`, `Card`, `Text`, and `Icon`.
- `src/lib` is for shared non-visual helpers and server/data abstractions.
- `src/actions` is the server-action surface, not the primary home for table-specific query logic.
- `src/styles` is for global shared styling and tokens.
- `src/locales/en.json` is the canonical source for English UI text.

## Import Rules

- Internal imports must use the `@/` alias whenever the target resolves under `src/`.
- Relative imports are allowed only when `@/` cannot express the import cleanly because the target is outside `src/` or a framework convention requires a local relative path.
- Barrel files may remain temporarily, but imports from them must also use `@/`.

Preferred:

```ts
import { Stack } from "@/elements";
import { Navigation } from "@/components";
```

Not preferred:

```ts
import { Stack } from "../../elements";
import { Navigation } from "../navigation/navigation";
```

## Filesystem Cleanup Guidance

When normalizing older code:

- Rename only the files needed for the current scope unless the task is explicitly repo-wide.
- Normalize imports immediately after a rename.
- Do not mix broad rename waves into unrelated product work.
- Remove or relocate route-owned SCSS under `src/app`.

## Review Checklist

- Is every new non-framework file in `snake_case`?
- Does each shared component own a matching SCSS basename?
- Are internal `src/` imports using `@/`?
- Is route composition staying in `src/app` and reusable UI staying in `src/components`?
