#!/bin/sh
set -e

echo "=== Initializing BKMCH Database ==="
export DATABASE_URL="file:./prisma/dev.db"
npx prisma db push --accept-data-loss --skip-generate

echo "=== Running Initial Seed Script ==="
npm run seed || true

echo "=== Starting BKMCH Recruitment Portal ==="
exec npm start
