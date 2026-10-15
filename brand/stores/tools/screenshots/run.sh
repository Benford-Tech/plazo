#!/usr/bin/env bash
# Store screenshots of Plazo and Plazo Pro (Google Play 1080 x 1920, App Store iPhone 6,9" 1320 x 2868, 6,3" 1206 x 2622
# and iPad 13" 2064 x 2752), from scratch: a throwaway database with the
# demo data, the API with its clock set to 14:05 at the parking, the two apps built for the web, a staged day at
# the demo parking (scenario.mjs, stage.sql), then Chromium drives the apps (capture.mjs). See README.md.
#
#   createdb plazo_shots   # a new, empty database: nothing is ever wiped
#   SHOTS_DATABASE_URL=postgresql://user:pass@localhost:5432/plazo_shots brand/stores/tools/screenshots/run.sh
#
# Needs Node 22, Flutter (FLUTTER, default `flutter`), psql, Playwright's Chromium, and network access to the IGN
# map tiles and the parkings' photos. Output: brand/stores/screenshots/{plazo,plazo-pro}/*.png, …/app-store/*.png and
# …/app-store-6.3/*.png and …/app-store-ipad-13/*.png (OUT_DIR); DEVICES to take only some of them.
#
# API_ONLY=1 (Android emulator workflow, mobile-android-emulator.yml): no web build and no screenshot; once the day is
# staged, touches $WORK/api.ready and keeps the API running (the native apps call it), $WORK/scenario.json giving
# the traveller links and the booking shown in Plazo Pro. MANAGER_PASSWORD, when set, is the demo manager's password.
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../../.." && pwd)
WORK=${WORK:-$(mktemp -d)}
OUT_DIR=${OUT_DIR:-$ROOT/brand/stores/screenshots}
API_PORT=${API_PORT:-3006}
TRAVELLER_PORT=${TRAVELLER_PORT:-8191}
PRO_PORT=${PRO_PORT:-8192}
FLUTTER=${FLUTTER:-flutter}
LOCAL_TIME=${LOCAL_TIME:-14:05}
: "${SHOTS_DATABASE_URL:?a new, empty PostgreSQL + PostGIS database whose name ends in _shots}"
DB_NAME=${SHOTS_DATABASE_URL##*/}
DB_NAME=${DB_NAME%%\?*}
case "$DB_NAME" in *_shots) ;; *) echo "The database name must end in _shots (got $DB_NAME)" >&2; exit 1 ;; esac
# Never on a database in use: the run rewrites the demo bookings. Nothing is ever dropped either.
if [ -n "$(psql "$SHOTS_DATABASE_URL" -Atc "select to_regclass('public._prisma_migrations')")" ]; then
  echo "$DB_NAME is not empty: create a new database for the screenshots (createdb …_shots)" >&2; exit 1
fi

PIDS=()
cleanup() { for pid in "${PIDS[@]:-}"; do [ -n "$pid" ] && kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT
mkdir -p "$WORK"
rm -f "$WORK/api.ready"
echo "work folder: $WORK"

# The API's clock: the parking (Europe/Paris) reads LOCAL_TIME today, whatever the hour of the run.
OFFSET=$(node -e '
  const [h, m] = process.argv[1].split(":").map(Number);
  const now = new Date();
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now).map(x => [x.type, x.value]));
  const nowMin = Number(p.hour) * 60 + Number(p.minute) + Number(p.second) / 60;
  console.log(Math.round((h * 60 + m - nowMin) * 60000));
' "$LOCAL_TIME")
PASSWORD=${MANAGER_PASSWORD:-$(node -e 'console.log(require("crypto").randomBytes(18).toString("base64url"))')}
SECRET=$(node -e 'console.log(require("crypto").randomBytes(24).toString("hex"))')

api_env() {
  # $1 = with_services (placeholder keys so the dashboard's services read as in production; no real call is made
  # for flights: their base URL is a closed local port)
  local env=(NODE_ENV=test PORT="$API_PORT" DATABASE_URL="$SHOTS_DATABASE_URL" DIRECT_URL="$SHOTS_DATABASE_URL" POSTGRES_PRISMA_URL=
    SECRET_KEY="$SECRET" CRON_SECRET=shots CLIENT_URL="http://localhost:$TRAVELLER_PORT,http://localhost:$PRO_PORT"
    STRIPE_SECRET_KEY=sk_test_screenshots STRIPE_PUBLISHABLE_KEY=pk_test_screenshots PLATFORM_COMMISSION_BPS=1500
    PLAZO_CLOCK_OFFSET_MS="$OFFSET")
  if [ "${1:-}" = with_services ]; then
    env+=(AERODATABOX_API_KEY=screenshots AERODATABOX_BASE_URL=http://127.0.0.1:9 BREVO_API_KEY=screenshots
      SMS_SENDER=Plazo ONESIGNAL_APP_ID=00000000-0000-4000-8000-000000000000 ONESIGNAL_REST_API_KEY=screenshots)
  fi
  printf '%s\n' "${env[@]}"
}
start_api() {
  mapfile -t ENV < <(api_env "${1:-}")
  # exec: the PID kept is node's own, so that `kill` stops the API (not just a subshell around it).
  (cd "$ROOT/backend" && exec env -i PATH="$PATH" HOME="$HOME" "${ENV[@]}" node -r "$HERE/fake-clock.cjs" lib/server.js > "$WORK/api.log" 2>&1) &
  API_PID=$!
  PIDS+=("$API_PID")
  for _ in $(seq 1 60); do curl -sf "http://localhost:$API_PORT/api/health" > /dev/null && return 0; sleep 1; done
  echo "The API did not start" >&2; cat "$WORK/api.log" >&2; exit 1
}

