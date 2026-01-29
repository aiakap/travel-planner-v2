#!/bin/bash
# Restore local PostgreSQL from a backup made by db-backup.sh.
# Usage: ./scripts/db-restore.sh backups/travel-planner-v1_20250129_120000.sql

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ -z "$1" ] || [ ! -f "$1" ]; then
  echo "Usage: $0 <backup-file.sql>"
  echo "Example: $0 backups/travel-planner-v1_20250129_120000.sql"
  echo ""
  echo "Available backups:"
  ls -la backups/*.sql 2>/dev/null || echo "  (none)"
  exit 1
fi
BACKUP_FILE="$1"

# Load DATABASE_URL from .env
if [ -f .env ]; then
  export DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
fi
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set. Add it to .env or export it."
  exit 1
fi

if [[ "$DATABASE_URL" != *"localhost"* ]] && [[ "$DATABASE_URL" != *"127.0.0.1"* ]]; then
  echo "Error: DATABASE_URL does not look like localhost. Refusing to restore."
  exit 1
fi

echo "This will REPLACE the current local database with: $BACKUP_FILE"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "Restoring ..."
psql "$DATABASE_URL" -f "$BACKUP_FILE" --set ON_ERROR_STOP=on
echo "Done."
