# Routing, State, And Localisation

This chapter defines how page state should live in the URL, how authenticated pages should render, and how user-facing copy should be managed.

## URL-Driven Page State

Page-level filter, search, sort, and pagination state that materially changes page content must live in the query string.

That means:

- pages read initial filter state from the URL
- control changes update the URL
- reload and bookmark preserve the same result set
- back and forward navigation preserve the same result set
- clear-filter actions reset both the controls and the related query params

This is especially important on dashboard-adjacent listing pages such as transactions, projections, and other filterable screens.

## Protected Page Rendering

Protected pages that embed authenticated, user-specific data directly in the server-rendered shell must remain per-request and dynamic.

Protected pages may use a hybrid shell instead when all of the following are true:

- the route shell itself contains no user-specific values
- personalized data is fetched after mount through authenticated per-user boundaries such as route handlers
- server responses for that personalized data are private and non-cacheable
- the shell remains useful immediately with static titles, descriptions, icons, and actions

This pattern is preferred when the goal is faster-feeling client navigation across protected pages without risking cross-user leakage.

## Localisation Rules

- `src/locales/en.json` is the canonical source for English UI copy.
- All user-facing text should come from locale messages rather than hardcoded JSX strings, metadata strings, or other inline literals.
- New features add English strings first, then use them in the UI.

Message key rules:

- use feature-based namespaces such as `navigation.dashboard`
- use `lower_snake_case` for leaf keys
- prefer semantic names over literal text fragments

Examples:

- `dashboard.current_month_overview`
- `transactions_page.clear_filters`
- `auth.verify_failed`

## Current Localisation State

Currento already maintains locale files under `src/locales/` with English as the source of truth and translated siblings alongside it. The runtime can evolve later, but the discipline of externalized copy is already part of the codebase standard.

## Review Checklist

- Does filter/search/sort state live in the URL?
- Does the page preserve state through reloads and browser navigation?
- Is the page either dynamic-safe or using the approved hybrid protected-shell pattern?
- Does all user-facing copy come from locale messages?
- Are new locale keys semantic and `lower_snake_case`?