echo "== backend: build, database, demo data"
(cd "$ROOT/backend" && [ "${SKIP_BACKEND_BUILD:-}" = 1 ] || npm run build > "$WORK/backend-build.log" 2>&1)
(cd "$ROOT/backend" && DATABASE_URL="$SHOTS_DATABASE_URL" DIRECT_URL="$SHOTS_DATABASE_URL" npx prisma migrate deploy > "$WORK/migrate.log" 2>&1)
mapfile -t ENV < <(api_env)
(cd "$ROOT/backend" && env -i PATH="$PATH" HOME="$HOME" "${ENV[@]}" DEMO_SEED_PASSWORD="$PASSWORD" node -r "$HERE/fake-clock.cjs" lib/scripts/seed-demo.js --apply)

if [ -z "${API_ONLY:-}" ]; then
  echo "== the apps for the web"
  for flavor in traveller pro; do
    if [ "${SKIP_FLUTTER_BUILD:-}" = 1 ] && [ -f "$WORK/web-$flavor/index.html" ]; then continue; fi
    (cd "$ROOT/mobile" && "$FLUTTER" build web --release --no-web-resources-cdn --dart-define=APP_FLAVOR=$flavor \
      --dart-define=API_BASE_URL="http://localhost:$API_PORT/api" -o "$WORK/web-$flavor" > "$WORK/flutter-$flavor.log" 2>&1)
  done
  node "$HERE/serve.mjs" "$WORK/web-traveller" "$TRAVELLER_PORT" > "$WORK/serve-traveller.log" 2>&1 & PIDS+=("$!")
  node "$HERE/serve.mjs" "$WORK/web-pro" "$PRO_PORT" > "$WORK/serve-pro.log" 2>&1 & PIDS+=("$!")
fi

echo "== a day at the demo parking"
start_api
export API="http://localhost:$API_PORT/api" MANAGER_PASSWORD="$PASSWORD" PLAZO_CLOCK_OFFSET_MS="$OFFSET"
node "$HERE/scenario.mjs" prepare > "$WORK/scenario.json"
psql "$SHOTS_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$HERE/stage.sql"
kill "$API_PID"; wait "$API_PID" 2>/dev/null || true
if curl -sf "http://localhost:$API_PORT/api/health" > /dev/null; then echo "Port $API_PORT is still taken" >&2; exit 1; fi
start_api with_services
if [ -n "${API_ONLY:-}" ]; then
  touch "$WORK/api.ready"
  echo "API ready: http://localhost:$API_PORT/api (scenario: $WORK/scenario.json)"
  wait "$API_PID"
  exit 0
fi

echo "== screenshots"
export SCENARIO="$WORK/scenario.json" TRAVELLER_URL="http://localhost:$TRAVELLER_PORT" PRO_URL="http://localhost:$PRO_PORT"
# Google Play (1080 x 1920) at the root of each app's folder, the App Store's iPhone 6,9" (1320 x 2868) in app-store/,
# its iPhone 6,3" (1206 x 2622) in app-store-6.3/ and its iPad 13" (2064 x 2752) in app-store-ipad-13/. DEVICES chooses
# the passes (all by default). The pro run chooses the manager's post and starts a shuttle trip: the day is put back
# before each later pass (the trip simply closed, its passengers still on site, so that `scenario.mjs trip` can start
# it again).
reset_day() {
  psql "$SHOTS_DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "UPDATE shuttle_trips SET status='ended', \"endedAt\"=now(), lat=NULL, lng=NULL, \"accuracyM\"=NULL, \"positionRecordedAt\"=NULL, \"positionReceivedAt\"=NULL WHERE status='running'; UPDATE staff SET post=NULL, \"postSetAt\"=NULL, \"vehicleId\"=NULL;"
}
folder_of() {
  case "$1" in
    phone) echo "" ;;
    iphone) echo "/app-store" ;;
    iphone63) echo "/app-store-6.3" ;;
    ipad13) echo "/app-store-ipad-13" ;;
    *) echo "Unknown device $1" >&2; exit 1 ;;
  esac
}
FIRST=1
for device in ${DEVICES:-phone iphone iphone63 ipad13}; do
  sub=$(folder_of "$device")
  [ "$FIRST" = 1 ] || reset_day
  FIRST=0
  DEVICE=$device OUT="$OUT_DIR/plazo$sub" node "$HERE/capture.mjs" traveller
  DEVICE=$device OUT="$OUT_DIR/plazo-pro$sub" node "$HERE/capture.mjs" pro
done
echo "done: $OUT_DIR"
