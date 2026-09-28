#!/bin/sh
set -e

echo "=== Initializing BKMCH Database ==="
npx prisma db push --skip-generate

echo "=== Running Initial Seed Script ==="
npm run seed || true

echo "=== Starting BKMCH Recruitment Portal ==="
exec npm start
