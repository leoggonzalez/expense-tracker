# Expense Tracker

A modern expense tracking application built with Next.js 15, Prisma, PostgreSQL, and TypeScript. Track your income and expenses, view projections, and manage your financial data with ease.

## Features

- ✅ **Dashboard**: Quick overview of current month's income, expenses, and net balance
- ✅ **Projection Table**: Detailed view of projected expenses across multiple months with grouping
- ✅ **Entry Management**: Add, view, and delete income and expense entries
- ✅ **Date Ranges**: Support for recurring entries with optional end dates
- ✅ **Grouping**: Organize entries by categories (e.g., income, Various, Investment)
- ✅ **Modern UI**: Clean, responsive design following BEM methodology

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Language**: TypeScript
- **Styling**: SCSS (with BEM methodology)
- **Date Handling**: date-fns

## Project Structure

```
expense-tracker/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script with sample data
├── src/
│   ├── actions/           # Server actions for CRUD operations
│   │   └── entries.ts
│   ├── app/               # Next.js app router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx       # Dashboard
│   │   ├── projection/
│   │   │   └── page.tsx   # Projection table
│   │   └── entries/
│   │       ├── page.tsx   # Entry management
│   │       ├── EntryList.tsx
│   │       └── EntryList.scss
│   ├── components/        # Composed React components
│   │   ├── Button/
│   │   ├── Dashboard/
│   │   ├── EntryForm/
│   │   ├── Input/
│   │   ├── Navigation/
│   │   ├── ProjectionTable/
│   │   └── Select/
│   ├── elements/          # Base wrapper components
│   │   ├── Box/
│   │   ├── Stack/
│   │   └── Text/
│   ├── model/             # OOP business logic layer
│   │   ├── Entry.ts
│   │   └── EntryCollection.ts
│   ├── lib/
│   │   └── prisma.ts      # Prisma client instance
│   └── styles/
│       ├── variables.scss # CSS variables
│       └── globals.scss   # Global styles
├── package.json
├── tsconfig.json
└── next.config.js
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

Make sure you have PostgreSQL installed and running. Create a new database:

```bash
createdb expense_tracker
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

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

Replace `username` and `password` with your PostgreSQL credentials.

For Gmail SMTP:
- enable 2-Step Verification on your Google account
- create a Google app password
- use the app password in `SMTP_PASS`, not your normal Gmail password
- keep `DEV_ADMIN_EMAIL` limited to your own local development account

The `DEV_ADMIN_LOGIN_CODE=999999` bypass is development-only. It only works for the configured `DEV_ADMIN_EMAIL`, it is ignored in production, and requesting a login code for that admin email skips email sending entirely so you can proceed directly to the verify screen.

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

For local development, both `DATABASE_URL` and `DIRECT_URL` should point to your local PostgreSQL instance.

### 5. Seed the Database (Optional)

Populate the database with sample data from your CSV:

