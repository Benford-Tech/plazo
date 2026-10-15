#!/usr/bin/env bash
# Plazo and Plazo Pro on an Android emulator (release APKs, R8 on): do they start, and do they draw correctly
# edge-to-edge (Android 15 and 16, apps targeting SDK 35+)? Screenshots of the first screens in gesture navigation,
# then in 3-button navigation with a tall display cutout, portrait; then Stripe's payment sheet (smoke APK).
#
# Run by .github/workflows/mobile-android-emulator.yml inside reactivecircus/android-emulator-runner, as ONE line
# (the action runs every line of its `script` in its own `sh -c`). Needs on the runner: adb, jq, python3, the APKs
# in APK_DIR (plazo.apk, plazo-pro.apk, optionally stripe-smoke.apk), the demo API of
# brand/stores/tools/screenshots/run.sh (API_ONLY=1) on API_PORT with its SCENARIO json, MANAGER_PASSWORD (the demo
# manager's). Output in OUT: <variant>/<screen>.png, logcat-*.txt, crash-*.txt, summary.md.
# Exit 1 when an app did not start or crashed (R8, edge-to-edge setup...), not for a missing tap or a slow screen.
#
# No `set -e`: every step is checked and recorded as an error or a warning, and the run goes on to take every screen.
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${OUT:?folder for the screenshots}
APK_DIR=${APK_DIR:?folder of the APKs}
API_PORT=${API_PORT:-3006}
SCENARIO=${SCENARIO:-}
LOCAL_TIME=${LOCAL_TIME:-14:05}
MANAGER_EMAIL=${MANAGER_EMAIL:-demo-parkair-lyon@plazo.test}
MANAGER_PASSWORD=${MANAGER_PASSWORD:-}
TRAVELLER=com.benfordtech.plazo
PRO=com.benfordtech.plazopro
# The Kotlin package of MainActivity (`namespace` in android/app/build.gradle.kts), not the store id.
ACTIVITY=com.benfordtech.parking_app.MainActivity
ERRORS=()
WARNINGS=()
VARIANT=setup
mkdir -p "$OUT"
{ [ -n "$SCENARIO" ] && [ -f "$SCENARIO" ]; } || SCENARIO=""

error() { echo "::error::API ${SDK:-?} ($VARIANT) : $*"; ERRORS+=("$VARIANT : $*"); }
warn() { echo "::warning::API ${SDK:-?} ($VARIANT) : $*"; WARNINGS+=("$VARIANT : $*"); }
ui() { python3 "$HERE/ui.py" "$@"; }

# ── Device ─────────────────────────────────────────────────────────────────────────────────────────
adb wait-for-device
for _ in $(seq 1 150); do [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ] && break; sleep 2; done
SDK=$(adb shell getprop ro.build.version.sdk | tr -d '\r')
echo "Android API $SDK · $(adb shell wm size | tr -d '\r') · $(adb shell wm density | tr -d '\r')"

# The demo API's clock reads LOCAL_TIME at the parking (fake-clock.cjs): the device follows it, so that the apps'
# countdowns agree with the staged day. Best effort: a google_apis image lets adbd run as root.
if [ -n "$SCENARIO" ]; then
  # Read first: `date -d ""` is today's midnight, a number that would pass the check below.
  SERVER_NOW=$(jq -r '.serverNow // empty' "$SCENARIO" 2> /dev/null)
  [ -z "$SERVER_NOW" ] || SERVER_NOW=$(date -d "$SERVER_NOW" +%s 2> /dev/null)
  adb root > /dev/null 2>&1
  sleep 2
  adb wait-for-device
  if ! [[ "$SERVER_NOW" =~ ^[0-9]+$ ]]; then
    warn "pas de serverNow lisible dans $SCENARIO : l'appareil garde l'heure réelle"
  elif [ "$(adb shell id -u | tr -d '\r')" != 0 ]; then
    warn "pas de root : l'appareil garde l'heure réelle"
  else
    # scenario.json's mtime is the real time at which `scenario.mjs prepare` printed it, seconds after it read the
    # API's serverNow: close enough for countdowns shown to the minute.
    OFFSET=$(( SERVER_NOW - $(stat -c %Y "$SCENARIO") ))
    adb shell settings put global auto_time 0
    adb shell date -u "$(date -u -d "@$(( $(date +%s) + OFFSET ))" +%m%d%H%M%Y.%S)" > /dev/null \
      || warn "horloge de l'appareil non réglée : les comptes à rebours suivent l'heure réelle"
  fi
fi

