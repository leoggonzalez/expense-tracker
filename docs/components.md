# Components

This chapter covers React component conventions, public component APIs, and the boundary between route composition and reusable UI.

## Component Signature Rules

- Prefer function declarations over arrow-function components.
- Exported React components must declare the return type as `React.ReactElement`.
- Do not use `React.FC`.
- Props must be declared with an explicit `type` or `interface`.
- Local helper callbacks inside components may still use arrow functions when that is the clearest option.

Canonical shape:

```tsx
type NavigationProps = {
  currentPath: string;
};

export function Navigation(props: NavigationProps): React.ReactElement {
  return <nav />;
}
```

## React Compiler And Effects

React Compiler is enabled repo-wide in Next.js experimental config. Write components with that assumption:

- Do not add `useMemo`, `useCallback`, or `React.memo` by default.
- Keep manual memoization only when there is a proven reason the compiler does not cover, and document that reason inline.
- Treat `useEffect` as an escape hatch.

Before adding an effect, prefer:

- deriving values during render
- moving logic into event handlers
- lifting data loading into route or server composition
- using URL search params or framework state when appropriate

Legitimate effects are limited to external synchronization such as DOM listeners, timers, browser storage, `matchMedia`, or unavoidable async synchronization.

## Component API Boundaries

- Components under `src/components/*` must not expose `style` or `className` props.
- Shared primitives under `src/elements/*` must not expose public `style` or `className` props either.
- Layout, spacing, and presentation should be expressed through semantic props, internal markup, and internal SCSS classes.
- Components should not accept one-off contextual props that only make sense inside a single parent. Prefer reusable semantics like `size`, `tone`, `compact`, or `align`.

## Route Composition Rules

- Route files may compose shared components and primitives directly.
- Do not create components whose purpose is to represent or style an entire route screen.
- Components ending in `_page` are prohibited.
- Reusable sections that have their own markup and styling should live in `src/components`, even if they are currently used only once.

Preferred page composition:

```tsx
import { Hero, TransactionsFilters, TransactionsTable } from "@/components";
import { Card, Stack } from "@/elements";

export default async function Page(): Promise<React.ReactElement> {
  return (
    <Stack gap={24}>
      <Hero icon="transactions" title="Transactions" pattern="transactions" />
      <Card padding={24}>
        <TransactionsFilters />
      </Card>
      <Card padding={24}>
        <TransactionsTable />
      </Card>
    </Stack>
  );
}
```

## Shared Primitive Preference

When the need is structural rather than bespoke:

- use `Stack` for flex layout, wrapping, and alignment
- use `Box` for padding, width, and constrained containers
- use `Grid` for general grid layout
- use `Text` for typography semantics when the style is not component-specific

## Review Checklist

- Is the exported component a function declaration with `React.ReactElement`?
- Does it use explicit props typing?
- Is it avoiding `React.FC`?
- Is it a reusable section rather than a full-screen route wrapper?
- Is the component API semantic and self-owned?
