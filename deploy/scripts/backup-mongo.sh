#!/bin/bash
set -euo pipefail

BACKUP_ROOT="/opt/antrian/deploy/backups"
MONGO_DIR="${BACKUP_ROOT}/mongo"
MINIO_DIR="${BACKUP_ROOT}/minio"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAYS_TO_KEEP=7

mkdir -p "${MONGO_DIR}" "${MINIO_DIR}"

# --- Mongo backup (via docker, mongodump tak perlu di host) ---
MONGO_HOST="${MONGO_HOST:-mongo}"
NETWORK="${NETWORK:-antrian_default}"
if [[ -n "${MONGODB_URI:-}" ]]; then
  docker run --rm \
    --network "${NETWORK}" \
    -e MONGODB_URI="${MONGODB_URI}" \
    -v "${MONGO_DIR}":/backup \
    mongo:7 mongodump \
      --uri="${MONGODB_URI}" \
      --archive="/backup/dump-${TIMESTAMP}.archive" \
      --gzip
  echo "MongoDB backup selesai: ${MONGO_DIR}/dump-${TIMESTAMP}.archive"
else
  echo "SKIP MongoDB backup: MONGODB_URI tidak diset"
fi

# --- MinIO backup (archive volume minio_data langsung via docker tar) ---
if docker volume inspect "antrian_minio_data" >/dev/null 2>&1; then
  docker run --rm \
    -v antrian_minio_data:/data:ro \
    -v "${MINIO_DIR}":/backup \
    alpine sh -c "tar czf /backup/minio-${TIMESTAMP}.tar.gz -C /data ."
  echo "MinIO backup selesai: ${MINIO_DIR}/minio-${TIMESTAMP}.tar.gz"
else
  echo "SKIP MinIO backup: volume antrian_minio_data tidak ditemukan"
fi

# --- Pembersihan backup lama ---
find "${MONGO_DIR}" -type f -name 'dump-*.archive.gz' -mtime +${DAYS_TO_KEEP} -delete 2>/dev/null || true
find "${MINIO_DIR}" -maxdepth 1 -type f -name 'minio-*.tar.gz' -mtime +${DAYS_TO_KEEP} -delete 2>/dev/null || true
echo "Backup lama (>"${DAYS_TO_KEEP}" hari) dibersihkan."

du -sh "${MONGO_DIR}" "${MINIO_DIR}"