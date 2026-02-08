# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running
- Basic knowledge of terminal/command line

## Step-by-Step Setup

### 1. Install PostgreSQL (if not already installed)

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE expense_tracker;

# Exit
\q
```

### 3. Clone/Navigate to Project

```bash
cd expense-tracker
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Database Connection

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and update with your credentials:

```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/expense_tracker?schema=public"
```

For local development, default PostgreSQL user is usually:
- **macOS/Linux**: Your system username with no password
- **Windows**: `postgres` user with the password you set during installation

Example for macOS user named "john":
```env
DATABASE_URL="postgresql://john@localhost:5432/expense_tracker?schema=public"
```

Example for Windows:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/expense_tracker?schema=public"
```

### 6. Initialize Database

```bash
# Run migrations to create tables
npx prisma migrate dev --name init

# Seed with sample data (optional)
npm run prisma:seed

# Generate Prisma Client
npx prisma generate
```

### 7. Start Development Server

```bash
npm run dev
```

### 8. Open in Browser

Navigate to http://localhost:3000

## Common Issues

### Issue: "Can't reach database server"

**Solution**: Make sure PostgreSQL is running
```bash
# Check status
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start if not running
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### Issue: "Authentication failed"

**Solution**: Update your `.env` file with correct credentials

### Issue: "Port 3000 already in use"

**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
npm run dev -- -p 3001
```

### Issue: Prisma Client not generated

**Solution**:
```bash
npx prisma generate
```

## Next Steps

1. **View Dashboard**: Go to http://localhost:3000 to see current month overview
2. **Add Entries**: Click "Manage Entries" to add your income and expenses
3. **View Projections**: Click "Projection" to see multi-month forecasts
4. **Customize**: Edit the seed script to import your own data

## Importing Your CSV Data

To import your own CSV data:

1. Open `prisma/seed.ts`
2. Replace the `entries` array with your data
3. Update the parsing logic if your CSV format differs
4. Run: `npm run prisma:seed`

## Development Tips

- **View Database**: Run `npm run prisma:studio` to open Prisma Studio
- **Reset Database**: 
  ```bash
  npx prisma migrate reset
  npm run prisma:seed
  ```
- **Hot Reload**: Changes to code will auto-reload in browser
- **Check Logs**: Look at terminal for any errors

## Production Deployment

For production deployment (e.g., Vercel, Railway):

1. Set `DATABASE_URL` environment variable in your hosting platform
2. Run `npm run build` locally to test
3. Deploy to your platform
4. Run migrations: `npx prisma migrate deploy`

Enjoy tracking your expenses! 🎉