```bash
npx tsx prisma/seed.ts
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Login

- Request a 6-digit login code with your email address
- Enter the code on the verify page to create a session
- In local development, the configured `DEV_ADMIN_EMAIL` can always log in with `999999`
- Requesting a code for `admin@example.com` does not send an email and does not rotate stored login codes

### Dashboard

The dashboard provides a quick overview of your current month's financial status:
- **Income**: Total income for the current month
- **Expenses**: Total expenses for the current month
- **Net**: The difference between income and expenses

### Projection Table

The projection table shows a detailed breakdown of your projected income and expenses:
- Select an end date to view projections for multiple months
- Entries are grouped by category
- Each group shows a subtotal
- Monthly totals show income, expenses, and net balance
- Only entries active during each month are included

### Manage Entries

Add new entries or delete existing ones:
- **Type**: Choose between income or expense
- **Group**: Categorize your entry (e.g., "income", "Various", "Investment")
- **Description**: Short description of the entry
- **Amount**: Positive for income, negative for expenses
- **Begin Date**: When the entry starts
- **End Date**: Optional - when the entry ends (leave empty for recurring)

## Architecture Decisions

### Component Guidelines

1. **Elements** (`src/elements/`): Basic wrapper components
   - `Stack`: Flex container with gap and direction
   - `Box`: Div with padding and max-width
   - `Text`: Typography with size, color, and weight options

2. **Components** (`src/components/`): Composed UI components
   - Each component has its own folder with `.tsx` and `.scss` files
   - Main element uses className matching component name
   - Components never style other components (strict BEM)

3. **Model Layer** (`src/model/`): OOP business logic
   - `Entry`: Single entry with methods for calculations
   - `EntryCollection`: Collection of entries with aggregation logic
   - All date calculations and formatting logic in the model layer

### CSS Methodology

- **BEM (Block Element Modifier)** naming convention
- CSS variables defined in `variables.scss`
- No Tailwind or utility CSS - proper SCSS only
- Component isolation - no cross-component styling

### Data Flow

1. Server Actions fetch data from database
2. Data converted to model classes (Entry, EntryCollection)
3. Model classes provide business logic methods
4. Components receive data as props and render UI
5. User interactions trigger server actions
6. Pages revalidate after mutations

## Database Schema

```prisma
model Entry {
  id          String    @id @default(cuid())
  type        String    // "income" or "expense"
  group       String
  description String
  amount      Float
  beginDate   DateTime
  endDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:migrate:deploy` - Apply committed migrations without creating new ones
- `npm run prisma:studio` - Open Prisma Studio

## Deployment

### Hosting

- Application: **Vercel**
- Production database: **Supabase Postgres**
- Local development database: **local PostgreSQL**

### Production database URLs

Use two database URLs in production:

- `DATABASE_URL`: Supabase transaction pooler URL for application runtime
- `DIRECT_URL`: Supabase session pooler URL for Prisma CLI and migrations

Recommended production shape:

```env
DATABASE_URL="postgresql://<user>:<password>@<transaction-pooler-host>:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://<user>:<password>@<session-pooler-host>:5432/postgres"
```

### Vercel configuration

1. Connect your GitHub account to Vercel.
2. Import this repository as a Vercel project.
3. Set `main` as the production branch.
4. Add all production environment variables in the Vercel project settings:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `EMAIL_PROVIDER`
   - `EMAIL_FROM`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `DEV_ADMIN_EMAIL`
   - `DEV_ADMIN_LOGIN_CODE`

Vercel Git integration will then:

- create preview deployments for pull requests
- deploy production automatically on every merge or push to `main`

### Supabase configuration

Create one Supabase production project and use the closest EU region available.

Recommended setup:

1. Create a dedicated Prisma database user.
2. Grant that user access to the `public` schema.
3. Use that user’s credentials for both the runtime and direct URLs.
4. Copy the transaction pooler URL into `DATABASE_URL`.
5. Copy the session pooler URL into `DIRECT_URL`.

### Production migrations

Production migrations are manual.

Recommended release flow:

1. Create and commit migrations in development.
2. Merge to `main`.
3. Run production migrations manually:

```bash
npx prisma migrate deploy
```

Run that command with production `DATABASE_URL` / `DIRECT_URL` values in your shell or environment.

Do not run schema-changing migrations automatically during deployment.

### GitHub

This repository includes a GitHub Actions workflow at [.github/workflows/ci.yml](/Users/leogonzalez/development/leoggonzalez/expense-tracker/.github/workflows/ci.yml) that runs:

- `yarn lint`
- `yarn build`

Before CI can pass in GitHub, configure these repository settings.

GitHub Actions Secrets:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `EMAIL_FROM`
- `SMTP_USER`
- `SMTP_PASS`
- `DEV_ADMIN_LOGIN_CODE`

GitHub Actions Variables:

- `EMAIL_PROVIDER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `DEV_ADMIN_EMAIL`

These values are required by the CI workflow and are managed in GitHub repository settings.
Vercel production environment variables are configured separately in Vercel and are not inherited from GitHub Actions.

Recommended GitHub branch protection for `main`:

- require pull requests before merge
- require the CI workflow to pass
- optionally require the branch to be up to date before merge

## Future Enhancements

- Edit entry functionality
- CSV import/export
- Filtering and search
- Charts and visualizations
- Budget setting and alerts
- Multi-currency support
- Recurring expense patterns

## License

MIT
