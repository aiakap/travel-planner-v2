# Local PostgreSQL backup and rollback

Your app uses **local PostgreSQL** (`DATABASE_URL` → `localhost:5432/travel-planner-v1`). Backups are **not automatic**; the existing `auto-backup.sh` only commits **code** to git, not the database.

## Quick backup (before risky changes)

From the project root:

```bash
./scripts/db-backup.sh
```

This writes a timestamped SQL file to `backups/`, e.g.  
`backups/travel-planner-v1_20250129_143022.sql`.  
The `backups/` folder is in `.gitignore`, so dumps stay local.

## Roll back to a backup

```bash
./scripts/db-restore.sh backups/travel-planner-v1_20250129_143022.sql
```

The script will ask for confirmation, then replace the current local DB with the backup.

## Automatic backup every 10 minutes (installed)

A LaunchAgent runs `db-backup.sh` every 10 minutes and once at login.

- **Install (one-time):**
  ```bash
  ln -sf "/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/scripts/com.travelplanner.dbbackup.plist" ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.travelplanner.dbbackup.plist
  ```
- **Uninstall:**
  ```bash
  launchctl unload ~/Library/LaunchAgents/com.travelplanner.dbbackup.plist
  rm ~/Library/LaunchAgents/com.travelplanner.dbbackup.plist
  ```
- **Logs:** `scripts/db-backup.log` and `scripts/db-backup-error.log`

Backups are timestamped in `backups/`; keep or prune old ones as you like.

## Other options

1. **Cron**  
   Example: every day at 2am:
   ```bash
   0 2 * * * /Users/alexkaplinsky/Desktop/Dev\ site/travel-planner-v2/scripts/db-backup.sh
   ```

2. **Before migrations**  
   Run `./scripts/db-backup.sh` once before `npx prisma migrate deploy` or any manual schema/data change so you can restore if something goes wrong.

## One-off from the shell

- **Backup:**  
  `pg_dump "postgresql://travel:travel@localhost:5432/travel-planner-v1" -F p -f backups/manual.sql`

- **Restore:**  
  `psql "postgresql://travel:travel@localhost:5432/travel-planner-v1" -f backups/manual.sql`

Use the scripts above when you want a consistent, timestamped backup and a safe restore flow.