# The apps call the runner's demo API on 127.0.0.1 (loopback: plain http is always allowed by Flutter).
adb reverse "tcp:$API_PORT" "tcp:$API_PORT" > /dev/null || error "adb reverse impossible : les apps ne joignent pas l'API de démonstration"
# Checked from the runner: the device's shell has no reliable HTTP client (toybox nc closes on end of input, before the
# answer: a false « ne répond pas » on 15/10/2026 while the apps showed the demo data). Read whole, then matched (a
# `grep -q` closing the pipe early would fail it under pipefail).
REVERSED=$(adb reverse --list 2> /dev/null)
if ! curl -sf -m 10 "http://127.0.0.1:$API_PORT/api/health" > /dev/null; then
  warn "l'API de démonstration ne répond pas sur le runner : écrans hors ligne"
elif [[ "$REVERSED" != *"tcp:$API_PORT"* ]]; then
  warn "port $API_PORT non renvoyé vers l'émulateur (adb reverse) : écrans hors ligne"
fi

# Portrait, fixed; status bar in demo mode (clock, full battery, no notification icons): stable screenshots.
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 0
adb shell settings put global sysui_demo_allowed 1
# No « isn't responding » dialog: the emulator's software GPU can hold Flutter's surface creation for ~10 s on a cold
# start (ANR traces of 15/10/2026: main thread in FlutterJNI.nativeSurfaceCreated), and the dialog then covered the
# screenshots and swallowed a BACK meant for the Stripe sheet. The ANRs stay in the logs and are still reported.
adb shell settings put global hide_error_dialogs 1
demo() { adb shell am broadcast -a com.android.systemui.demo -e command "$@" > /dev/null; }
status_bar_demo() { # sent again after each change of navigation mode or cutout, which may redraw SystemUI's bars
  demo enter
  demo clock -e hhmm "${LOCAL_TIME/:/}"
  demo battery -e level 100 -e plugged false
  demo network -e wifi show -e level 4 -e mobile show -e datatype none
  demo notifications -e visible false
}

# -g: runtime permissions granted (no location or notification dialog over the screens).
for apk in plazo plazo-pro; do
  adb install -r -g "$APK_DIR/$apk.apk" > /dev/null || error "installation de $apk.apk impossible"
done
adb logcat -c

# ── Helpers ────────────────────────────────────────────────────────────────────────────────────────
variant() { # gesture | buttons-cutout
  VARIANT=$1
  mkdir -p "$OUT/$VARIANT"
  local mode current overlay
  case "$1" in
    gesture)
      mode=2
      adb shell cmd overlay enable-exclusive --category com.android.internal.systemui.navbar.gestural \
        || error "navigation par gestes indisponible"
      # No display cutout: every enabled emulation overlay (« [x] com.android.internal.display.cutout.emulation.tall »,
      # « …noCutout », « …emu01 »...) is turned off.
      for overlay in $(adb shell cmd overlay list | tr -d '\r' \
          | sed -n 's/^[[:space:]]*\[x\] \(com\.android\.internal\.display\.cutout\.emulation\.[^[:space:]]*\).*/\1/p'); do
        adb shell cmd overlay disable "$overlay" > /dev/null || warn "encoche simulée $overlay non retirée"
      done ;;
    buttons-cutout)
      mode=0
      adb shell cmd overlay enable-exclusive --category com.android.internal.systemui.navbar.threebutton \
        || error "navigation à 3 boutons indisponible"
      adb shell cmd overlay enable-exclusive --category com.android.internal.display.cutout.emulation.tall \
        || warn "pas d'encoche simulée sur cette image" ;;
  esac
  sleep 4
  status_bar_demo
  current=$(adb shell settings get secure navigation_mode | tr -d '\r')
  echo "── $VARIANT : navigation_mode=$current (0 = 3 boutons, 2 = gestes)"
  [ "$current" = "$mode" ] || warn "navigation_mode=$current au lieu de $mode"
}

