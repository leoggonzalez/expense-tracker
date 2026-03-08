#!/usr/bin/env bash

set -euo pipefail

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "Vercel production deploy detected: running Prisma migrations..."
  yarn prisma:migrate:deploy
else
  echo "Vercel env is '${VERCEL_ENV:-unknown}': skipping Prisma migrate deploy."
fi

echo "Running Next.js build..."
yarn build
