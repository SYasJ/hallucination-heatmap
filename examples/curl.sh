#!/usr/bin/env bash
# Send each example request to a running analyzer and pretty-print the result.
#   ./examples/curl.sh [http://localhost:8787]
set -euo pipefail
BASE="${1:-http://localhost:8787}"
DIR="$(cd "$(dirname "$0")" && pwd)/requests"

curl -fsS "$BASE/api/health"; echo
for file in "$DIR"/*.json; do
  echo "=== $(basename "$file") ==="
  curl -sS "$BASE/api/analyze" -H 'Content-Type: application/json' --data-binary "@$file" | python3 -m json.tool
done
