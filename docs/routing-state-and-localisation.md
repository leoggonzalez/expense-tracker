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

## Dynamic Authenticated Pages

Pages that render authenticated, user-specific data must not rely on static rendering defaults.

Treat these kinds of pages as per-request and dynamic:

- account pages
- dashboard pages
- projection pages
- settings pages
- space pages
- transaction pages

The goal is to avoid any cross-user leakage of personalized data.

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
- Is the page rendering authenticated data in a dynamic-safe way?
- Does all user-facing copy come from locale messages?
- Are new locale keys semantic and `lower_snake_case`?
