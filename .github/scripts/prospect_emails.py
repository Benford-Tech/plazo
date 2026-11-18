"""Completes the prospects of Plateforme › Prospection that have a website but no email, by reading their site
(18/11/2026, « complete les prospects en visitant les sites pour recuperer le mail »).

For each prospect without an email and with a website: the home page, the pages it links to that look like a contact or
legal page (contact, mentions légales, Impressum, contacto…), then a few usual addresses (/contact, /mentions-legales,
/impressum…), robots.txt respected, 6 pages at most per site. The addresses published on these pages (mailto links and
text, « [at] » written out too) are ranked: the site's own domain first (contact@, info@, reservation@ before the
others; dpo@, rgpd@, jobs@ last), else a webmail address (gmail, orange…) the site itself publishes; an address of another
company (the web agency, a comparator, a tracker) is never taken.

Then POST …/prospects/import with `complete`: each address fills the prospect's empty email (same name at the same
airport), never one already taken by another prospect, never an opted-out address. APPLY=false (the default): the
preview only. Prints per prospect its name, its site and the address masked (« c•••@parking-x.fr »). Signs in with
PLAZO_ADMIN_EMAIL / PLAZO_ADMIN_PASSWORD and closes the session at the end. Nothing is ever sent to a prospect.
"""
import concurrent.futures
import html
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser

sys.path.insert(0, os.path.dirname(__file__))
import import_prospects as api  # noqa: E402  (sign-in, calls, sign-out)

APPLY = os.environ.get("APPLY", "").strip().lower() == "true"
LIMIT = int(os.environ.get("LIMIT", "").strip() or "500")
AGENT = "Mozilla/5.0 (compatible; PlazoProspectBot/1.0; +https://pro.plazo.fr)"
PAGE_TIMEOUT = 10
MAX_BYTES = 1_500_000
MAX_PAGES = 6
WORKERS = 8

CONTACT_WORDS = re.compile(
    r"contact|kontakt|contacto|contatt|contato|kontakt|mentions|legal|l[ée]gales|impressum|imprint|about|a-propos|"
    r"qui-sommes|nous-trouver|acces|cgv|conditions|info",
    re.I,
)
USUAL_PATHS = ["/contact", "/contact/", "/nous-contacter", "/contactez-nous", "/mentions-legales", "/contact-us",
               "/kontakt", "/impressum", "/contacto", "/contatti", "/contactos"]
EMAIL = re.compile(r"[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,24}")
OBFUSCATED = re.compile(r"([A-Za-z0-9._%+-]{1,64})\s*[\[\(\{]\s*(?:at|arobase)\s*[\]\)\}]\s*"
                        r"([A-Za-z0-9-]{1,63}(?:\s*[\[\(\{]\s*(?:dot|point)\s*[\]\)\}]\s*[A-Za-z0-9-]{1,63}|\.[A-Za-z0-9-]{1,63})+)", re.I)
HREF = re.compile(r"""href\s*=\s*["']([^"'#][^"']*)["']""", re.I)
MAILTO = re.compile(r"""href\s*=\s*["']mailto:([^"'?]+)""", re.I)
ASSET = re.compile(r"\.(png|jpe?g|gif|webp|svg|css|js|ico|avif)$", re.I)
WEBMAIL = {"gmail.com", "googlemail.com", "hotmail.com", "hotmail.fr", "outlook.com", "outlook.fr", "live.fr", "live.com",
           "yahoo.com", "yahoo.fr", "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "laposte.net", "neuf.fr", "bbox.fr",
           "icloud.com", "gmx.de", "gmx.net", "web.de", "t-online.de", "libero.it", "hotmail.it", "hotmail.es", "telefonica.net"}
# Never a prospect's address: platforms, trackers, site builders, comparators (who sell parking, not run one).
FOREIGN = re.compile(r"(example\.|sentry|wix|squarespace|godaddy|jimdo|wordpress|cloudflare|google\.com|facebook|"
                     r"allopark|onepark|parkos|parkvia|parkmundo|parclick|parkhit|zenpark|looking4|holidayextras|"
                     r"domain\.|email\.com$|yourdomain|votredomaine|mondomaine|exemple\.)", re.I)
ROBOT_USER = re.compile(r"^(no-?reply|ne-?pas-?repondre|donotreply|do-not-reply|mailer-daemon|postmaster|bounce|abuse)", re.I)
FIRST = ["reservation", "reservations", "booking", "contact", "info", "infos", "accueil", "hello", "bonjour", "parking",
         "commercial", "direction", "office", "kontakt", "contacto", "info.fr"]
LAST = ["dpo", "rgpd", "gdpr", "privacy", "datenschutz", "legal", "jobs", "job", "recrutement", "rh", "careers", "webmaster",
        "compta", "comptabilite", "factures", "invoice", "billing", "presse", "press"]


def registered_domain(host):
    parts = host.lower().strip(".").split(".")
    if len(parts) >= 3 and parts[-2] in {"co", "com", "org", "net", "gov", "ac"} and len(parts[-1]) == 2:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def normalize_site(site):
    site = site.strip()
    if not re.match(r"^https?://", site, re.I):
        site = "https://" + site
    return site


