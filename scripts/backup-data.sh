#!/usr/bin/env bash
# 센서 배치(sensors.json)·감사 로그(audit.log) 백업
#   npm run backup                 → backups/pyroguard-data-YYYYMMDD-HHMMSS.tar.gz
#   BACKUP_DIR=/mnt/nas npm run backup
#
# 복구: 서버를 멈추고 DATA_DIR 에 풀어 넣은 뒤 다시 시작한다.
#   tar -xzf backups/pyroguard-data-….tar.gz -C "${DATA_DIR:-.data}"
set -euo pipefail

DATA_DIR="${DATA_DIR:-.data}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
KEEP="${BACKUP_KEEP:-30}"   # 최근 몇 개를 남길지

if [ ! -d "$DATA_DIR" ]; then
  echo "백업할 데이터 폴더가 없습니다: $DATA_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
stamp="$(TZ=Asia/Seoul date +%Y%m%d-%H%M%S)"
out="$BACKUP_DIR/pyroguard-data-$stamp.tar.gz"
tar -czf "$out" -C "$DATA_DIR" .
echo "백업 완료: $out ($(du -h "$out" | cut -f1))"

# 오래된 백업 정리
ls -1t "$BACKUP_DIR"/pyroguard-data-*.tar.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm --
