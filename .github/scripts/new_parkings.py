"""Finds the car parks that opened lately around airports and adds them to Plateforme › Prospection
(22/11/2026, « comment trouver les parking avec navette qui vienne d'ouvrir ? » → « ok »).

Source: the State's open company directory (recherche-entreprises.api.gouv.fr, Insee data, no key), `near_point`
around each airport, activity code 52.21Z (« services auxiliaires des transports terrestres », the code of car parks).
An establishment is kept when it is open, its own activity is 52.21Z, it is within RADIUS_KM of the airport, and it was
created less than MONTHS months ago: a new company, or a new establishment of an older one (a second car park).
Large and mid-size companies (Insee « GE », « ETI »), tow trucks, motorways, rail and public transport (same code) are left out by their name; a name that says parking,
park, navette, valet or aéroport is marked « parking » in the summary, the others « à vérifier ».

Then POST …/prospects/import (no `complete`): name, town, airport, the company's manager when a person, notes « Créé le
… · SIRET … · adresse … ». The server leaves out a prospect already listed (same name at the same airport) and an
opted-out one. APPLY=false (the default): the preview only. Signs in with PLAZO_ADMIN_EMAIL / PLAZO_ADMIN_PASSWORD and
closes the session at the end. Nothing is ever sent to a prospect; « E-mails des prospects (sites) » finds their address
afterwards only for those with a website, the others are called.
"""
import datetime
import json
import math
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
import import_prospects as api  # noqa: E402  (sign-in, calls, report, sign-out)

APPLY = os.environ.get("APPLY", "").strip().lower() == "true"
MONTHS = int(os.environ.get("MONTHS", "").strip() or "12")
RADIUS_KM = float(os.environ.get("RADIUS_KM", "").strip() or "15")
AIRPORTS = os.environ.get("AIRPORTS", "").strip() or "LYS"
DIRECTORY = "https://recherche-entreprises.api.gouv.fr/near_point"
ACTIVITY = "52.21Z"

# French airports (latitude, longitude of the terminals, to a few hundred metres). The directory covers France only.
AIRPORT_POINTS = {
    "CDG": (49.0097, 2.5479), "ORY": (48.7262, 2.3652), "BVA": (49.4544, 2.1128), "LYS": (45.7256, 5.0811),
    "MRS": (43.4393, 5.2214), "NCE": (43.6584, 7.2159), "TLS": (43.6291, 1.3638), "BOD": (44.8283, -0.7156),
    "NTE": (47.1532, -1.6107), "MPL": (43.5762, 3.9630), "LIL": (50.5633, 3.0869), "BSL": (47.5896, 7.5299),
    "SXB": (48.5383, 7.6282), "BIQ": (43.4684, -1.5231), "RNS": (48.0695, -1.7348), "GNB": (45.3629, 5.3294),
    "CFE": (45.7867, 3.1692), "BES": (48.4479, -4.4185), "PUF": (43.3800, -0.4186), "PGF": (42.7404, 2.8707),
    "TLN": (43.0973, 6.1460), "AJA": (41.9236, 8.8029), "BIA": (42.5527, 9.4837), "FSC": (41.5006, 9.0978),
    "CCF": (43.2160, 2.3063), "LDE": (43.1787, -0.0064), "LRH": (46.1792, -1.1953), "LIG": (45.8628, 1.1794),
    "CMF": (45.6381, 5.8802), "EGC": (44.8253, 0.5186), "TUF": (47.4322, 0.7276), "FNI": (43.7574, 4.4163),
    "AVN": (43.9073, 4.9018), "ETZ": (48.9821, 6.2513), "BVE": (45.0397, 1.4856), "RDZ": (44.4079, 2.4827),
    "LRT": (47.7606, -3.4400), "DNR": (48.5877, -2.0800), "CFR": (49.1733, -0.4500), "DOL": (49.3653, 0.1543),
    "URO": (49.3842, 1.1748), "PIS": (46.5877, 0.3066), "BZR": (43.3235, 3.3539), "NCY": (45.9308, 6.1064),
}

# Same activity code, never an airport car park.
NOT_PARKING = re.compile(
    r"depann|remorqu|assistance|convoy|fourriere|sncf|reseau ferre|gares? &|autoroute|aprr|area\b|sanef|vinci autoroutes|"
    r"escota|mobilites|transports? en commun|keolis|transdev|tcl\b|sytral|port autonome|chambre de commerce|"
    r"lavage|controle technique|auto[- ]?ecole|ambulance|taxi|vtc\b|demenag|logisti|stockage de vehicules? accidentes",
)
PARKING_WORDS = re.compile(r"park|parc|navette|shuttle|valet|voiturier|aeroport|airport|stationnement|garde auto")


def plain(text):
    text = unicodedata.normalize("NFD", text or "")
    return "".join(c for c in text if not unicodedata.combining(c)).lower()


