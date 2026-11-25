"""Lists the .fr domain names registered lately that look like an airport car park
(25/11/2026, « Peut on anticiper encore plus les ouverture de parking d'aéroport avec navette ? » → « Les noms de domaines »).

Source: the AFNIC's open data, one text file per day with every .fr name created that day (free to reuse, no key). A
name is kept when it says car park (park, parking, valet, voiturier, navette, shuttle, stationnement) AND airport
(aéroport, airport, fly, jet, or an airport's own place: Roissy, Orly, Beauvais, Saint-Exupéry, Blagnac…): « fort »; with
only a big airport city (Lyon, Nice, Nantes…): « ville », more noise. Leisure parks, sparks, skateparks and the like are
left out by their name. Each candidate's site is then opened once (https, 8 s) for its title: a name is often registered
weeks before the site exists.

Candidates only: nothing is ever written to Plazo, and nothing is imported (23/11/2026: a prospect is added only once
checked by hand to be an airport car park with a shuttle or a valet). The summary is the list to check.
"""
import datetime
import html
import os
import re
import sys
import urllib.error
import urllib.request

DAYS = max(1, min(int(os.environ.get("DAYS", "").strip() or "30"), 365))
CHECK_SITES = os.environ.get("CHECK_SITES", "true").strip().lower() != "false"
SOURCE = "https://www.afnic.fr/wp-media/ftp/domaineTLD_Afnic/{day}_CREA_fr.txt"
AGENT = "plazo-new-domains"

PARKING = re.compile(r"park|valet|voiturier|navette|shuttle|stationnement|gardiennage-?auto")
AIRPORT = re.compile(
    r"aeroport|airport|aero(?!bic|sol|nef|naut|spat|therm|gom|club|model|drom)|(?<![a-z])air(?!e)|fly|(?<![a-z])jet(?!on)|"
    r"roissy|cdg|orly|beauvais|tille|saint-?exupery|st-?exupery|satolas|marignane|blagnac|merignac|lesquin|entzheim|"
    r"zaventem|charleroi|cointrin|60000"
)
CITY = re.compile(
    r"lyon|marseille|nice|toulouse|bordeaux|nantes|montpellier|lille|mulhouse|bale|strasbourg|biarritz|rennes|geneve|paris"
)
NOT_CAR_PARK = re.compile(
    r"spark|skate|bike|aqua|parkour|parkinson|parka|parker|theme|attraction|camping|jungle|indoor|trampoline|chevalet|"
    r"valette|estivalet|bevalet|dino|dragon|hellfest|europapark|edenpark|casino|food|kpark|rosa-?parks|central-?park|golf|"
    r"water|wake|cable|luna|fun|kid|game|battle|escape|laser|paintball|karting|business-?park|technopark|eco-?park|"
    r"coproprie|arceau|borne|recharge|investi|achat|vente|louer|location-?parking|interdiction|telepaiement|amende|"
    r"truck|camion|poids-?lourd|fluvial|projet"
)
TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)


def level_of(name):
    """« fort », « ville » or None for a domain name without its extension."""
    if not PARKING.search(name) or NOT_CAR_PARK.search(name):
        return None
    if AIRPORT.search(name):
        return "fort"
    return "ville" if CITY.search(name) else None


def created_on(day):
    """The .fr names created that day (lower case), or None when the AFNIC has no file for it."""
    request = urllib.request.Request(SOURCE.format(day=day.strftime("%Y%m%d")), headers={"user-agent": AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            text = response.read().decode("latin-1")
    except (urllib.error.HTTPError, OSError):
        return None
    return [line.strip().lower() for line in text.splitlines() if line.strip() and not line.startswith("#")]


def site_title(domain):
    """The site's title, « (pas de site) » when nothing answers."""
    for host in (domain, f"www.{domain}"):
        request = urllib.request.Request(f"https://{host}/", headers={"user-agent": AGENT, "accept": "text/html"})
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                page = response.read(200_000).decode("utf-8", "replace")
        except (urllib.error.HTTPError, OSError, ValueError):
            continue
        found = TITLE.search(page)
        title = re.sub(r"\s+", " ", html.unescape(found.group(1))).strip() if found else ""
        return (title or "(site sans titre)")[:90]
    return "(pas de site)"


def main():
    today = datetime.datetime.now(datetime.timezone.utc).date()
    rows, missing, read = [], 0, 0
    for back in range(1, DAYS + 1):
        day = today - datetime.timedelta(days=back)
        names = created_on(day)
        if names is None:
            missing += 1
            continue
        read += len(names)
        for domain in names:
            level = level_of(domain.rsplit(".", 1)[0])
            if level:
                rows.append((level, day.isoformat(), domain))
    rows.sort(key=lambda r: (r[0] != "fort", r[1]), reverse=False)
    rows.sort(key=lambda r: r[1], reverse=True)
    rows.sort(key=lambda r: r[0] != "fort")

    lines = [
        f"## Noms de domaine .fr déposés depuis {DAYS} jours",
        "",
        f"{read} noms lus, {len(rows)} candidats ({sum(1 for r in rows if r[0] == 'fort')} forts)."
        + (f" {missing} jour(s) sans fichier." if missing else ""),
        "",
        "Candidats seulement : à vérifier un par un avant de les ajouter à la Prospection.",
        "",
        "| Signal | Déposé le | Nom de domaine | Site |",
        "|---|---|---|---|",
    ]
    for level, day, domain in rows:
        title = site_title(domain).replace("|", "/") if CHECK_SITES else ""
        lines.append(f"| {level} | {day} | {domain} | {title} |")
    report = "\n".join(lines) + "\n"
    print(report)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as out:
            out.write(report)
    if read == 0:
        print("::error::Aucun fichier de l'AFNIC n'a pu être lu.")
        sys.exit(1)


if __name__ == "__main__":
    main()
