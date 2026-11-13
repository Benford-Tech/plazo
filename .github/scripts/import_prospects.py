"""Imports prospects into Plateforme › Prospection from a CSV, through the API (07/11/2026, « Ajoute le workflow d'import
de prospects »).

The CSV is the one the page reads (« Importer un CSV »): first line = the column names (parking, prénom, nom, e-mail,
ville, aéroport, région ou pays, langue, téléphone, site, notes), separator « , », « ; » or tab, read like admin/src/lib/prospecting.ts. It comes
gzip-compressed and base64-encoded in CSV_GZ_B64 (a workflow input: the text stays under GitHub's input size limit), or as
a path in CSV_PATH (local runs).

APPLY=false (the default): the preview only (POST …/prospects/import with dryRun), nothing written. APPLY=true: the import.
Both print, per row, the parking and its outcome (new, already listed, opted out, invalid with its fields), never an
address. Signs in with PLAZO_ADMIN_EMAIL / PLAZO_ADMIN_PASSWORD, a platform admin (PLATFORM_ADMIN_EMAILS), and closes the
session at the end. Nothing is ever sent to a prospect: the sequence leaves only from the page (« Envoyer à N prospects »).
"""
import base64
import csv
import gzip
import io
import json
import os
import sys
import unicodedata
import urllib.error
import urllib.request

API = (os.environ.get("PLAZO_API", "").strip() or "https://www.plazo.fr/api").rstrip("/")
EMAIL = os.environ.get("PLAZO_ADMIN_EMAIL", "").strip()
PASSWORD = os.environ.get("PLAZO_ADMIN_PASSWORD", "")
APPLY = os.environ.get("APPLY", "").strip().lower() == "true"
MAX_ROWS = 2000  # MAX_IMPORT_ROWS of backend/src/domain/prospecting.ts

# The headers the page knows (HEADERS of admin/src/lib/prospecting.ts), keyed as headerKey() does.
HEADERS = {
    "parking": "companyName", "nomduparking": "companyName", "societe": "companyName", "entreprise": "companyName",
    "raisonsociale": "companyName", "company": "companyName",
    "prenom": "contactFirstName", "firstname": "contactFirstName",
    "nom": "contactLastName", "nomdefamille": "contactLastName", "lastname": "contactLastName",
    "email": "email", "mail": "email", "adressemail": "email", "adresseemail": "email", "courriel": "email",
    "ville": "town", "commune": "town", "town": "town", "city": "town",
    "aeroport": "airportCode", "airport": "airportCode", "codeaeroport": "airportCode",
    "region": "region", "pays": "region", "country": "region",
    "site": "website", "siteweb": "website", "siteinternet": "website", "website": "website", "web": "website", "url": "website",
    "langue": "language", "language": "language",
    "telephone": "phone", "tel": "phone", "phone": "phone",
    "notes": "notes", "note": "notes", "commentaire": "notes", "commentaires": "notes", "remarques": "notes",
}

token = None


def fail(message):
    print(f"::error::{message}")
    sys.exit(1)


def header_key(header):
    text = unicodedata.normalize("NFD", header)
    text = "".join(c for c in text if not unicodedata.combining(c)).lower()
    return "".join(c for c in text if "a" <= c <= "z")


def read_text():
    path = os.environ.get("CSV_PATH", "").strip()
    if path:
        with open(path, encoding="utf-8-sig") as fh:
            return fh.read()
    packed = "".join(os.environ.get("CSV_GZ_B64", "").split())
    if not packed:
        fail("No CSV: give the file gzip-compressed and base64-encoded in the « csv_gz_b64 » input (gzip -c f.csv | base64 -w0)")
    try:
        return gzip.decompress(base64.b64decode(packed, validate=True)).decode("utf-8-sig")
    except Exception:
        fail("The « csv_gz_b64 » input is not a gzip-compressed, base64-encoded UTF-8 text")


