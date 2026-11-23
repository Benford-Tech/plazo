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
SOURCE = (os.environ.get("SOURCE", "").strip().lower() or "tous")  # annuaire · bodacc · tous
# 23/11/2026 (« les prospect ne sont pas des parkings d'aeroport avec navette !!! verifie avant ! »): the directory and the
# BODACC only give candidates. Nothing is imported unless its name is in VERIFIED, the names checked by hand beforehand
# (a website or a comparator listing shows an airport car park with a shuttle or a valet). The run without it lists them.
VERIFIED_RAW = os.environ.get("VERIFIED", "")
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
ISO_DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
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
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                text = response.read().decode()
            if text.strip():
                return json.loads(text)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504):
                raise
        except (OSError, json.JSONDecodeError):  # URLError, resets and timeouts are all OSError
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
                    "origin": "directory", "opens": "",
                    "where": f"{code} · {km:.1f} km", "key": company.get("siren") or siret,
                    "note": f"Créé le {french_date(created)} · SIRET {siret} · {place.get('adresse') or ''} · annuaire des "
                            f"entreprises (52.21Z){'' if PARKING_WORDS.search(words) else ' · activité à vérifier'}",
                })
        page += 1
        time.sleep(0.2)
    return kept


def french_date(iso):
    return f"{iso[8:10]}/{iso[5:7]}/{iso[:4]}"


BODACC = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records"
# Departments whose new companies may serve each airport (the BODACC gives a department, not a position).
AIRPORT_DEPARTMENTS = {
    "CDG": ["95", "77", "93"], "ORY": ["91", "94"], "BVA": ["60"], "LYS": ["69", "38", "01"], "MRS": ["13"], "NCE": ["06"],
    "TLS": ["31"], "BOD": ["33"], "NTE": ["44"], "MPL": ["34"], "LIL": ["59"], "BSL": ["68"], "SXB": ["67"], "BIQ": ["64"],
    "RNS": ["35"], "GNB": ["38"], "CFE": ["63"], "BES": ["29"], "PUF": ["64", "65"], "PGF": ["66"], "TLN": ["83"],
    "AJA": ["2A"], "BIA": ["2B"], "FSC": ["2A"], "CCF": ["11"], "LDE": ["65"], "LRH": ["17"], "LIG": ["87"], "CMF": ["73"],
    "EGC": ["24"], "TUF": ["37"], "FNI": ["30"], "AVN": ["84"], "ETZ": ["57", "54"], "BVE": ["19", "46"], "RDZ": ["12"],
    "LRT": ["56"], "DNR": ["35", "22"], "CFR": ["14"], "DOL": ["14"], "URO": ["76"], "PIS": ["86"], "BZR": ["34"], "NCY": ["74"],
}
# The activity the company declared must say it keeps cars (parking, parking the car) AND carries travellers to the
# airport (airport, shuttle). A valet or a driver working for other car parks, alone, is not a car park.
KEEPS_CARS = re.compile(r"parking|parc de stationnement|stationnement|garer|garde de(s)? vehicules|gardiennage de(s)? vehicules")
SERVES_TRAVELLERS = re.compile(r"aeroport|airport|navette")
NOT_AIRPORT_PARKING = re.compile(
    r"fourriere|food truck|auto[- ]?ecole|sans vehicule|sous[- ]traitance|pour le compte (de|d'une|des) (societes?|entreprises?) de "
    r"(parking|voiturier)|appartenant a des societes|location (de )?places? de parking (a|en) (titre|usage) prive"
)


def bodacc_page(departments, since, offset):
    depts = ", ".join(f'"{d}"' for d in departments)
    where = (f'familleavis="creation" AND numerodepartement IN ({depts}) AND dateparution>="{since}" AND '
             '(search(listeetablissements,"navette") OR search(listeetablissements,"aéroport") OR '
             'search(listeetablissements,"aeroport") OR search(listeetablissements,"voiturier") OR '
             'search(listeetablissements,"valet"))')
    query = urllib.parse.urlencode({"where": where, "limit": 100, "offset": offset, "order_by": "dateparution desc"})
    request = urllib.request.Request(f"{BODACC}?{query}", headers={"user-agent": "plazo-new-parkings", "accept": "application/json"})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                text = response.read().decode()
            if text.strip():
                return json.loads(text)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504):
                raise
        except (OSError, json.JSONDecodeError):
            pass
        time.sleep(2 * (attempt + 1))
    raise RuntimeError("the BODACC did not answer")


def as_json(value):
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value or "null")
    except (TypeError, json.JSONDecodeError):
        return None


def listed(value):
    return value if isinstance(value, list) else [value] if value else []


