"""Corrects one imported booking of a parking from its comparator number (25/11/2026, « fais le » after the ParkMundo valet
fix): sets its plate and / or its handover (« valet » or « shuttle »), as a platform admin in consultation.

Signs in with PLAZO_ADMIN_EMAIL / PLAZO_ADMIN_PASSWORD, opens the one operator whose name contains OPERATOR (accents and
case ignored), finds the booking whose comparator number is REFERENCE, and, with APPLY=true, PATCHes it. A booking
that does not exist yet but whose email still waits in the inbox is analysed again instead. A plate already on the
booking is never replaced. Prints the Plazo reference and what changed, never a name, a phone or an e-mail.
"""
import json
import os
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

API = (os.environ.get("PLAZO_API", "").strip() or "https://www.plazo.fr/api").rstrip("/")
ADMIN_EMAIL = os.environ.get("PLAZO_ADMIN_EMAIL", "").strip()
ADMIN_PASSWORD = os.environ.get("PLAZO_ADMIN_PASSWORD", "")
OPERATOR = os.environ.get("OPERATOR", "").strip()
REFERENCE = os.environ.get("REFERENCE", "").strip().upper()
PLATE = os.environ.get("PLATE", "").strip().upper()
HANDOVER = os.environ.get("HANDOVER", "").strip().lower()
APPLY = os.environ.get("APPLY", "").strip().lower() == "true"


def fail(message):
    print(f"::error::{message}")
    sys.exit(1)


def fold(text):
    plain = unicodedata.normalize("NFD", text or "")
    return "".join(c for c in plain if unicodedata.category(c) != "Mn").lower().strip()


def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(f"{API}{path}", data=data, method=method)
    request.add_header("content-type", "application/json")
    request.add_header("user-agent", "plazo-reservation-fix")
    if token:
        request.add_header("authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            text = response.read().decode()
            return json.loads(text) if text else None
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read().decode())
            detail = f"{detail.get('code') or ''} {detail.get('message') or ''} {json.dumps(detail.get('fields') or {})}".strip()
        except Exception:
            detail = ""
        raise RuntimeError(f"{method} {path.split('?')[0]} → {error.code} {detail}") from None


def state(booking):
    return (f"{booking.get('reference')} · {booking.get('status')} · prise en charge {booking.get('handover')} · "
            f"plaque {'présente' if booking.get('plate') else 'absente'} · arrivée {booking.get('arrivalAt')} · "
            f"retour {booking.get('returnAt')} · prix {booking.get('priceCents')} · vols {booking.get('departureFlight')} / "
            f"{booking.get('returnFlight')} · passagers {booking.get('passengers')}")


def describe(mail):
    """What Plazo made of an inbox email, without its text nor anything personal."""
    reading = mail.get("reading") or {}
    change = mail.get("change") or {}
    return (f"  · reçu {mail.get('receivedAt')} · {mail.get('status')} · arrivé « {mail.get('delivery')} » · "
            f"objet « {mail.get('subject')} » · lecture {reading.get('source')}/{reading.get('kind')}/"
            f"{reading.get('provider')}/{reading.get('rule')} · manque {mail.get('missing')} · "
            f"changement {change.get('kind')}/{change.get('reason')} · texte {'gardé' if mail.get('text') or mail.get('body') else 'absent ?'} · "
            f"clés {sorted(k for k, v in mail.items() if v not in (None, [], ''))}")


def main():
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        fail("PLAZO_ADMIN_EMAIL and PLAZO_ADMIN_PASSWORD are required (repository secrets)")
    if not OPERATOR or not REFERENCE:
        fail("OPERATOR and REFERENCE are required")
    if HANDOVER not in ("", "valet", "shuttle"):
        fail("HANDOVER is « valet », « shuttle » or empty")

    session = call("POST", "/internal/auth/login", {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    admin = session["tokenData"]["access"]["token"]
    view = None
    try:
        listing = call("GET", "/internal/platform/operators", token=admin)
        wanted = fold(OPERATOR)
        matches = [o for o in listing.get("operators") or [] if wanted in fold(o.get("name"))]
        if len(matches) != 1:
            names = ", ".join(sorted(o.get("name") or "" for o in matches)) or "aucun"
            fail(f"« {OPERATOR} »: {len(matches)} operator(s) match ({names}); give a name that matches one")
        operator = matches[0]
        print(f"Loueur : {operator.get('name')}")
        view = call("POST", f"/internal/platform/operators/{operator['id']}/view-as", token=admin)["access"]["token"]

        found = call("GET", f"/internal/reservations?q={urllib.parse.quote(REFERENCE)}", token=view)
        bookings = [b for b in found.get("data") or [] if (b.get("externalReference") or "").upper() == REFERENCE]
        if not bookings:
            print(f"Aucune réservation ne porte le numéro {REFERENCE}.")
            inbox = call("GET", "/internal/inbound/emails?view=todo", token=view)
            waiting = [m for m in inbox.get("data") or []
                       if REFERENCE in json.dumps(m, ensure_ascii=False).upper() and not m.get("reservationId")]
            if not waiting:
                print("::warning::Aucun mail « À traiter » ne nomme ce numéro : rien à faire ici.")
                return
            print(f"{len(waiting)} mail(s) « À traiter » nomment ce numéro.")
            for mail in waiting:
                print(describe(mail))
            if not APPLY:
                print("Aperçu : relancer avec « appliquer » pour relancer leur analyse.")
                return
            for mail in waiting:
                result = call("POST", f"/internal/inbound/emails/{mail['id']}/reanalyse", token=view)
                print(f"Analyse relancée : {result.get('outcome')}")
                print(describe(result.get("email") or {}))
            return
        if len(bookings) > 1:
            fail(f"{len(bookings)} bookings carry {REFERENCE}: to settle by hand")
        booking = call("GET", f"/internal/reservations/{bookings[0]['id']}", token=view)
        booking = booking.get("data") or booking
        print(f"Avant : {state(booking)}")

        patch = {}
        if HANDOVER and booking.get("handover") != HANDOVER:
            patch["handover"] = HANDOVER
        if PLATE and not booking.get("plate"):
            patch["plate"] = PLATE
        elif PLATE and (booking.get("plate") or "").replace("-", "") != PLATE.replace("-", ""):
            print("::warning::La réservation a déjà une autre plaque : elle n'est pas remplacée.")
        if not patch:
            print("Rien à changer.")
            return
        print(f"À changer : {', '.join(sorted(patch))}")
        if not APPLY:
            print("Aperçu : relancer avec « appliquer » pour écrire.")
            return
        updated = call("PATCH", f"/internal/reservations/{booking['id']}", patch, token=view)
        updated = updated.get("data") or updated
        print(f"Après : {state(updated)}")
    except RuntimeError as error:
        fail(str(error))
    finally:
        for token in (view, admin):
            if token:
                try:
                    call("POST", "/internal/auth/logout", token=token)
                except RuntimeError:
                    pass


if __name__ == "__main__":
    main()
