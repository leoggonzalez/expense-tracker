# New Project Quickstart

This guide shows how to start a new project using the same foundation that worked well for Currento: Next.js, TypeScript, Prisma, PostgreSQL, SCSS, custom lint rules, and a single localized homepage.

## 1. Create The App

Use the latest Next.js App Router starter with TypeScript:

```bash
yarn create next-app currento-next --ts --eslint --app
cd currento-next
```

If the starter asks about styling, choose the simplest option and then add SCSS yourself so the styling system stays intentional.

## 2. Install The Base Libraries

```bash
yarn add @prisma/client date-fns i18n-js nodemailer react-use-form-library recharts sass
yarn add -D @types/node @types/nodemailer @types/react @types/react-dom babel-plugin-react-compiler prettier prisma tsx typescript
```

At minimum, this gives you the same application baseline as Currento. If the new project does not need charts or email yet, you can leave `recharts` or `nodemailer` for later.

## 3. Add Core Scripts

Update `package.json` so the repo starts with the same workflow shape:

```json
{
  "scripts": {
    "dev": "next dev",
    "prebuild": "prisma generate",
    "build": "next build",
    "start": "next start",
    "lint": "node scripts/lint/run_all_checks.mjs",
    "lint:eslint": "eslint . --ext .js,.jsx,.ts,.tsx --rulesdir eslint-rules --ignore-pattern 'eslint-rules/*' --ignore-pattern 'next-env.d.ts'",
    "lint:repo": "node scripts/lint/check_repo_rules.mjs",
    "lint:types": "tsc --noEmit",
    "review:page-primitives": "node scripts/review/page_primitive_review.mjs",
    "review:prefer-primitives": "node scripts/review/prefer_primitives_review.mjs",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,scss,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,scss,md}\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts",
    "postinstall": "prisma generate"
  }
}
```

You can copy the lint and review scripts from this repo later, but it helps to establish the script contract from day one.

## 4. Set Up TypeScript Alias And Next Config

Add the alias to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Configure Next.js to match Currento's runtime expectations:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    reactCompiler: true,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
```

## 5. Create The Base Folder Structure

Create the directories early so the architecture is obvious:

```text
eslint-rules/
scripts/lint/
scripts/review/
prisma/
src/app/
src/components/
src/elements/
src/lib/
src/locales/
src/model/
src/styles/
docs/
```

Recommended intent:

- `src/app`: routes and page composition
- `src/components`: reusable rendered UI sections
- `src/elements`: low-level primitives
- `src/lib`: helpers and data abstractions
- `src/locales`: locale message files
- `src/model`: business-domain models when the project benefits from them
- `src/styles`: shared tokens and globals

## 6. Initialize Prisma And PostgreSQL

Initialize Prisma:

```bash
yarn prisma init
```

Then shape the config like Currento:

`prisma.config.ts`

```ts
import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

Use PostgreSQL in `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Example `.env` values:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/currento_next?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/currento_next?schema=public"
```

## 7. Add Base Locales And Styles

Create `src/locales/en.json`:

```json
{
  "metadata": {
    "title": "Currento Next",
    "description": "A project bootstrapped from the Currento 1.0 handbook."
  },
  "home": {
    "eyebrow": "Starter",
    "title": "Project ready",
    "subtitle": "Start building on a stable Next.js, Prisma, and SCSS foundation."
  }
}
```

Create `src/styles/variables.scss`:

```scss
:root {
  --color-background: #f5f7f4;
  --color-surface: #ffffff;
  --color-text: #15231c;
  --color-muted: #5b6d63;
  --color-primary: #0d6d77;
  --space-page: 24px;
  --content-max-width: 1000px;
}
```

Create `src/styles/globals.scss`:

```scss
@use "./variables";

html,
body {
  margin: 0;
  padding: 0;
  background: var(--color-background);
  color: var(--color-text);
  font-family: Georgia, "Times New Roman", serif;
}

* {
  box-sizing: border-box;
}
```

## 8. Create One Homepage

Import global styles in `src/app/layout.tsx` and read metadata from locales:

```tsx
import type { Metadata } from "next";

import messages from "@/locales/en.json";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout(
  props: RootLayoutProps,
): React.ReactElement {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
import messages from "@/locales/en.json";

export default function Page(): React.ReactElement {
  return (
    <main className="home-page">
      <div className="home-page__content">
        <p className="home-page__eyebrow">{messages.home.eyebrow}</p>
        <h1 className="home-page__title">{messages.home.title}</h1>
        <p className="home-page__subtitle">{messages.home.subtitle}</p>
      </div>
    </main>
  );
}
```

Keep the styling local by creating a reusable component or by moving homepage styling into a shared component early if the page grows beyond a simple starting point.

## 9. Add The Repo Guardrails Early

Before feature work expands:

1. Copy or recreate the custom ESLint rules that matter most to you.
2. Add repo-rule scripts for naming, SCSS placement, and localisation shape.
3. Write the handbook pages that define your standards while the architecture is still fresh.
4. Add `AGENTS.md` and a short `SERVER_GUIDELINES.md` that point to the handbook.

Doing this in week one is much easier than retrofitting it later.

## 10. First Run

Run the initial setup:

```bash
yarn install
yarn prisma:generate
yarn dev
```

Then add the first migration once you have your initial schema:

```bash
yarn prisma:migrate --name init
```

At that point you have a working homepage and the same architectural spine that made Currento successful.
