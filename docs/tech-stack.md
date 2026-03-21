# Tech Stack

This chapter captures the Currento 1.0 technical baseline and the practical opinions attached to it.

## Core Stack

- Framework: Next.js 15 with App Router
- UI runtime: React 19 and `react-dom` 19
- Language: TypeScript 5
- Database: PostgreSQL
- ORM: Prisma 6
- Styling: SCSS with shared global variables and component-owned stylesheets
- Date utilities: `date-fns`
- Charts: `recharts`
- Forms: `react-use-form-library`
- Email delivery: `nodemailer`
- Localisation helper dependency: `i18n-js`

## Currento Runtime Opinions

- App Router is the default architecture.
- React Compiler is enabled in `next.config.js`.
- Server Actions are enabled with `bodySizeLimit: "2mb"`.
- Prisma client generation runs on install and before build.
- Internal `src/` imports use the `@/` alias defined in `tsconfig.json`.
- SCSS remains the styling layer instead of Tailwind or CSS-in-JS.

## TypeScript Configuration Highlights

From `tsconfig.json`:

- `strict: true`
- `moduleResolution: "bundler"`
- `resolveJsonModule: true`
- `jsx: "preserve"`
- alias path mapping for `@/*` to `./src/*`

These settings support a modern App Router setup with strong type safety and direct JSON locale imports.

## Next.js Configuration Highlights

From `next.config.js`:

- builds ignore ESLint because linting is handled as a dedicated workflow
- `experimental.reactCompiler` is enabled
- `experimental.serverActions.bodySizeLimit` is set to `2mb`

This keeps linting deliberate while preserving the React Compiler and server-action ergonomics the repo expects.

## Prisma And Database Setup

From `prisma/schema.prisma` and `prisma.config.ts`:

- provider: PostgreSQL
- runtime datasource: `DATABASE_URL`
- migration/direct access: `DIRECT_URL`
- schema path: `prisma/schema.prisma`
- migrations path: `prisma/migrations`
- seed command: `tsx prisma/seed.ts`

Current main models:

- `UserAccount`
- `Space`
- `Transaction`
- `LoginCode`
- `Session`

## Scripts That Define The Workflow

- `yarn dev`
- `yarn build`
- `yarn start`
- `yarn lint`
- `yarn lint:eslint`
- `yarn lint:repo`
- `yarn lint:types`
- `yarn review:page-primitives`
- `yarn review:prefer-primitives`
- `yarn format`
- `yarn prisma:generate`
- `yarn prisma:migrate`
- `yarn prisma:migrate:deploy`
- `yarn prisma:studio`
- `yarn prisma:seed`

## Suggested Base Folder Shape

For projects modeled after Currento, this structure is a strong starting point:

```text
prisma/
src/
  actions/
  app/
  components/
  elements/
  lib/
  locales/
  model/
  styles/
eslint-rules/
scripts/
docs/
```

## What Makes This Stack Work Well Here

- Next.js App Router handles route composition and server integration cleanly.
- Prisma keeps schema, migrations, and local development practical.
- PostgreSQL supports the reporting and aggregation shape the app needs.
- TypeScript and custom lint rules lock in conventions that would otherwise drift.
- SCSS plus shared primitives gives the UI structure without utility-class sprawl.
