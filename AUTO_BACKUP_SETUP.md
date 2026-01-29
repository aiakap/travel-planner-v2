# Automatic Git Backup Setup

This guide will help you set up automatic hourly commits and pushes to prevent data loss.

## What This Does

- **Automatically commits** all changes every hour with a timestamped message
- **Automatically pushes** to your remote repository
- **Runs silently** in the background
- **Logs all activity** for your review

## Setup Instructions

### Step 1: Make the backup script executable

```bash
chmod +x "/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/scripts/auto-backup.sh"
```

### Step 2: Test the script manually

```bash
"/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/scripts/auto-backup.sh"
```

This should commit and push any current changes. If it works, proceed to Step 3.

### Step 3: Install the launchd service

```bash
# Copy the plist to LaunchAgents
cp "/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/scripts/com.travelplanner.autobackup.plist" ~/Library/LaunchAgents/

# Load the service
launchctl load ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
```

### Step 4: Verify it's running

```bash
launchctl list | grep travelplanner
```

You should see `com.travelplanner.autobackup` in the output.

## Managing the Service

### Stop auto-backup
```bash
launchctl unload ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
```

### Start auto-backup
```bash
launchctl load ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
```

### Remove auto-backup completely
```bash
launchctl unload ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
rm ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
```

### Trigger a backup manually (without waiting for the hourly schedule)
```bash
launchctl start com.travelplanner.autobackup
```

## Checking Logs

View successful backups:
```bash
tail -f "/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/scripts/auto-backup.log"
```

View errors (if any):
```bash
tail -f "/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/scripts/auto-backup-error.log"
```

## Configuration Options

### Change backup frequency

Edit `~/Library/LaunchAgents/com.travelplanner.autobackup.plist` and modify the `StartInterval` value:

- `1800` = 30 minutes
- `3600` = 1 hour (current setting)
- `7200` = 2 hours
- `14400` = 4 hours

After changing, reload the service:
```bash
launchctl unload ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
launchctl load ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
```

### Change which branch to push to

Edit `scripts/auto-backup.sh` and change `main` to your preferred branch:
```bash
git push origin YOUR_BRANCH_NAME
```

## Important Notes

1. **This will create many commits** - Your git history will have hourly "Auto-backup" commits. This is intentional for safety.

2. **Network required** - Pushes will fail if you're offline. The script will log errors but won't break anything.

3. **Git credentials** - Make sure your git credentials are cached or you're using SSH keys, so pushes don't require manual password entry.

4. **Merge conflicts** - If someone else pushes to the same branch, the auto-backup might fail. Check the error log if you suspect issues.

## Troubleshooting

### "Permission denied" when running the script
```bash
chmod +x "/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2/scripts/auto-backup.sh"
```

### Script runs but doesn't push
Check if git credentials are configured:
```bash
git config --global credential.helper osxkeychain
```

### Service isn't running
```bash
# Unload and reload
launchctl unload ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
launchctl load ~/Library/LaunchAgents/com.travelplanner.autobackup.plist
```

### Check service status
```bash
launchctl list | grep travelplanner
```

The second column shows the exit code of the last run (0 = success).

## Alternative: Git Hooks (Optional)

If you prefer commits only when you save files (not on a schedule), you can use git hooks instead. Let me know if you'd like that approach!
