#!/usr/bin/env python3
"""Fictional data on the platform's own test operator « Plazo (tests) » (workflow test-parking-data.yml, 12/10/2026).

Fills the test parking with a believable day around the moment of the run, through the API (the same rules as the
pro space), so that Plazo Pro can be filmed or shown without anyone's real data: the shuttle videos of the Google Play
foreground-service declaration, a demo, a check before a store review.

Actions (ACTION):
  fill    (default) shuttle tracking on « Équipe et clients », one shuttle vehicle in service, and 8 fictional
          bookings placed relative to now: 2 cars « Sur place » waiting for the shuttle to the terminal, 2 arrivals
          later today, 2 travellers coming back today (car parked, « À récupérer »), 2 arrivals tomorrow
  clear   closes the fictional bookings: « Attendu » ones are cancelled, the others handed back

Idempotent: a shuttle trip left running is ended first, then every booking is found again by its plate (TS-1xx-PZ, a
range kept for these tests), moved back to « Attendu », given its new dates, then moved forward to its state of the
day, so running it again (after a filming, the next day) refreshes the day without piling up bookings. Fictional people only: names, plates, phones in the 06 39 98 range (kept for fiction by
the ARCEP), no e-mail address, « Ne pas envoyer » set on the day-before SMS: no message ever reaches anyone.

Refuses any operator but the test one (its name ends in « (tests) »): never the client n°1's parking.

Environment: PLAZO_API (default https://www.plazo.fr/api), PLAZO_TEST_EMAIL and PLAZO_TEST_PASSWORD (repository
secrets, never printed): an « Accueil » member of « Plazo (tests) », never a manager, since a manager of that operator
could reset the platform admin's password. An Accueil account does everything but the two manager settings (shuttle
tracking, adding a vehicle): those are only checked, with a warning when a manager has to set them. Standard library
only.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from collections import deque
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

API = (os.environ.get("PLAZO_API", "").strip() or "https://www.plazo.fr/api").rstrip("/")
EMAIL = os.environ.get("PLAZO_TEST_EMAIL", "").strip()
PASSWORD = os.environ.get("PLAZO_TEST_PASSWORD", "")
ACTION = os.environ.get("ACTION", "").strip() or "fill"

NOTE = "Réservation fictive (données de test Plazo)"
VEHICLE = {"model": "Renault Trafic (test)", "colour": "blanc", "plate": "TS-100-PZ", "seats": 8, "inService": True}

# The status moves the API allows (backend/src/domain/reservation.ts, NEXT_STATUSES).
MOVES = {
    "upcoming": ["arrived", "cancelled", "no_show"],
    "arrived": ["shuttled_out", "return_requested", "back_at_parking", "returned", "upcoming"],
    "shuttled_out": ["return_requested", "back_at_parking", "returned", "arrived"],
    "return_requested": ["back_at_parking", "returned", "shuttled_out"],
    "back_at_parking": ["returned", "return_requested"],
    "returned": ["back_at_parking"],
    "cancelled": ["upcoming"],
    "no_show": ["upcoming"],
}

token = None
role = None


def fail(message):
    print(f"::error::{message}")
    sys.exit(1)


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(f"{API}{path}", data=data, method=method)
    request.add_header("content-type", "application/json")
    request.add_header("user-agent", "plazo-test-data")
    if token:
        request.add_header("authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            text = response.read().decode()
            return json.loads(text) if text else None
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read().decode())
            detail = f"{detail.get('code') or ''} {detail.get('message') or ''}".strip()
        except Exception:
            detail = ""
        raise RuntimeError(f"{method} {path.split('?')[0]} → {error.code} {detail}") from None


def local(dt):
    """The API's local date-time of the parking: « 2026-10-12T14:05 »."""
    return dt.strftime("%Y-%m-%dT%H:%M")


def rounded(dt):
    return dt.replace(minute=dt.minute - dt.minute % 5, second=0, microsecond=0)


def day_at(now, days, hhmm):
    hour, minute = map(int, hhmm.split(":"))
    return (now + timedelta(days=days)).replace(hour=hour, minute=minute, second=0, microsecond=0)


