#!/bin/bash
# Backup local PostgreSQL database (travel-planner-v2).
# Backups are saved to backups/ with a timestamp. Not automatic — run before risky changes.

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"
BACKUP_DIR="${PROJECT_ROOT}/backups"
mkdir -p "$BACKUP_DIR"

# Load DATABASE_URL from .env (use the one without _cloud)
if [ -f .env ]; then
  export DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
fi
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set. Add it to .env or export it."
  exit 1
fi

# Optional: only backup if URL points to localhost (safety)
if [[ "$DATABASE_URL" != *"localhost"* ]] && [[ "$DATABASE_URL" != *"127.0.0.1"* ]]; then
  echo "Error: DATABASE_URL does not look like localhost. Refusing to backup."
  exit 1
fi

STAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT="${BACKUP_DIR}/travel-planner-v1_${STAMP}.sql"

echo "Backing up local DB to ${OUTPUT} ..."
pg_dump "$DATABASE_URL" --no-owner --no-acl -F p --clean --if-exists -f "$OUTPUT"
echo "Done. Backup: ${OUTPUT}"
echo "To restore later: ./scripts/db-restore.sh ${OUTPUT}"