class Reader:
    """Fetches the pages of one site, robots.txt respected, a few at most."""

    def __init__(self, site):
        self.base = normalize_site(site)
        self.host = urllib.parse.urlparse(self.base).hostname or ""
        self.robots = None
        self.pages = 0

    def allowed(self, url):
        if self.robots is None:
            self.robots = urllib.robotparser.RobotFileParser()
            try:
                text = self.fetch_raw(urllib.parse.urljoin(self.base, "/robots.txt"), count=False)
                self.robots.parse((text or "").splitlines())
            except Exception:
                self.robots.parse([])
        return self.robots.can_fetch(AGENT, url)

    def fetch_raw(self, url, count=True):
        if count:
            if self.pages >= MAX_PAGES:
                return None
            self.pages += 1
        request = urllib.request.Request(url, headers={"user-agent": AGENT, "accept": "text/html,*/*;q=0.5",
                                                       "accept-language": "fr,en;q=0.8,de;q=0.6"})
        with urllib.request.urlopen(request, timeout=PAGE_TIMEOUT) as response:
            kind = response.headers.get("content-type", "")
            if count and "html" not in kind and "text" not in kind:
                return None
            data = response.read(MAX_BYTES)
            charset = response.headers.get_content_charset() or "utf-8"
            return data.decode(charset, errors="replace")

    def page(self, url):
        if not self.allowed(url):
            return None
        try:
            return self.fetch_raw(url)
        except Exception:
            return None


def emails_in(page):
    found = []
    for raw in MAILTO.findall(page):
        found.append(("mailto", urllib.parse.unquote(raw)))
    text = html.unescape(page)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    for m in EMAIL.findall(text):
        found.append(("text", m))
    for user, domain in OBFUSCATED.findall(text):
        domain = re.sub(r"\s*[\[\(\{]\s*(dot|point)\s*[\]\)\}]\s*", ".", domain, flags=re.I)
        found.append(("text", f"{user}@{domain}"))
    clean = []
    for how, email in found:
        email = email.strip().strip(".").lower()
        if not EMAIL.fullmatch(email) or ASSET.search(email):
            continue
        user, domain = email.split("@", 1)
        if ROBOT_USER.match(user) or FOREIGN.search(domain) or re.fullmatch(r"[0-9a-f]{16,}", user):
            continue
        clean.append((how, email))
    return clean


def rank(email, how, site_domain):
    user, domain = email.split("@", 1)
    own = registered_domain(domain) == site_domain
    if not own and domain not in WEBMAIL:
        return None  # another company's address (the web agency, a supplier)
    base = 0 if own else 100
    head = re.split(r"[.\-_+]", user)[0]
    if head in FIRST:
        base += FIRST.index(head)
    elif head in LAST:
        base += 60
    else:
        base += 30
    return base + (0 if how == "mailto" else 1)


def find_email(site):
    reader = Reader(site)
    site_domain = registered_domain(reader.host) if reader.host else ""
    if not site_domain:
        return None, "site illisible"
    seen_urls, candidates = set(), {}

    def read(url):
        if url in seen_urls:
            return None
        seen_urls.add(url)
        page = reader.page(url)
        if page:
            for how, email in emails_in(page):
                score = rank(email, how, site_domain)
                if score is not None and (email not in candidates or score < candidates[email]):
                    candidates[email] = score
        return page

    home = read(reader.base)
    if home is None and reader.pages == 1:
        return None, "site injoignable"
    links = []
    for href in HREF.findall(home or ""):
        url = urllib.parse.urljoin(reader.base, html.unescape(href))
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme in ("http", "https") and registered_domain(parsed.hostname or "") == site_domain \
                and CONTACT_WORDS.search(parsed.path) and not ASSET.search(parsed.path):
            links.append(url.split("#")[0])
    for url in dict.fromkeys(links):
        if candidates and min(candidates.values()) < 30:
            break
        read(url)
    if not candidates:
        for path in USUAL_PATHS:
            if candidates or reader.pages >= MAX_PAGES:
                break
            read(urllib.parse.urljoin(reader.base, path))
    if not candidates:
        return None, "aucune adresse publiée"
    return min(candidates, key=candidates.get), "trouvée"


def masked(email):
    user, domain = email.split("@", 1)
    return f"{user[0]}•••@{domain}"


def main():
    api.APPLY = APPLY
    api.COMPLETE = True
    try:
        api.login()
        listed = api.call("GET", "/internal/platform/prospects")["data"]
        todo = [p for p in listed if not p.get("email") and p.get("website") and p.get("status") != "unsubscribed"][:LIMIT]
        print(f"{len(listed)} prospects, {len(todo)} sans e-mail avec un site")
        with concurrent.futures.ThreadPoolExecutor(WORKERS) as pool:
            results = list(pool.map(lambda p: (p, *find_email(p["website"])), todo))
        rows, lines = [], []
        for p, email, outcome in results:
            shown = masked(email) if email else outcome
            lines.append(f"| {p['companyName']} | {p.get('airportCode') or ''} | {p['website']} | {shown} |")
            if email:
                rows.append({"companyName": p["companyName"], "airportCode": p.get("airportCode") or "", "email": email})
        found = len(rows)
        summary = [f"## E-mails trouvés sur les sites : {found} sur {len(todo)}", "",
                   "| Parking | Aéroport | Site | Adresse |", "|---|---|---|---|", *lines]
        print("\n".join(summary))
        target = os.environ.get("GITHUB_STEP_SUMMARY")
        if target:
            with open(target, "a", encoding="utf-8") as fh:
                fh.write("\n".join(summary) + "\n\n")
        if rows:
            for row in rows:
                if not row["airportCode"]:
                    del row["airportCode"]
            answer = api.call("POST", "/internal/platform/prospects/import", {"rows": rows, "dryRun": not APPLY, "complete": True})
            api.report(rows, answer)
    finally:
        api.logout()


if __name__ == "__main__":
    main()