def distance_km(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def directory_page(point, page):
    query = urllib.parse.urlencode({
        "lat": point[0], "long": point[1], "radius": min(RADIUS_KM, 50), "activite_principale": ACTIVITY,
        "per_page": 25, "page": page,
    })
    request = urllib.request.Request(f"{DIRECTORY}?{query}", headers={"user-agent": "plazo-new-parkings", "accept": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                text = response.read().decode()
            if text.strip():
                return json.loads(text)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504):
                raise
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            pass
        time.sleep(1.5 * (attempt + 1))  # 7 calls per second at most for this API
    raise RuntimeError(f"the company directory did not answer (page {page})")


def manager(company):
    for person in company.get("dirigeants") or []:
        if person.get("type_dirigeant") == "personne physique" and person.get("nom"):
            first = (person.get("prenoms") or "").split(" ")[0].strip().title()
            last = re.sub(r"\s*\(.*\)", "", person["nom"]).strip().title()
            return first, last
    return "", ""


def found_around(code, point, since):
    kept, seen, page, pages = [], set(), 1, 1
    while page <= pages:
        answer = directory_page(point, page)
        pages = min(answer.get("total_pages") or 1, 40)
        for company in answer.get("results") or []:
            if company.get("categorie_entreprise") in ("GE", "ETI"):  # department stores, rail, motorways: never a new airport car park
                continue
            for place in company.get("matching_etablissements") or []:
                siret = place.get("siret")
                created = place.get("date_creation") or ""
                if not siret or siret in seen:
                    continue
                if place.get("etat_administratif") != "A" or place.get("activite_principale") != ACTIVITY or created < since:
                    continue
                try:
                    where = (float(place["latitude"]), float(place["longitude"]))
                except (KeyError, TypeError, ValueError):
                    continue
                km = distance_km(point, where)
                if km > RADIUS_KM:
                    continue
                signs = (place.get("liste_enseignes") or []) + [place.get("nom_commercial") or ""]
                sign = next((s for s in signs if s), "")
                name = (sign or company.get("nom_raison_sociale") or company.get("nom_complet") or "").strip()
                words = plain(" ".join([name, company.get("nom_complet") or ""]))
                if not name or NOT_PARKING.search(words):
                    continue
                seen.add(siret)
                first, last = manager(company)
                kept.append({
                    "name": name.title() if name.isupper() else name, "town": (place.get("libelle_commune") or "").title(),
                    "created": created, "siret": siret, "km": km, "address": place.get("adresse") or "",
                    "parking": bool(PARKING_WORDS.search(words)), "first": first, "last": last, "airport": code,
                })
        page += 1
        time.sleep(0.2)
    return kept


def french_date(iso):
    return f"{iso[8:10]}/{iso[5:7]}/{iso[:4]}"


def main():
    api.APPLY = APPLY
    api.COMPLETE = False
    today = datetime.date.today()
    since = (today - datetime.timedelta(days=round(MONTHS * 30.44))).isoformat()
    wanted = sorted(AIRPORT_POINTS) if AIRPORTS.lower() in ("tous", "all", "*") else \
        [c.strip().upper() for c in re.split(r"[,; ]+", AIRPORTS) if c.strip()]
    unknown = [c for c in wanted if c not in AIRPORT_POINTS]
    if unknown:
        print(f"::warning::Aéroports inconnus, laissés de côté : {', '.join(unknown)} (connus : {', '.join(sorted(AIRPORT_POINTS))})")
    found = []
    for code in [c for c in wanted if c in AIRPORT_POINTS]:
        around = found_around(code, AIRPORT_POINTS[code], since)
        print(f"{code} : {len(around)} établissement(s) créé(s) depuis le {french_date(since)} à {RADIUS_KM:g} km")
        found.extend(around)
    found.sort(key=lambda f: (not f["parking"], f["airport"], f["created"]), reverse=False)
    lines = [f"| {f['name']} | {f['town']} | {f['airport']} · {f['km']:.1f} km | {french_date(f['created'])} | "
             f"{'parking' if f['parking'] else 'à vérifier'} |" for f in found]
    summary = [f"## Nouveaux parkings : {len(found)} depuis le {french_date(since)} ({MONTHS} mois, {RADIUS_KM:g} km)", "",
               "| Établissement | Commune | Aéroport | Créé le | Nom |", "|---|---|---|---|---|", *lines]
    print("\n".join(summary))
    target = os.environ.get("GITHUB_STEP_SUMMARY")
    if target:
        with open(target, "a", encoding="utf-8") as fh:
            fh.write("\n".join(summary) + "\n\n")
    if not found:
        return
    rows = []
    for f in found:
        row = {"companyName": f["name"][:120], "town": f["town"], "airportCode": f["airport"],
               "notes": f"Créé le {french_date(f['created'])} · SIRET {f['siret']} · {f['address']} · "
                        f"annuaire des entreprises (52.21Z){'' if f['parking'] else ' · activité à vérifier'}"}
        if f["first"] and f["last"]:
            row["contactFirstName"], row["contactLastName"] = f["first"], f["last"]
        rows.append(row)
    try:
        api.login()
        answer = api.call("POST", "/internal/platform/prospects/import", {"rows": rows[: api.MAX_ROWS], "dryRun": not APPLY})
        api.report(rows, answer)
    finally:
        api.logout()


if __name__ == "__main__":
    main()
