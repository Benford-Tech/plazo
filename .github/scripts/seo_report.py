"""Prints Plateforme › Référencement (26/11/2026, « Viser des recherches plus précises »): the Google searches that show
Plazo, their position, clicks and impressions, and the pages Google shows, for DAYS days (7, 30 or 90).

Signs in with PLAZO_ADMIN_EMAIL / PLAZO_ADMIN_PASSWORD and reads GET /internal/platform/seo. Search words only, never a
visitor; the session is closed at the end.
"""
import json
import os
import sys
import urllib.error
import urllib.request

API = (os.environ.get("PLAZO_API", "").strip() or "https://www.plazo.fr/api").rstrip("/")
ADMIN_EMAIL = os.environ.get("PLAZO_ADMIN_EMAIL", "").strip()
ADMIN_PASSWORD = os.environ.get("PLAZO_ADMIN_PASSWORD", "")
DAYS = os.environ.get("DAYS", "90").strip() or "90"


def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(f"{API}{path}", data=data, method=method)
    request.add_header("content-type", "application/json")
    request.add_header("user-agent", "plazo-seo-report")
    if token:
        request.add_header("authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            text = response.read().decode()
            return json.loads(text) if text else None
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"{method} {path.split('?')[0]} → {error.code}") from None


def pos(value):
    return "-" if value is None else f"{value:.1f}"


def main():
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        print("::error::PLAZO_ADMIN_EMAIL and PLAZO_ADMIN_PASSWORD are required")
        sys.exit(1)
    if DAYS not in ("7", "30", "90"):
        print("::error::DAYS must be 7, 30 or 90")
        sys.exit(1)
    session = call("POST", "/internal/auth/login", {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    token = (((session or {}).get("tokenData") or {}).get("access") or {}).get("token")
    if not token:
        print("::error::login returned no token")
        sys.exit(1)
    try:
        report = call("GET", f"/internal/platform/seo?days={DAYS}", token=token)
        sc = report.get("searchConsole") or {}
        print(f"Search Console · {sc.get('property')} · dernière lecture {sc.get('lastSyncAt')} · dernier jour {sc.get('lastDate')}")
        if sc.get("lastError"):
            print(f"Dernière erreur : {sc.get('lastError')}")
        totals = sc.get("totals") or {}
        print(f"Sur {DAYS} jours : {totals.get('clicks', 0)} clics, {totals.get('impressions', 0)} affichages, position moyenne {pos(totals.get('position'))}")
        print("\nRecherches (clics · affichages · position · avant · page)")
        for q in sc.get("queries") or []:
            print(f"  {q['clicks']:>4} · {q['impressions']:>6} · {pos(q.get('position')):>5} · {pos(q.get('previous')):>5} · {q['query']} → {q['page']}")
        print("\nPages (clics · affichages · position · avant)")
        for p in sc.get("pages") or []:
            print(f"  {p['clicks']:>4} · {p['impressions']:>6} · {pos(p.get('position')):>5} · {pos(p.get('previous')):>5} · {p['page']}")
        print("\nPages d'entrée sur le site (visites · dont moteur · réservations)")
        for p in report.get("pages") or []:
            print(f"  {p['visits']:>5} · {p['searchVisits']:>5} · {p['bookings']:>3} · {p['landing']}")
    finally:
        try:
            call("POST", "/internal/auth/logout", token=token)
        except Exception:
            pass


if __name__ == "__main__":
    main()
