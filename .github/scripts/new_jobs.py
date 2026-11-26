"""Lists the companies hiring shuttle drivers or valets for an airport car park, the earliest sign of a car park about to
open (26/11/2026, « où trouver les futurs ouvreurs de parking ? » → offres d'emploi → « go »).

Source: France Travail's « Offres d'emploi v2 » API (free, an application created on francetravail.io with the
« Offres d'emploi v2 » API: FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET). For each airport, the offers
published in its departments in the last DAYS days for a few searches (« navette aéroport », « voiturier aéroport »…). An
offer is kept when its title or text says car park work (parking, navette, voiturier, valet, jockey, stationnement) AND
airport (aéroport, aérogare, terminal); car rental, airlines, ground handling, security and the big operators of the
official car parks are left out by their name. Offers are grouped by company: one line per company with its number of
offers, the latest date, the places, one title and one link.

Candidates only: nothing is ever written to Plazo, and nothing is imported (23/11/2026: a prospect is added only once
checked by hand to be an airport car park with a shuttle or a valet). No personal data: the offers are companies' ads.
"""
import datetime
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

DAYS = max(1, min(int(os.environ.get("DAYS", "").strip() or "30"), 90))
AIRPORTS = os.environ.get("AIRPORTS", "").strip() or "LYS"
CLIENT_ID = os.environ.get("FRANCE_TRAVAIL_CLIENT_ID", "").strip()
CLIENT_SECRET = os.environ.get("FRANCE_TRAVAIL_CLIENT_SECRET", "").strip()
TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire"
SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"
OFFER_URL = "https://candidat.francetravail.fr/offres/recherche/detail/{id}"
AGENT = "plazo-new-jobs"
PAGE = 150  # the API's largest range
MAX_PAGES = 3

# The searches, each run per airport. France Travail matches every word of a search.
SEARCHES = ["navette aeroport", "voiturier aeroport", "parking aeroport", "jockey aeroport", "chauffeur navette parking"]

# French airports and their departments (as in new_parkings.py). The API covers France only.
AIRPORT_DEPARTMENTS = {
    "CDG": ["95", "77", "93"], "ORY": ["91", "94"], "BVA": ["60"], "LYS": ["69", "38", "01"], "MRS": ["13"], "NCE": ["06"],
    "TLS": ["31"], "BOD": ["33"], "NTE": ["44"], "MPL": ["34"], "LIL": ["59"], "BSL": ["68"], "SXB": ["67"], "BIQ": ["64"],
    "RNS": ["35"], "GNB": ["38"], "CFE": ["63"], "BES": ["29"], "PUF": ["64", "65"], "PGF": ["66"], "TLN": ["83"],
    "AJA": ["2A"], "BIA": ["2B"], "FSC": ["2A"], "CCF": ["11"], "LDE": ["65"], "LRH": ["17"], "LIG": ["87"], "CMF": ["73"],
    "EGC": ["24"], "TUF": ["37"], "FNI": ["30"], "AVN": ["84"], "ETZ": ["57", "54"], "BVE": ["19", "46"], "RDZ": ["12"],
    "LRT": ["56"], "DNR": ["35", "22"], "CFR": ["14"], "DOL": ["14"], "URO": ["76"], "PIS": ["86"], "BZR": ["34"], "NCY": ["74"],
}

CAR_PARK_WORK = re.compile(r"parking|navette|voiturier|valet|jockey|stationnement|parc auto")
AIRPORT = re.compile(r"aeroport|aerogare|airport|terminal|saint[- ]exupery|roissy|orly|blagnac|merignac|marignane")
# Car rental, airlines, ground handling, security, cleaning and the operators of the official car parks: not prospects.
NOT_PROSPECT = re.compile(
    r"\b(hertz|avis|europcar|sixt|enterprise|rent ?a ?car|ada|getaround|ucar|leasys|free2move|budget|national citer|"
    r"air france|easyjet|transavia|ryanair|volotea|vueling|lufthansa|swissport|menzies|wfs|aviapartner|alyzia|"
    r"groupe 3s|icts|securitas|seris|samsic|onet|elior|derichebourg|"
    r"indigo|effia|q-park|interparking|saemes|vinci|aeroports de lyon|aeroports de paris|groupe adp|lyon-saint exupery)\b"
    r"|surete aeroportuaire|agent de piste|bagagiste|steward|hotesse de l'air|pilote|mecanicien avion|location de voitures"
)


def plain(text):
    """Lower case, no accents, spaces tidied: what the filters read."""
    text = unicodedata.normalize("NFD", text or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"\s+", " ", text).strip()


def is_candidate(offer):
    """An offer for car park work at an airport, from a company that could be a prospect."""
    company = (offer.get("entreprise") or {}).get("nom") or ""
    text = plain(" ".join([offer.get("intitule") or "", offer.get("description") or "", company]))
    if NOT_PROSPECT.search(plain(company)) or NOT_PROSPECT.search(plain(offer.get("intitule") or "")):
        return False
    return bool(CAR_PARK_WORK.search(text) and AIRPORT.search(text))


