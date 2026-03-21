# Currento

Currento is a personal finance app built with Next.js, Prisma, PostgreSQL, TypeScript, and SCSS. The codebase is now documented as a reusable 1.0 baseline for future projects.

## Handbook

The main documentation now lives in `docs/`:

- [docs/index.md](./docs/index.md)
- [docs/tech-stack.md](./docs/tech-stack.md)
- [docs/filesystem-and-imports.md](./docs/filesystem-and-imports.md)
- [docs/components.md](./docs/components.md)
- [docs/styling-and-primitives.md](./docs/styling-and-primitives.md)
- [docs/routing-state-and-localisation.md](./docs/routing-state-and-localisation.md)
- [docs/server-and-data.md](./docs/server-and-data.md)
- [docs/validation-linting-and-skills.md](./docs/validation-linting-and-skills.md)
- [docs/project-history.md](./docs/project-history.md)
- [docs/new-project-quickstart.md](./docs/new-project-quickstart.md)

## Local Setup

Install dependencies:

```bash
yarn install
```

Create `.env` with local PostgreSQL credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/expense_tracker?schema=public"
AUTH_SECRET="replace_me"

EMAIL_PROVIDER="smtp"
EMAIL_FROM="you@gmail.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="you@gmail.com"
SMTP_PASS="your_google_app_password"

DEV_ADMIN_EMAIL="you@gmail.com"
DEV_ADMIN_LOGIN_CODE="999999"
```

Run the local setup:

```bash
yarn prisma:generate
yarn prisma:migrate
yarn dev
```

Open `http://localhost:3000`.

## Stack Snapshot

- Next.js 15 App Router
- React 19
- TypeScript 5
- Prisma 6
- PostgreSQL
- SCSS
- Custom lint and review scripts

## Scripts

- `yarn dev`
- `yarn build`
- `yarn lint`
- `yarn lint:eslint`
- `yarn lint:repo`
- `yarn lint:types`
- `yarn review:page-primitives`
- `yarn review:prefer-primitives`
- `yarn prisma:generate`
- `yarn prisma:migrate`
- `yarn prisma:migrate:deploy`
- `yarn prisma:studio`
- `yarn prisma:seed`

## Reusing This Foundation

If you want to start a new project from the same architecture and conventions, use [docs/new-project-quickstart.md](./docs/new-project-quickstart.md).
