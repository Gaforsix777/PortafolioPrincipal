#!/usr/bin/env bash
set -euo pipefail
image=${1:?Provide an image tag}
name=portfolio-ci-smoke
cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker run -d --name "$name" -p 127.0.0.1:3800:3000 "$image"
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:3800/api/health >/dev/null; then break; fi
  sleep 2
done
curl --fail --silent http://127.0.0.1:3800/api/health | python3 -c 'import json,sys; assert json.load(sys.stdin)["database"] == "connected"'
curl --fail --silent http://127.0.0.1:3800/ | python3 -c 'import sys; assert "Ramiro Laime" in sys.stdin.read()'
curl --fail --silent -X POST http://127.0.0.1:3800/api/contact -H 'Content-Type: application/json' -d '{"name":"CI Smoke","email":"ci@example.com","message":"Verificacion del contenedor Docker."}' >/dev/null
docker restart "$name" >/dev/null
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:3800/api/health >/dev/null; then break; fi
  sleep 2
done
docker exec "$name" node --input-type=module -e 'import { DatabaseSync } from "node:sqlite"; const db = new DatabaseSync(process.env.DATABASE_PATH); if(db.prepare("SELECT count(*) AS n FROM contacts").get().n !== 1) process.exit(1); db.close();'