def token():
    body = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scope": "api_offresdemploiv2 o2dsoffre",
    }).encode()
    request = urllib.request.Request(TOKEN_URL, data=body, headers={
        "content-type": "application/x-www-form-urlencoded", "user-agent": AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read())["access_token"]
    except urllib.error.HTTPError as error:
        print(f"::error::France Travail a refusé l'identifiant de l'application (HTTP {error.code}). "
              "Vérifiez FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET, et que l'application a l'API « Offres d'emploi v2 ».")
        sys.exit(1)


def search(access, words, departments, since, until):
    """The offers of one search in up to 5 departments (several pages); None when the API failed."""
    found = []
    for page in range(MAX_PAGES):
        query = urllib.parse.urlencode({
            "motsCles": words,
            "departement": ",".join(departments[:5]),
            "minCreationDate": since.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "maxCreationDate": until.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "range": f"{page * PAGE}-{page * PAGE + PAGE - 1}",
        })
        request = urllib.request.Request(f"{SEARCH_URL}?{query}", headers={
            "authorization": f"Bearer {access}", "accept": "application/json", "user-agent": AGENT})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    raw = response.read()
                    status = response.status
                break
            except urllib.error.HTTPError as error:
                if error.code == 429 and attempt < 2:  # 10 calls per second at most
                    time.sleep(2)
                    continue
                if error.code == 400 and page:  # past the last page
                    return found
                print(f"::warning::Recherche « {words} » ({', '.join(departments)}) : HTTP {error.code}")
                return found or None
            except OSError as error:
                print(f"::warning::Recherche « {words} » : {error.__class__.__name__}")
                return found or None
        time.sleep(0.15)
        if status == 204 or not raw:
            return found
        results = json.loads(raw).get("resultats") or []
        found.extend(results)
        if len(results) < PAGE:
            return found
    return found


def french_date(iso):
    return f"{iso[8:10]}/{iso[5:7]}/{iso[0:4]}" if iso and len(iso) >= 10 else ""


def cell(text, limit=70):
    text = re.sub(r"\s+", " ", (text or "").replace("|", "/")).strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        print("::error::Il manque les secrets FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET "
              "(application créée sur francetravail.io avec l'API « Offres d'emploi v2 »).")
        sys.exit(1)
    wanted = sorted(AIRPORT_DEPARTMENTS) if AIRPORTS.lower() in ("tous", "all", "*") else \
        [c.strip().upper() for c in re.split(r"[,; ]+", AIRPORTS) if c.strip()]
    unknown = [c for c in wanted if c not in AIRPORT_DEPARTMENTS]
    if unknown:
        print(f"::warning::Aéroports inconnus, laissés de côté : {', '.join(unknown)}")
    until = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
    since = until - datetime.timedelta(days=DAYS)
    access = token()

    offers, failures, read = {}, 0, 0
    for code in [c for c in wanted if c in AIRPORT_DEPARTMENTS]:
        for words in SEARCHES:
            results = search(access, words, AIRPORT_DEPARTMENTS[code], since, until)
            if results is None:
                failures += 1
                continue
            read += len(results)
            for offer in results:
                if offer.get("id") and offer["id"] not in offers and is_candidate(offer):
                    offers[offer["id"]] = {**offer, "_airport": code}

    companies = {}
    for offer in offers.values():
        name = cell((offer.get("entreprise") or {}).get("nom") or "", 60) or "(entreprise non nommée)"
        key = (offer["_airport"], plain(name) if name != "(entreprise non nommée)" else f"?{offer['id']}")
        entry = companies.setdefault(key, {"name": name, "airport": offer["_airport"], "offers": [], "places": set()})
        entry["offers"].append(offer)
        place = (offer.get("lieuTravail") or {}).get("libelle")
        if place:
            entry["places"].add(re.sub(r"^\d+\s*-\s*", "", place))
    rows = []
    for entry in companies.values():
        latest = max(entry["offers"], key=lambda o: o.get("dateCreation") or "")
        link = ((latest.get("origineOffre") or {}).get("urlOrigine")) or OFFER_URL.format(id=latest["id"])
        rows.append((entry, latest, link))
    rows.sort(key=lambda r: (r[0]["airport"], -len(r[0]["offers"]), r[1].get("dateCreation") or ""), reverse=False)

    lines = [
        f"## Offres d'emploi des parkings d'aéroport depuis {DAYS} jours",
        "",
        f"{read} offres lues, {len(offers)} retenues, {len(rows)} entreprise(s)."
        + (f" {failures} recherche(s) en échec." if failures else ""),
        "",
        "Candidats seulement : un parking qui recrute des chauffeurs de navette ou des voituriers va peut-être ouvrir. "
        "À vérifier un par un avant de l'ajouter à la Prospection.",
        "",
        "| Aéroport | Entreprise | Offres | Dernière | Lieu | Intitulé | Offre |",
        "|---|---|---|---|---|---|---|",
    ]
    for entry, latest, link in rows:
        lines.append(
            f"| {entry['airport']} | {entry['name']} | {len(entry['offers'])} | {french_date(latest.get('dateCreation'))} | "
            f"{cell(', '.join(sorted(entry['places'])), 40)} | {cell(latest.get('intitule'), 60)} | [voir]({link}) |"
        )
    report = "\n".join(lines) + "\n"
    print(report)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as out:
            out.write(report)
    if failures and not read:
        print("::error::Aucune recherche n'a abouti.")
        sys.exit(1)


if __name__ == "__main__":
    main()