def bodacc_entry(record, code):
    places = [p for e in listed((as_json(record.get("listeetablissements")) or {}).get("etablissement")) for p in [e] if isinstance(p, dict)]
    activity = " ".join(p.get("activite") or "" for p in places)
    words = plain(activity)
    if not (KEEPS_CARS.search(words) and SERVES_TRAVELLERS.search(words)) or NOT_AIRPORT_PARKING.search(words):
        return None
    person = (as_json(record.get("listepersonnes")) or {}).get("personne")
    person = person[0] if isinstance(person, list) and person else person if isinstance(person, dict) else {}
    sign = person.get("nomCommercial") or next((p.get("enseigne") or p.get("nomCommercial") for p in places
                                                if p.get("enseigne") or p.get("nomCommercial")), None)
    first = last = ""
    if person.get("typePersonne") == "pp":
        given = person.get("prenom")
        first = (given[0] if isinstance(given, list) and given else given or "").strip().title()
        last = (person.get("nomUsage") or person.get("nom") or "").strip().title()
        name = sign or f"{first} {last}".strip()
    else:
        name = sign or person.get("denomination") or record.get("commercant") or ""
    name = name.strip()
    if not name:
        return None
    act = as_json(record.get("acte")) or {}
    start = act.get("dateCommencementActivite") or ""
    published = record.get("dateparution") or ""
    siren = next((r for r in listed(record.get("registre")) if r and " " not in r), None) or record.get("id")
    address = next((p.get("adresse") for p in places if isinstance(p.get("adresse"), dict)), None) or {}
    street = " ".join(str(address.get(k) or "") for k in ("numeroVoie", "typeVoie", "nomVoie")).split()
    where_text = f"{' '.join(street)} {address.get('codePostal') or record.get('cp') or ''} {address.get('ville') or record.get('ville') or ''}".strip()
    upcoming = start and start > datetime.date.today().isoformat()
    note = (f"Annonce de création au BODACC le {french_date(published)} · début d'activité "
            f"{('prévu le ' if upcoming else 'le ') + french_date(start) if start else 'non précisé'} · SIREN {siren} · "
            f"{where_text} · activité : {activity.strip()[:400]}")
    return {
        "name": name.title() if name.isupper() else name, "town": (address.get("ville") or record.get("ville") or "").title(),
        "created": published, "parking": True, "first": first, "last": last, "airport": code,
        "where": f"{code} · dép. {record.get('numerodepartement') or '?'}", "key": siren,
        "note": note[:1000], "upcoming": bool(upcoming), "origin": "bodacc", "opens": start,
    }


def found_in_bodacc(code, since):
    kept, offset = [], 0
    while True:
        answer = bodacc_page(AIRPORT_DEPARTMENTS.get(code, []), since, offset)
        records = answer.get("results") or []
        for record in records:
            entry = bodacc_entry(record, code)
            if entry:
                kept.append(entry)
        offset += len(records)
        if not records or offset >= (answer.get("total_count") or 0) or offset >= 1000:
            return kept
        time.sleep(0.3)


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
    found, seen = [], set()
    for code in [c for c in wanted if c in AIRPORT_POINTS]:
        if SOURCE in ("bodacc", "tous"):
            announced = found_in_bodacc(code, since)
            print(f"{code} : {len(announced)} création(s) au BODACC depuis le {french_date(since)} ({', '.join(AIRPORT_DEPARTMENTS[code])})")
            found.extend(announced)
        if SOURCE in ("annuaire", "tous"):
            around = found_around(code, AIRPORT_POINTS[code], since)
            print(f"{code} : {len(around)} établissement(s) créé(s) depuis le {french_date(since)} à {RADIUS_KM:g} km")
            found.extend(around)
    unique = []
    for f in found:  # the same company found by both sources, or for two airports sharing a department
        if f["key"] in seen:
            continue
        seen.add(f["key"])
        unique.append(f)
    found = sorted(unique, key=lambda f: (not f["parking"], f["airport"], f["created"]))
    lines = [f"| {f['name']} | {f['town']} | {f['where']} | {french_date(f['created'])} | "
             f"{'pas encore ouvert' if f.get('upcoming') else 'parking' if f['parking'] else 'à vérifier'} |" for f in found]
    summary = [f"## Nouveaux parkings : {len(found)} depuis le {french_date(since)} ({MONTHS} mois, source : {SOURCE})", "",
               "| Établissement | Commune | Aéroport | Créé / annoncé le | Nom |", "|---|---|---|---|---|", *lines]
    print("\n".join(summary))
    target = os.environ.get("GITHUB_STEP_SUMMARY")
    if target:
        with open(target, "a", encoding="utf-8") as fh:
            fh.write("\n".join(summary) + "\n\n")
    if not found:
        return
    verified = {plain(n).strip() for n in VERIFIED_RAW.replace("\n", ";").split(";") if n.strip()}
    found = [f for f in found if " ".join(plain(f["name"]).split()) in {" ".join(v.split()) for v in verified}]
    if not verified:
        print("::notice::Candidats seulement : rien n'est importé sans la liste « verifies » (noms vérifiés un par un "
              "sur leur site ou un comparateur : parking d'aéroport avec navette ou voiturier).")
        return
    missing = len(verified) - len(found)
    if missing > 0:
        print(f"::warning::{missing} nom(s) vérifié(s) introuvable(s) parmi les candidats de ce passage")
    if not found:
        return
    rows = []
    for f in found:
        row = {"companyName": f["name"][:120], "town": f["town"], "airportCode": f["airport"], "notes": f["note"],
               # The marker of Plateforme › Prospection (22/11/2026): where it was found and its dates.
               "origin": f["origin"]}
        for key, day in (("foundOn", f["created"]), ("opensOn", f["opens"])):
            if day and ISO_DAY.match(day[:10]):
                row[key] = day[:10]
        if f["first"] and f["last"]:
            row["contactFirstName"], row["contactLastName"] = f["first"][:60], f["last"][:60]
        rows.append(row)
    try:
        api.login()
        answer = api.call("POST", "/internal/platform/prospects/import", {"rows": rows[: api.MAX_ROWS], "dryRun": not APPLY,
                                                                        # A prospect already listed gets its marker.
                                                                        "complete": True})
        api.report(rows, answer)
    finally:
        api.logout()


if __name__ == "__main__":
    main()
