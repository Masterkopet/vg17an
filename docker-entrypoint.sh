#!/bin/sh
set -e

# Pastikan folder database (volume persisten) ada, lalu sinkronkan skema.
DB_DIR="$(dirname "$(echo "${DATABASE_URL:-file:/app/data/prod.db}" | sed 's|^file:||')")"
mkdir -p "$DB_DIR"

echo "[entrypoint] prisma db push..."
npx prisma db push --skip-generate

echo "[entrypoint] starting Next.js..."
exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
