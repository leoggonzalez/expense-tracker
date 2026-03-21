# Styling And Primitives

This chapter defines Currento's styling system, component ownership rules, and layout primitive preferences.

## Styling Direction

- All component styling must be mobile-first.
- Base styles target phones first, then larger breakpoints are layered in.
- Standard responsive breakpoints are:
  - tablet: `min-width: 768px`
  - desktop: `min-width: 1280px`
- Prefer flat-design UI treatments across the app.
- Avoid heavy shadows, glassmorphism, decorative gradients, and lift-on-hover effects unless the exception is deliberate and documented.

## Ownership Rules

- Prefer component-owned SCSS files paired with the component that owns the markup.
- Do not add new `.scss` files under `src/app`.
- Non-global styling belongs in `src/components/<component>/<component>.scss`.
- Global styles and token files may continue to live under `src/styles`.

## Inline Style Rules

- Do not use inline styling in JSX or TSX.
- The only approved inline-style exception is internal CSS custom property plumbing inside shared primitives such as `Stack`, `Box`, `Grid`, and `Card`.
- That exception is internal implementation detail only, never a public `style` prop escape hatch.

Not preferred:

```tsx
<div style={{ display: "grid", gap: "32px" }} />
```

## Component Boundary Rules

- Components must own their own styling.
- One component's SCSS should not target another component's root class, descendants, or modifiers.
- Avoid selectors that exist only to restyle another component in one context.
- If a variation is needed, move that styling ownership back into the styled component and express it through a semantic prop.

## Primitive Preference

Prefer shared primitives for common structure:

- `Stack` for standard flex layout and wrapping
- `Box` for padding, max-width, and box layout
- `Grid` for CSS grid layout
- `Text` for semantic typography

Do not force primitives where a component needs custom visual behavior beyond the primitive contract.

## Color And Token Rules

- Hardcoded presentation colors should be replaced with CSS custom properties where possible.
- Prefer semantic variables over branding-by-hex literals.
- If a real brand token is missing, add a proper token in the shared token source rather than leaving a literal value in UI code.
- This applies to SCSS and UI code such as inline SVG helpers or icon components.

## Review Checklist

- Is the styling mobile-first?
- Does the component own its SCSS?
- Are there any inline `style` props outside primitive internals?
- Are layout rules better expressed by `Stack`, `Box`, `Grid`, or `Text`?
- Are color literals replaced with proper variables?