def bookings(now):
    """The day, relative to now (parking local time). `state`: the status to reach."""
    m = lambda minutes: rounded(now + timedelta(minutes=minutes))
    return [
        # Dropped off a little while ago: « À emmener » in the driver's « Ma tournée » (drop-off to the terminal).
        dict(plate="TS-101-PZ", first="Léa", last="Martin", phone="+33 6 39 98 00 01", channel="phone", pax=2,
             model="Peugeot 208", colour="blanche", arrival=m(-35), ret=day_at(now, 3, "18:40"), state="arrived"),
        dict(plate="TS-102-PZ", first="Thomas", last="Bernard", phone="+33 6 39 98 00 02", channel="aggregator",
             detail="Allopark", pax=3, model="Renault Clio", colour="grise", arrival=m(-15), ret=day_at(now, 5, "21:10"),
             state="arrived"),
        # Later today.
        dict(plate="TS-103-PZ", first="Camille", last="Petit", phone="+33 6 39 98 00 03", channel="website", pax=1,
             model="Toyota Yaris", colour="rouge", arrival=m(50), ret=day_at(now, 4, "16:20"), state="upcoming"),
        dict(plate="TS-104-PZ", first="Hugo", last="Moreau", phone="+33 6 39 98 00 04", channel="counter", pax=4,
             model="Citroën C4", colour="bleue", arrival=m(150), ret=day_at(now, 7, "10:30"), state="upcoming"),
        # Coming back today: « À récupérer » (car parked, traveller away).
        dict(plate="TS-105-PZ", first="Chloé", last="Laurent", phone="+33 6 39 98 00 05", channel="aggregator",
             detail="Onepark", pax=2, model="Volkswagen Golf", colour="noire", arrival=day_at(now, -4, "06:30"),
             ret=m(80), state="shuttled_out"),
        dict(plate="TS-106-PZ", first="Nathan", last="Roux", phone="+33 6 39 98 00 06", channel="phone", pax=1,
             model="Dacia Sandero", colour="grise", arrival=day_at(now, -6, "09:10"), ret=m(180), state="shuttled_out"),
        # Tomorrow.
        dict(plate="TS-107-PZ", first="Manon", last="Garcia", phone="+33 6 39 98 00 07", channel="website", pax=2,
             model="Kia Niro", colour="verte", arrival=day_at(now, 1, "07:15"), ret=day_at(now, 9, "19:45"), state="upcoming"),
        dict(plate="TS-108-PZ", first="Lucas", last="Fontaine", phone="+33 6 39 98 00 08", channel="aggregator",
             detail="Parclick", pax=2, model="Tesla Model 3", colour="blanche", arrival=day_at(now, 1, "10:40"),
             ret=day_at(now, 3, "22:05"), state="upcoming"),
    ]


def path_to(start, goal):
    """The shortest chain of allowed status moves from `start` to `goal` (the API refuses any other)."""
    if start == goal:
        return []
    seen, queue = {start}, deque([(start, [])])
    while queue:
        status, steps = queue.popleft()
        for nxt in MOVES.get(status, []):
            if nxt in seen:
                continue
            if nxt == goal:
                return steps + [nxt]
            seen.add(nxt)
            queue.append((nxt, steps + [nxt]))
    raise RuntimeError(f"no way from {start} to {goal}")


def move(reservation, goal):
    for status in path_to(reservation["status"], goal):
        reservation = call("POST", f"/internal/reservations/{reservation['id']}/status", {"status": status})
        reservation = reservation.get("data", reservation)
    return reservation


def find(plate):
    """The fictional booking with this plate on the test operator (the most recent if a hand-made one shares it)."""
    found = call("GET", f"/internal/reservations?q={plate.replace('-', '')}&limit=50")
    rows = [r for r in (found.get("docs") or found.get("data") or []) if r.get("plateKey") == plate.replace("-", "")]
    rows.sort(key=lambda r: r.get("createdAt") or "", reverse=True)
    return rows[0] if rows else None


def login():
    global token, role
    if not EMAIL or not PASSWORD:
        fail("PLAZO_TEST_EMAIL and PLAZO_TEST_PASSWORD are required (repository secrets)")
    # A secret pasted with a line break or a space at an end is tried once more without it (2 attempts at most: the API
    # locks an address after 8 failures in 15 minutes).
    trimmed = PASSWORD.strip()
    candidates = [PASSWORD] + ([trimmed] if trimmed and trimmed != PASSWORD else [])
    session = None
    for candidate in candidates:
        try:
            session = call("POST", "/internal/auth/login", {"email": EMAIL, "password": candidate})
            break
        except RuntimeError as error:
            if "→ 401" not in str(error):
                raise
    if session is None:
        fail("Sign-in refused (401 invalid_credentials): check that the member exists and is active in « Plazo (tests) » › "
             "Équipe, and that the secrets PLAZO_TEST_EMAIL and PLAZO_TEST_PASSWORD hold exactly its email and password")
    if candidate != PASSWORD:
        print("::warning::PLAZO_TEST_PASSWORD has a space or a line break at an end: signed in without it")
    token = session["tokenData"]["access"]["token"]
    operator = (session.get("user") or {}).get("operatorName") or ""
    if not operator.endswith("(tests)"):
        fail(f"Refused: this account belongs to « {operator} », not to the test operator « … (tests) »")
    role = (session.get("user") or {}).get("role")
    if role not in ("agent", "manager"):
        fail("Refused: the account must be an « Accueil » member (or a manager) of the test operator")
    if role == "manager":
        print("::warning::This account is a manager: an « Accueil » account is enough and cannot reset the platform admin's password")
    print(f"Signed in to « {operator} » ({API})")


