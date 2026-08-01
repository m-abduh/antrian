#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/antrian/deploy/backups/mongo"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dump-${TIMESTAMP}.archive"
DAYS_TO_KEEP=7

mkdir -p "${BACKUP_DIR}"

mongodump \
  --uri="${MONGODB_URI}" \
  --archive="${BACKUP_FILE}" \
  --gzip

echo "MongoDB backup selesai: ${BACKUP_FILE}"

find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'dump-*.archive.gz' -mtime +${DAYS_TO_KEEP} -delete
echo "Backup lama (>"${DAYS_TO_KEEP}" hari) dibersihkan."

du -sh "${BACKUP_DIR}"