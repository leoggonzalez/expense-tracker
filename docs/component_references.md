# Component References

## Required Sources

For every new feature and component refactor, read the [nerdgeschoss component guideline](https://nerdgeschoss.de/handbook/nuts/components/) and check the [Shimmer showcase](https://nerdgeschoss.github.io/shimmer-components-static/) for suitable existing structures before creating UI from scratch. The guideline links to the [Shimmer source repository](https://github.com/nerdgeschoss/shimmer-components).

The guideline defines component architecture. Shimmer supplies reusable implementation patterns. Currento supplies the visual design: preserve its colors, typography, spacing, responsive behavior, and component styling wherever possible. A structural refactor is not authorization for a visual redesign.

## Applying The Guideline In Currento

- Compose pages from components and primitives; pages own data orchestration and have no stylesheets.
- Presentational components receive data and application state through props and expose callbacks. Keep API calls, mutations, and application state in route or controller composition. Interactive components may own local UI state and necessary DOM synchronization.
- Keep the existing hybrid protected-shell architecture: client controller components can fetch through authenticated private route handlers. Extract their presentation rather than moving every fetch to a server page. Preserve authentication, ownership checks, and private caching boundaries.
- Export one function-declaration component per component file, with an explicit `React.ReactElement` return type. Declare props with an interface and accept only necessary data fields.
- A styled component owns a matching snake_case folder, TSX file, and SCSS file with one corresponding BEM block. Components without custom styles need no empty SCSS file. Existing asset folders and shared support files remain supported; separate exported UI components when touched.
- Keep shared primitives in `src/elements`; composed UI and controller components belong in `src/components`. These locations are Currento's adaptation of the upstream `src/components` layout.
- Prefer Stack, Box, Grid, and Text for composition. Component-owned layout CSS remains appropriate for complex presentation where wrappers add no value. Extract a new shared primitive after the same need appears independently in three places; adapt an existing suitable library primitive first.
- Keep decorative borders and backgrounds in their owning component rather than expanding Box into a decoration API. Choose semantic text elements explicitly, independently of appearance.
- Model loading, error, and empty states alongside loaded content. Controllers pass these states and retry callbacks into presentation. Preserve static section chrome during loading.
- Follow component-owned BEM, mobile-first styles, token colors without literal fallbacks, accessible controls, keyboard operation, focus management, and localized labels. Use SVG or WebP for new image assets, meaningful alt text for content, and hide decorative icons from assistive technology.
- Icon is presentational; use a button or link for interaction. Icon-only buttons require a localized `label` mapped to `aria-label`. Pass explicit icon sizes. Use `:focus-visible`, gate hover effects with `@media (hover: hover)`, and account for mobile touch targets, input zoom, and safe areas where relevant.
- Keep page copy in feature-specific locale namespaces, adding English entries before use. Use the existing localization runtime and formatting helpers until the planned formatting audit identifies the canonical locale-aware Formatter API.
- React Compiler remains enabled: derive values during render and avoid manual memoization unless justified. The upstream mention of `useMemo` does not replace this project rule.

Currento's checked-in design tokens and existing UI are the visual baseline. Use supplied issue/Figma specifications when available; this policy does not require creating a Figma export pipeline or replacing the current theme. Existing documented internal CSS-variable plumbing in Card and loading primitives remains a compatibility exception until reviewed during migration; do not expand it to feature components.

## Currento Primitive APIs

The first migration adopts the guideline's structure with Currento's existing visual tokens:

- `Stack`: vertical by default; `line`, `lineTablet`, and `lineDesktop` select horizontal layouts. Alignment uses `start`/`end`; responsive gap, alignment, justification, and wrapping inherit through the existing tablet and desktop breakpoints.
- `Box`: padding accepts a number or `{ vertical, horizontal, top, right, bottom, left }`. An explicit side takes precedence over its axis. Tablet and desktop overrides inherit unspecified sides and allow explicit zero values. Decoration stays component-owned.
- `Text`: `type` selects a typed token variant and optional weight suffix, such as `body`, `caption-medium`, or `h2-bold`. `element` independently selects semantic HTML and defaults to `div`. Existing consumers were migrated with explicit elements to preserve their previous markup.
- Typography variants map to existing sizes: `fine` → `xs`, `caption` → `sm`, `body` → `md`, `lead` → `lg`, `title` → `xl`, `display` → `2xl`; `h1` through `h4` retain their existing scales. The suffixes are `medium`, `semibold`, and `bold`; no suffix means normal weight.
- `Currency`: forwards `type` and `element` to Text, preserving its existing formatting and sign colors.
- `Modal`: owns native dialog synchronization, an accessible label, Escape/backdrop closing, and the dialog surface. Confirmation content and actions belong to `ConfirmDialog`. Currento retains its centered dialog treatment rather than adopting the showcase's sheet theme or global presenter.

These implementations adapt verified structural patterns without copying upstream source wholesale or adding runtime dependencies.

## Adapting Shimmer Source

The showcase was inspected on 2026-10-21. Its deployed bundle includes readable TSX/SCSS source strings, file lists, dependencies, linked files, demos, and a source-copy control. Source is extractable without reverse-engineering compiled React rendering code. Verified examples include Box, Stack, Text, Button, Card, form fields, Modal, and Collapse. The deployed catalog also contains Icon, although the handbook says Icon and Grid are not yet included: inspect current source rather than assuming the catalog and prose are synchronized.

For each adaptation:

1. Check the existing Currento component and the matching showcase entry. Reuse or evolve the current component before creating a duplicate.
2. Inspect the entry's source files, dependencies, and linked files. Prefer canonical repository source when accessible, or the showcase's readable source tabs. Record the source URL and revision when available, otherwise the inspection date, plus any applicable license/attribution when copying code.
3. Adapt markup, prop boundaries, composition, and suitable behavior into local files. Keep Currento SCSS and tokens, changing styles only where the structure requires it and verifying the result visually.
4. Normalize alias imports, interfaces, component exports, localization, server/client boundaries, and styling ownership. Do not copy sample hardcoded colors, relative imports, inline feature styles, or clickable Icon behavior that conflicts with the guideline.
5. Inspect dependencies before introducing them. The showcase contains project-specific generated text types, icon assets, media mixins, and form dependencies that may need local equivalents. Do not install an unrelated package named Shimmer or assume this catalog is a drop-in npm dependency.
6. Check responsive layout, semantic HTML, focus, keyboard behavior, loading/error/empty states, and affected business flows. Document intentional API differences.

When the upstream guideline and showcase disagree, follow the guideline for architecture and the explicit Currento integration rules above. Document new deliberate exceptions here rather than silently copying incompatible patterns. If remote references are temporarily unavailable, use this checked-in policy and existing local components, and disclose which upstream source could not be verified.