def end_running_trips():
    """A shuttle trip left running by the last filming would move the refreshed cars when it ends: end it first."""
    live = call("GET", "/internal/shuttle/live") or {}
    for trip in live.get("trips") or []:
        call("POST", f"/internal/shuttle/trips/{trip['id']}/end", {})
        print(f"Shuttle trip left running: ended ({trip.get('vehicleModel') or 'navette'})")


def fill():
    end_running_trips()
    parking = call("GET", "/internal/parking")
    parking = parking.get("data", parking)
    zone = ZoneInfo(parking.get("timezone") or "Europe/Paris")
    now = datetime.now(zone).replace(tzinfo=None)
    print(f"Parking « {parking['name']} », {now:%d/%m/%Y %H:%M} at the parking")

    tracking = parking.get("shuttleTracking")
    if tracking != "everyone" and role == "manager":
        call("PUT", f"/internal/parkings/{parking['id']}/shuttle-tracking", {"tracking": "everyone"})
        print("Shuttle tracking: « Équipe et clients »")
    elif tracking == "off":
        print("::warning::Shuttle tracking is « Désactivé »: a manager sets it to « Équipe et clients » "
              "(Parking › Réglages › Suivi des navettes), else no position is shared while filming")
    elif tracking != "everyone":
        print("Shuttle tracking: « Équipe seulement » (travellers see no shuttle; a manager can set « Équipe et clients »)")

    vehicles = call("GET", "/internal/shuttle/vehicles")
    vehicles = vehicles.get("data", vehicles) if isinstance(vehicles, dict) else vehicles
    if not any(v.get("inService") for v in vehicles) and role != "manager":
        print("::warning::No shuttle vehicle in service: a manager adds one (Parking › Réglages › Véhicules de navette) "
              "before a trip can start")
    elif not any(v.get("inService") for v in vehicles):
        test_vehicle = next((v for v in vehicles if v.get("plate") == VEHICLE["plate"]), None)
        if test_vehicle:
            call("PATCH", f"/internal/shuttle/vehicles/{test_vehicle['id']}", {"inService": True})
        else:
            call("POST", "/internal/shuttle/vehicles", VEHICLE)
        print(f"Shuttle vehicle in service: {VEHICLE['model']} {VEHICLE['plate']}")

    for b in bookings(now):
        fields = {
            "arrivalAt": local(b["arrival"]),
            "returnAt": local(b["ret"]),
            "passengers": b["pax"],
            "customerFirstName": b["first"],
            "customerLastName": b["last"],
            "customerPhone": b["phone"],
            "plate": b["plate"],
            "vehicleModel": b["model"],
            "vehicleColour": b["colour"],
            "notes": NOTE,
        }
        existing = find(b["plate"])
        if existing:
            reservation = move(existing, "upcoming")
            reservation = call("PATCH", f"/internal/reservations/{reservation['id']}", fields)
            reservation = reservation.get("data", reservation)
            verb = "refreshed"
        else:
            body = dict(fields, channel=b["channel"], **({"channelDetail": b["detail"]} if b.get("detail") else {}))
            reservation = call("POST", "/internal/reservations", body)
            reservation = reservation.get("data", reservation)
            verb = "created"
        # Never a day-before SMS to the fictional phone (the operator may have an SMS channel).
        try:
            call("PUT", f"/internal/reservations/{reservation['id']}/reminder", {"excluded": True})
        except RuntimeError as error:
            print(f"  (day-before SMS not excluded: {error})")
        reservation = move(reservation, b["state"])
        print(f"{b['plate']} {b['first']} {b['last']}: {verb}, {reservation['status']}, "
              f"{fields['arrivalAt'].replace('T', ' ')} → {fields['returnAt'].replace('T', ' ')}")


def clear():
    end_running_trips()
    for plate in [f"TS-1{n:02d}-PZ" for n in range(1, 9)]:
        existing = find(plate)
        if not existing:
            continue
        goal = "cancelled" if existing["status"] in ("upcoming", "cancelled", "no_show") else "returned"
        reservation = move(existing, goal) if existing["status"] != goal else existing
        print(f"{plate}: {reservation['status']}")


def main():
    if "plazo.fr" not in API and not API.startswith("http://localhost"):
        print(f"API: {API}")
    login()
    if ACTION == "fill":
        fill()
    elif ACTION == "clear":
        clear()
    else:
        fail(f"Unknown ACTION « {ACTION} » (fill, clear)")
    print("Done.")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        fail(str(error))
