#!/bin/bash

# Auto-backup script for travel-planner-v2
# This script automatically commits and pushes changes to prevent data loss

# Navigate to the project directory
cd "/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2" || exit 1

# Check if there are any changes
if [[ -z $(git status --porcelain) ]]; then
    echo "$(date): No changes to commit"
    exit 0
fi

# Add all changes
git add -A

# Create a commit with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "Auto-backup: $TIMESTAMP"

# Push to remote
git push origin main

echo "$(date): Successfully backed up changes"