def read_rows(text):
    first = text.split("\n", 1)[0]
    delimiter = max([";", ",", "\t"], key=first.count)
    lines = [r for r in csv.reader(io.StringIO(text), delimiter=delimiter) if any(c.strip() for c in r)]
    if not lines:
        fail("The CSV is empty")
    columns = [HEADERS.get(header_key(h)) for h in lines[0]]
    ignored = [h for h, c in zip(lines[0], columns) if not c and h.strip()]
    # The email is optional since 13/11/2026 (a prospect without one is called, never emailed).
    missing = [c for c in ("companyName",) if c not in columns]
    if missing:
        fail(f"Missing columns: {', '.join('parking' if c == 'companyName' else 'e-mail' for c in missing)}")
    if ignored:
        print(f"::warning::Columns ignored: {', '.join(ignored)}")
    rows = []
    for cells in lines[1:]:
        row = {}
        for i, column in enumerate(columns):
            value = cells[i].strip() if i < len(cells) else ""
            if column and value and column not in row:
                row[column] = value
        rows.append(row)
    if len(rows) > MAX_ROWS:
        fail(f"{len(rows)} rows: {MAX_ROWS} at most per import")
    return rows


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(f"{API}{path}", data=data, method=method)
    request.add_header("content-type", "application/json")
    request.add_header("user-agent", "plazo-prospects-import")
    if token:
        request.add_header("authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            text = response.read().decode()
            return json.loads(text) if text else None
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read().decode())
            detail = f"{detail.get('code') or ''} {detail.get('message') or ''}".strip()
        except Exception:
            detail = ""
        raise RuntimeError(f"{method} {path.split('?')[0]} → {error.code} {detail}") from None


def login():
    global token
    if not EMAIL or not PASSWORD:
        fail("PLAZO_ADMIN_EMAIL and PLAZO_ADMIN_PASSWORD are required (repository secrets)")
    try:
        session = call("POST", "/internal/auth/login", {"email": EMAIL, "password": PASSWORD})
    except RuntimeError as error:
        if "→ 401" in str(error):
            fail("Sign-in refused (401): check that PLAZO_ADMIN_EMAIL and PLAZO_ADMIN_PASSWORD hold a platform admin's email and password")
        raise
    token = session["tokenData"]["access"]["token"]


def logout():
    global token
    if not token:
        return
    try:
        call("POST", "/internal/auth/logout")
    except RuntimeError as error:
        print(f"(sign-out failed: {error})")
    token = None


OUTCOMES = {"new": "à ajouter", "duplicate": "déjà dans la liste", "suppressed": "désinscrit", "invalid": "erreur"}


def report(rows, answer):
    lines = []
    for result in answer.get("results", []):
        row = rows[result["row"] - 1] if 0 < result["row"] <= len(rows) else {}
        name = row.get("companyName", "?")
        airport = row.get("airportCode", "")
        outcome = OUTCOMES.get(result["outcome"], result["outcome"])
        fields = result.get("fields")
        extra = f" ({', '.join(f'{k}: {v}' for k, v in fields.items())})" if fields else ""
        lines.append(f"| {result['row']} | {name} | {airport} | {outcome}{extra} |")
    counts = answer.get("counts", {})
    title = "Import fait" if APPLY else "Aperçu (rien n'est écrit)"
    summary = [
        f"## {title}",
        "",
        f"{counts.get('new', 0)} à ajouter · {counts.get('duplicate', 0)} déjà dans la liste · "
        f"{counts.get('suppressed', 0)} désinscrits · {counts.get('invalid', 0)} en erreur"
        + (f" · **{answer.get('created', 0)} créés**" if APPLY else ""),
        "",
        "| Ligne | Parking | Aéroport | Résultat |",
        "|---|---|---|---|",
        *lines,
    ]
    print("\n".join(summary))
    target = os.environ.get("GITHUB_STEP_SUMMARY")
    if target:
        with open(target, "a", encoding="utf-8") as fh:
            fh.write("\n".join(summary) + "\n")
    if counts.get("invalid"):
        print(f"::warning::{counts['invalid']} rows in error were left out")


def main():
    rows = read_rows(read_text())
    print(f"{len(rows)} rows read; {'import' if APPLY else 'preview only'}")
    try:
        login()
        answer = call("POST", "/internal/platform/prospects/import", {"rows": rows, "dryRun": not APPLY})
        report(rows, answer)
    finally:
        logout()


if __name__ == "__main__":
    main()
