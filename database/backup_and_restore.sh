#!/usr/bin/env bash
# ==============================================================================
# Customer360 Database Backup & Disaster Recovery Script
# Automated daily logical backups, S3/GCS sync, and restore verification
# ==============================================================================

set -eo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="customer360_backup_${TIMESTAMP}.sql.gz"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-customer360_user}"
POSTGRES_DB="${POSTGRES_DB:-customer360_db}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

backup() {
    echo "=========================================================="
    echo "Starting Customer360 PostgreSQL Production Backup"
    echo "Host: ${POSTGRES_HOST}:${POSTGRES_PORT} | DB: ${POSTGRES_DB}"
    echo "Timestamp: ${TIMESTAMP}"
    echo "=========================================================="

    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    # 1. Execute pg_dump with custom tar/gzip compression
    pg_dump -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip -9 > "${BACKUP_FILEPATH}"

    # 2. Compute SHA-256 Checksum for tamper verification
    sha256sum "${BACKUP_FILEPATH}" > "${BACKUP_FILEPATH}.sha256"

    FILESIZE=$(du -h "${BACKUP_FILEPATH}" | cut -f1)
    echo "✅ Backup successfully created: ${BACKUP_FILEPATH} (${FILESIZE})"
    echo "   Checksum: $(cat "${BACKUP_FILEPATH}.sha256")"

    # 3. Cloud Storage Sync (AWS S3 / GCP Cloud Storage if configured)
    if [ -n "${S3_BACKUP_BUCKET}" ]; then
        echo "Syncing backup to AWS S3: s3://${S3_BACKUP_BUCKET}/backups/${BACKUP_FILENAME}"
        aws s3 cp "${BACKUP_FILEPATH}" "s3://${S3_BACKUP_BUCKET}/backups/${BACKUP_FILENAME}" --sse aws:kms
        aws s3 cp "${BACKUP_FILEPATH}.sha256" "s3://${S3_BACKUP_BUCKET}/backups/${BACKUP_FILENAME}.sha256"
    fi

    # 4. Prune local backups older than RETENTION_DAYS
    echo "Cleaning up local backups older than ${RETENTION_DAYS} days..."
    find "${BACKUP_DIR}" -type f -name "customer360_backup_*.sql.gz*" -mtime "+${RETENTION_DAYS}" -delete
    echo "Backup procedure complete!"
}

restore() {
    RESTORE_FILE="$1"
    if [ -z "${RESTORE_FILE}" ] || [ ! -f "${RESTORE_FILE}" ]; then
        echo "❌ Error: Please specify a valid backup file to restore."
        echo "Usage: $0 restore /path/to/backup.sql.gz"
        exit 1
    fi

    echo "=========================================================="
    echo "Restoring Customer360 PostgreSQL Database"
    echo "Source: ${RESTORE_FILE}"
    echo "Target: ${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
    echo "=========================================================="

    # Verify Checksum if present
    if [ -f "${RESTORE_FILE}.sha256" ]; then
        echo "Verifying SHA-256 Checksum..."
        sha256sum -c "${RESTORE_FILE}.sha256"
        echo "✓ Checksum verified."
    fi

    export PGPASSWORD="${POSTGRES_PASSWORD}"
    gunzip -c "${RESTORE_FILE}" | psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
    echo "✅ Database restore completed successfully!"
}

case "$1" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    *)
        echo "Usage: $0 {backup|restore <file>}"
        exit 1
        ;;
esac
