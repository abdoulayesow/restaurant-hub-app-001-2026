#!/bin/bash
# Database backup script for production safety

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/expense_workflow_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup: $BACKUP_FILE"

# Use DATABASE_URL from .env
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set"
  exit 1
fi

pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup created successfully"
  echo "File: $BACKUP_FILE"
  echo "Size: $(du -h $BACKUP_FILE | cut -f1)"
else
  echo "❌ Backup failed"
  exit 1
fi