# Logs so far (main + crash buffers). A crash of one of the apps is an error (R8 removing a class, a bad window
# setup...); one of another process of the image (Google services...) only a warning.
save_logs() { # name
  local dart
  adb logcat -d > "$OUT/logcat-$1.txt"
  adb logcat -d -b crash > "$OUT/crash-$1.txt"
  if grep -q 'com\.benfordtech\.' "$OUT/crash-$1.txt"; then
    error "plantage d'une des apps (crash-$1.txt)"
  elif [ -s "$OUT/crash-$1.txt" ]; then
    warn "plantage d'un autre processus de l'émulateur (crash-$1.txt)"
  fi
  # Dart errors, caught by main.dart's zone or not: a MissingPluginException is a plugin class R8 removed.
  dart=$(grep -cE ' flutter *: .*(Uncaught zone error|Unhandled Exception|MissingPluginException)' "$OUT/logcat-$1.txt")
  [ "$dart" = 0 ] || warn "$dart erreur(s) Dart dans logcat-$1.txt"
  # Cold starts of 5 s or more (« Displayed … +11s946ms »): the main thread is busy, which ends in an ANR. With the
  # Android stack traces (/data/anr, readable with the root taken at setup), they say what blocks it.
  slow=$(grep -oE 'Displayed com\.benfordtech\.[a-z]+/[^ ]+ for user 0: \+[0-9]+s[0-9]+ms' "$OUT/logcat-$1.txt" \
    | sed -E 's|Displayed com\.benfordtech\.([a-z]+)/.*\+([0-9]+)s([0-9]+)ms|\1 \2 \3|' \
    | awk '$2 >= 5 { printf "%s %s,%s s ; ", $1, $2, substr($3, 1, 1) }')
  [ -z "$slow" ] || warn "démarrage lent ($1) : $slow"
  if grep -q 'ANR in com\.benfordtech\.' "$OUT/logcat-$1.txt"; then
    warn "une app n'a pas répondu (ANR, logcat-$1.txt ; traces dans anr-$1/ quand l'émulateur les donne)"
    mkdir -p "$OUT/anr-$1"
    adb pull /data/anr "$OUT/anr-$1" > /dev/null 2>&1 || warn "traces d'ANR illisibles (pas de root)"
  fi
  adb logcat -c
}

alive() { # package
  adb shell pidof "$1" > /dev/null || { error "$1 ne tourne pas (plantage au démarrage ?)"; return 1; }
}

launch() { # package [route] [settle seconds]: a cold start, optionally on an app route (/plus, /pro/chiffre-affaires...)
  adb shell am force-stop "$1"
  # MAIN + LAUNCHER: the launcher's intent filter, which Android 13+ requires of the shell's explicit intents (an https
  # VIEW intent outside the traveller's App Links would be refused). The route goes in Flutter's `route` extra, read
  # before the intent's data (FlutterFragmentActivity.getInitialRoute); quoted again for the device's shell (?, &).
  local route=()
  if [ -n "${2:-}" ]; then route=(--es route "'$2'"); fi
  adb shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n "$1/$ACTIVITY" "${route[@]}" > /dev/null
  sleep "${3:-7}"
  alive "$1"
}

shot() { # name [settle seconds]
  sleep "${2:-2}"
  adb exec-out screencap -p > "$OUT/$VARIANT/$1.png"
  [ -s "$OUT/$VARIANT/$1.png" ] || error "capture vide : $1"
}

tab() { # package label-regex fallback-route name: a bottom tab by uiautomator, else by its route
  if ! ui tap "$2" --last --timeout 15; then
    warn "$4 : onglet « $2 » introuvable par uiautomator, ouvert par sa route"
    launch "$1" "$3" || return
  fi
  sleep 3
  alive "$1" && shot "$4"
}

# ── Plazo (traveller) ──────────────────────────────────────────────────────────────────────────────
traveller() {
  local key
  launch "$TRAVELLER" "" 9 || return
  shot plazo-01-rechercher 3
  tab "$TRAVELLER" '^Mes réservations' /ma-reservation plazo-02-mes-reservations
  tab "$TRAVELLER" '^Plus' /plus plazo-03-plus
  tab "$TRAVELLER" '^Rechercher' / plazo-04-retour-rechercher
  launch "$TRAVELLER" /lyon-saint-exupery/recherche && shot plazo-05-resultats 3
  launch "$TRAVELLER" /lyon-saint-exupery/parkair-lyon && shot plazo-06-fiche-parking 3
  key=$( [ -n "$SCENARIO" ] && jq -r '.links.RDEMX1 // empty' "$SCENARIO")
  if [ -n "$key" ]; then
    # The return day: the booking's link (as in the confirmation email) keeps its key for « Ma voiture ».
    launch "$TRAVELLER" "/ma-reservation/RDEMX1?cle=$key" 9 && shot plazo-07-jour-du-retour
    launch "$TRAVELLER" /ma-reservation/RDEMX1/ma-voiture 9 && shot plazo-08-ma-voiture
  fi
}

