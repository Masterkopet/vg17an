#!/bin/sh
set -e

# Default DATABASE_URL bila belum diset (tetap disarankan diisi di Coolify + volume /app/data).
export DATABASE_URL="${DATABASE_URL:-file:/app/data/prod.db}"

# Pastikan folder database (volume persisten) ada, lalu sinkronkan skema.
DB_DIR="$(dirname "$(echo "$DATABASE_URL" | sed 's|^file:||')")"
mkdir -p "$DB_DIR"

echo "[entrypoint] prisma db push..."
npx prisma db push --skip-generate

echo "[entrypoint] starting Next.js..."
exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
