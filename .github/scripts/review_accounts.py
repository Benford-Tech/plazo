"""Puts the password of the GitHub secret PLAZO_TEST_PASSWORD on the App Store review accounts (13/11/2026, « les compte
apple doivent utiliser PLAZO_TEST_PASSWORD »), so the password given to Apple is never typed or pasted anywhere.

Signs in with PLAZO_ADMIN_EMAIL / PLAZO_ADMIN_PASSWORD (a platform admin of PLATFORM_ADMIN_EMAILS), opens the review
operator (« Parking Revue (tests) » by default, REVIEW_OPERATOR: a name ending in « (tests) », whose team the platform
manages in consultation) and, for each address of REVIEW_ACCOUNTS: sets PLAZO_TEST_PASSWORD as its password, or, missing
and CREATE=true, creates it (« gerant » in the address: a manager, else an « Accueil » member). Each account is then
checked by signing in, and every session is closed. Never prints a password; refuses any other operator.
"""
import json
import os
import sys
import urllib.error
import urllib.request

API = (os.environ.get("PLAZO_API", "").strip() or "https://www.plazo.fr/api").rstrip("/")
ADMIN_EMAIL = os.environ.get("PLAZO_ADMIN_EMAIL", "").strip()
ADMIN_PASSWORD = os.environ.get("PLAZO_ADMIN_PASSWORD", "")
PASSWORD = os.environ.get("PLAZO_TEST_PASSWORD", "").strip()
OPERATOR = os.environ.get("REVIEW_OPERATOR", "").strip() or "Parking Revue (tests)"
ACCOUNTS = [a.strip().lower() for a in (os.environ.get("REVIEW_ACCOUNTS", "") or
            "apple-review-gerant@plazo.fr,apple-review-accueil@plazo.fr").split(",") if a.strip()]
CREATE = os.environ.get("CREATE", "").strip().lower() == "true"
MIN_PASSWORD_LENGTH = 10  # backend/src/dtos/staff.dto.ts


def fail(message):
    print(f"::error::{message}")
    sys.exit(1)


def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(f"{API}{path}", data=data, method=method)
    request.add_header("content-type", "application/json")
    request.add_header("user-agent", "plazo-review-accounts")
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


def login(email, password):
    session = call("POST", "/internal/auth/login", {"email": email, "password": password})
    return session["tokenData"]["access"]["token"], session.get("user") or {}


def logout(token):
    try:
        call("POST", "/internal/auth/logout", token=token)
    except RuntimeError as error:
        print(f"(sign-out failed: {error})")


def main():
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        fail("PLAZO_ADMIN_EMAIL and PLAZO_ADMIN_PASSWORD are required (repository secrets)")
    if len(PASSWORD) < MIN_PASSWORD_LENGTH:
        fail(f"PLAZO_TEST_PASSWORD is missing or has fewer than {MIN_PASSWORD_LENGTH} characters: Plazo refuses it")
    if not OPERATOR.endswith("(tests)"):
        fail("Refused: the review operator's name must end in « (tests) »")

    admin, _ = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    view = None
    try:
        listing = call("GET", "/internal/platform/operators", token=admin)
        matches = [o for o in listing.get("operators") or [] if (o.get("name") or "").strip() == OPERATOR]
        if len(matches) != 1:
            fail(f"« {OPERATOR} »: {len(matches)} operator(s) found (expected one, not archived)")
        operator = matches[0]
        view = call("POST", f"/internal/platform/operators/{operator['id']}/view-as", token=admin)["access"]["token"]
        team = {(m.get("email") or "").lower(): m for m in call("GET", "/internal/staff", token=view) or []}

        problems = 0
        for email in ACCOUNTS:
            member = team.get(email)
            if member is None:
                if not CREATE:
                    print(f"::warning::{email}: not in « {OPERATOR} »'s team (run with « creer » to create it)")
                    problems += 1
                    continue
                role = "manager" if "gerant" in email else "agent"
                local = email.split("@")[0].replace("apple-review-", "")
                try:
                    call("POST", "/internal/staff", {"firstName": "Revue", "lastName": local.capitalize() or "Apple",
                                                     "email": email, "role": role, "password": PASSWORD}, token=view)
                except RuntimeError as error:
                    print(f"::error::{email}: not created ({error})")
                    problems += 1
                    continue
                print(f"{email}: created ({'Gérant' if role == 'manager' else 'Accueil'})")
            else:
                if not member.get("isActive", True):
                    print(f"::warning::{email}: the member is deactivated in Équipe, reactivate it")
                call("POST", f"/internal/staff/{member['id']}/reset-password", {"password": PASSWORD}, token=view)
                print(f"{email}: password set")
            try:
                token, user = login(email, PASSWORD)
                logout(token)
                print(f"{email}: sign-in checked ({user.get('operatorName')}, {user.get('role')})")
            except RuntimeError as error:
                print(f"::error::{email}: sign-in refused after the change ({error})")
                problems += 1
        if problems:
            fail(f"{problems} account(s) not ready")
    finally:
        if view:
            logout(view)
        logout(admin)
    print("Done: give Apple these addresses with the password of PLAZO_TEST_PASSWORD.")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        fail(str(error))
