#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ] || [[ "$2" == -* ]]; then
  echo "使い方: ./build_and_push.sh <tenant-id> <イメージ名>" >&2
  exit 1
fi

TASK_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$TASK_SCRIPT_DIR"
node scripts/build-image.mjs "$1" "$2"
docker push "$2"
