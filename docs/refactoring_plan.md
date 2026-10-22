# App-Wide Refactoring Plan

Branch: `refactoring`

## Goal And Scope

Align Currento with the [nerdgeschoss component guideline](https://nerdgeschoss.de/handbook/nuts/components/) and prefer adaptable structures from the [Shimmer showcase](https://nerdgeschoss.github.io/shimmer-components-static/), preserving Currento's custom styling wherever possible. Apply the [component reference policy](./component_references.md) to all subsequent feature work.

The branch now includes the baseline audit and first implementation batch described in [the refactoring audit](./refactoring_audit.md). Preserve business behavior, localization, URL state, authentication, ownership checks, and data privacy throughout.

## 1. Establish The Baseline

- Run the full lint/type gate and both page/primitives reviews; record existing failures before changing runtime code.
- Inventory components, primitives, controller/fetch boundaries, prop definitions, styles, formatting helpers, and exports. Identify duplicate presentation and files exporting multiple components.
- Capture representative current screens and important loading/error/empty states at mobile and desktop sizes, including light/dark themes where supported.
- Produce a component mapping with current component, Shimmer candidate/source, structural differences, dependencies, styling to retain, affected consumers, and migration order. Do not treat the initial candidates below as approved drop-in replacements.

## 2. Align Shared Primitives

Start with Stack, Box, and Text; review Card, Grid, and Icon alongside them. Compare upstream structure with existing APIs before choosing compatibility adapters or deliberate consumer migrations. Keep tokens, semantics, breakpoints, and current visual output stable. Avoid introducing a second primitive system.

The first batch migrated Stack to `line` and responsive props, Box to axis/side padding, and Text/Currency to `type` and `element` across their consumers. Existing typography tokens and semantic elements were preserved. Grid, Card, and Icon retain their current APIs pending their separate review.

Deliver one coherent primitive batch with its consumers and verification; remove compatibility props only after the last consumer has migrated.

## 3. Refactor Shared Controls

Compare Button, Checkbox, Select, inputs, ContextMenu, and ConfirmDialog with corresponding Shimmer Button, field, and Modal structures. Treat matches as candidates, retaining local behavior where the upstream API is unsuitable. Review all linked dependencies before copying a field implementation.

Keep form validation, submission, disabled/loading behavior, keyboard interactions, focus return, labels, and localized errors working. Implement or improve missing interaction primitives only where an actual app need exists.

## 4. Separate Feature Orchestration And Presentation

Migrate one vertical slice at a time: transactions first, then spaces, dashboard/projections, and account/settings/auth flows. Confirm this order against the baseline dependency map.

Keep fetches, mutations, URL state, and retries in route/controller composition. Extract presentation with narrow interfaces and explicit state props. Replace wrapper-only page components with direct composition where appropriate. Centralize currency/date/percentage formatting behind the audited locale-aware API without changing financial calculations or date semantics.

Complete and validate each slice before continuing. Keep broad mechanical renames and unrelated cleanup in separate changesets.

## 5. Enforce And Close Out

- Audit custom lint rules against the new standards, particularly interface-only component props and one exported component per file. Update rules with meaningful fixtures when needed; documentation alone does not enforce these changes.
- Run the full lint/type gate, page/primitives reviews, and a production build at the final checkpoint.
- Verify affected flows, mobile/desktop layouts, keyboard and focus behavior, supported browser differences, and visual comparison with the baseline. Report any browser/platform coverage unavailable in the current environment.
- Remove superseded components, adapters, exports, styles, and dependencies after confirming no consumers remain. Update documentation and any guidance that still describes the old architecture.

## Completion Criteria

The inventory has no unresolved migration items or undocumented exceptions; shared UI uses suitable Shimmer-derived structures where they fit; presentation and application concerns have clear ownership; required checks pass or pre-existing failures are explicitly accounted for; representative flows and visuals match the preserved Currento behavior and design.
