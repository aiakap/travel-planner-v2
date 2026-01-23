# Clear Profile Graphs Guide

## Overview

Two scripts are available to clear profile graph data from all users:

1. **Delete All** - Completely removes all UserProfileGraph records
2. **Reset to Blank** - Keeps records but sets them to empty XML

## Option 1: Delete All Profile Graphs

**Script:** `scripts/clear-all-profile-graphs.ts`

This script completely deletes all `UserProfileGraph` records from the database.

### Usage

```bash
npx tsx scripts/clear-all-profile-graphs.ts
```

### What It Does

1. Counts existing profile graphs
2. Lists all users who have profile graphs
3. Deletes all `UserProfileGraph` records
4. Reports success

### Result

- All `UserProfileGraph` records are deleted
- Users will start with no record (will be created on first use)
- Clean slate for all users

### Example Output

```
🗑️  Starting profile graph cleanup...

📊 Found 3 profile graph(s) to clear

📋 Profile graphs to be cleared:
   1. John Doe (john@example.com)
   2. Jane Smith (jane@example.com)
   3. Bob Johnson (bob@example.com)

✅ Successfully cleared 3 profile graph(s)

🎉 All profile graphs have been reset to blank state!
   Users can now start fresh at /profile/graph

✨ Script completed successfully
```

## Option 2: Reset to Blank XML

**Script:** `scripts/reset-profile-graphs-to-blank.ts`

This script keeps all `UserProfileGraph` records but resets their content to blank XML.

### Usage

```bash
npx tsx scripts/reset-profile-graphs-to-blank.ts
```

### What It Does

1. Counts existing profile graphs
2. Lists all users who have profile graphs
3. Updates all records with blank XML structure
4. Reports success

### Result

- All `UserProfileGraph` records remain in database
- `graphData` field set to empty XML structure
- Preserves record metadata (createdAt, updatedAt, etc.)

### Blank XML Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<profile>
</profile>
```

### Example Output

```
🔄 Starting profile graph reset to blank...

📊 Found 3 profile graph(s) to reset

📋 Profile graphs to be reset:
   1. John Doe (john@example.com)
   2. Jane Smith (jane@example.com)
   3. Bob Johnson (bob@example.com)

✅ Successfully reset 3 profile graph(s) to blank

🎉 All profile graphs are now empty!
   Users can start fresh at /profile/graph

   Note: UserProfileGraph records still exist, just with blank data

✨ Script completed successfully
```

## Which Option Should I Use?

### Use "Delete All" If:
- You want a completely clean database
- You want to remove all traces of profile graphs
- You don't care about preserving record metadata
- You want the smallest database footprint

### Use "Reset to Blank" If:
- You want to preserve record creation dates
- You want to keep the database structure intact
- You want to maintain referential integrity
- You might want to restore data from backups later

## Safety Features

Both scripts:
- ✅ Show what will be affected before making changes
- ✅ List all users whose data will be cleared/reset
- ✅ Provide clear success/error messages
- ✅ Disconnect from database properly
- ✅ Exit with appropriate status codes

## Important Notes

### Before Running

1. **Backup your database** if you might want to restore data later
2. **Inform users** if this is a production system
3. **Test in development** first

### After Running

1. Users can immediately start using `/profile/graph`
2. First visit will create a new blank profile graph
3. All new data will use the improved suggestion-based workflow
4. No migration or additional setup needed

## Troubleshooting

### Error: "Cannot find module"

Make sure you have `tsx` installed:

```bash
npm install -D tsx
```

### Error: "Database connection failed"

Check your `.env` file has valid `DATABASE_URL`

### Error: "Permission denied"

Make sure the scripts have execute permissions:

```bash
chmod +x scripts/clear-all-profile-graphs.ts
chmod +x scripts/reset-profile-graphs-to-blank.ts
```

## Alternative: Manual Database Query

If you prefer to run SQL directly:

### Delete All

```sql
DELETE FROM "UserProfileGraph";
```

### Reset to Blank

```sql
UPDATE "UserProfileGraph" 
SET "graphData" = '<?xml version="1.0" encoding="UTF-8"?>
<profile>
</profile>';
```

## Verification

After running either script, verify the changes:

```bash
# Connect to your database
psql $DATABASE_URL

# Check profile graph count
SELECT COUNT(*) FROM "UserProfileGraph";

# Check profile graph data (if using reset option)
SELECT "userId", LENGTH("graphData") as data_length 
FROM "UserProfileGraph";
```

## Rollback

If you need to rollback:

1. **Delete All**: Restore from database backup
2. **Reset to Blank**: Restore from database backup

There is no automatic undo feature - always backup first!

## Summary

| Feature | Delete All | Reset to Blank |
|---------|-----------|----------------|
| Removes records | ✅ Yes | ❌ No |
| Clears data | ✅ Yes | ✅ Yes |
| Preserves metadata | ❌ No | ✅ Yes |
| Database size | Smaller | Same |
| Recommended for | Clean start | Soft reset |

Choose the option that best fits your needs!