# ── Plazo Pro ──────────────────────────────────────────────────────────────────────────────────────
pro() {
  local permission detail
  # Signed out in each variant: the sign-in screen first. Clearing the data may reset the runtime permissions: granted again.
  adb shell pm clear "$PRO" > /dev/null
  for permission in POST_NOTIFICATIONS ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do
    adb shell pm grant "$PRO" "android.permission.$permission" > /dev/null 2>&1
  done
  launch "$PRO" "" 9 || return
  shot pro-01-connexion
  [ -n "$MANAGER_PASSWORD" ] || { warn "pas de MANAGER_PASSWORD : Plazo Pro s'arrête à la connexion"; return; }
  # With the keyboard up the form must stay above it (edge-to-edge: Flutter's viewInsets, not adjustResize).
  ui field 1 || { warn "connexion : aucun champ trouvé"; return; }
  shot pro-02-connexion-clavier 2
  adb shell input text "$MANAGER_EMAIL"
  adb shell input keyevent KEYCODE_ENTER        # single-line field: « done », the keyboard closes
  sleep 1
  ui field 2 || { warn "connexion : champ du mot de passe introuvable"; return; }
  adb shell input text "$MANAGER_PASSWORD"
  adb shell input keyevent KEYCODE_ENTER        # onFieldSubmitted: signs in
  sleep 6
  alive "$PRO" || return
  if ui has 'je suis' --timeout 10; then        # « Aujourd'hui, je suis… » (post of the day)
    shot pro-03-poste-du-jour
    { ui tap '^Gérant' && ui tap "^C'est parti"; } || warn "poste du jour : « Gérant » puis « C'est parti » introuvables"
    sleep 6
  fi
  shot pro-04-tableau-de-bord 3
  tab "$PRO" '^Réservations' /pro/reservations pro-05-reservations
  tab "$PRO" '^Parking' /pro/parking pro-06-parking
  tab "$PRO" '^Plus' /pro/plus pro-07-plus
  # A page with its own status bar style (AnnotatedRegion: light icons on the dark green band).
  launch "$PRO" /pro/chiffre-affaires 9 && shot pro-08-chiffre-affaires
  detail=$( [ -n "$SCENARIO" ] && jq -r '.detailId // empty' "$SCENARIO")
  if [ -n "$detail" ]; then
    launch "$PRO" "/pro/reservations/$detail" 9 && shot pro-09-fiche-reservation
  fi
}

# ── Stripe payment sheet (lib/stripe_smoke_main.dart: same Android code and R8 run as Plazo) ─────────────
stripe_sheet() {
  local top="" log=""
  adb shell am force-stop "$PRO"   # nothing of Plazo Pro's run left over the sheet
  launch "$TRAVELLER" "" 3 || return
  for _ in $(seq 1 40); do
    top=$(adb shell dumpsys activity activities | tr -d '\r' | grep -m1 'ResumedActivity')
    case "$top" in *com.stripe.android*) break ;; esac
    log=$(adb logcat -d -s flutter:I | tr -d '\r')
    case "$log" in *'PLAZO_SMOKE result='*) break ;; esac
    sleep 1
  done
  case "$top" in
    *com.stripe.android*)
      shot stripe-01-feuille-de-paiement 6   # the sheet loads its payment methods from Stripe's API first
      adb shell input keyevent KEYCODE_BACK
      sleep 4
      # A BACK taken by something else (a system dialog, the keyboard): once more, while the sheet is still up.
      top=$(adb shell dumpsys activity activities | tr -d '\r' | grep -m1 'ResumedActivity')
      case "$top" in *com.stripe.android*) adb shell input keyevent KEYCODE_BACK; sleep 4 ;; esac ;;
  esac
  alive "$TRAVELLER" || return
  shot stripe-02-retour 1
  log=$(adb logcat -d -s flutter:I | tr -d '\r' | grep -o 'PLAZO_SMOKE .*')
  echo "$log"
  case "$log" in
    *'result=Canceled'*) echo "Feuille Stripe affichée puis fermée" ;;
    # An answer of Stripe's API (network, key, account settings): the SDK ran end to end, not an R8 problem.
    *'result=Failed'* | *'result=Timeout'*) warn "feuille Stripe non affichée : $(echo "$log" | grep -o 'result=.*' | tail -1)" ;;
    *) error "feuille Stripe : aucun résultat attendu (R8 ? voir logcat-stripe-$VARIANT.txt)" ;;
  esac
}

# ── Run ────────────────────────────────────────────────────────────────────────────────────────────
for v in gesture buttons-cutout; do
  variant "$v"
  traveller
  pro
  save_logs "apps-$v"
done
if [ -f "$APK_DIR/stripe-smoke.apk" ]; then
  # Same package and debug key as plazo.apk: replaces it, data kept.
  adb install -r "$APK_DIR/stripe-smoke.apk" > /dev/null || error "installation de stripe-smoke.apk impossible"
  for v in gesture buttons-cutout; do
    variant "$v"
    stripe_sheet
    save_logs "stripe-$v"
  done
fi

{
  echo "### Android API $SDK"
  echo
  echo "$(find "$OUT" -name '*.png' | wc -l) captures : gestes, puis 3 boutons avec encoche haute (artefact)."
  for e in "${ERRORS[@]}"; do echo "- ERREUR · $e"; done
  for w in "${WARNINGS[@]}"; do echo "- À voir · $w"; done
} > "$OUT/summary.md"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then cat "$OUT/summary.md" >> "$GITHUB_STEP_SUMMARY"; fi

[ "${#ERRORS[@]}" -eq 0 ]
