"""Removes from Plateforme › Prospection the prospects added by « Nouveaux parkings » that are not airport car parks with a
shuttle (23/11/2026, « les prospect ne sont pas des parkings d'aeroport avec navette !!! verifie avant ! »).

A prospect is looked at when it carries the marker of « Nouveaux parkings » (origin bodacc or directory). It is kept when
its name is in KEEP (the names checked by hand: a website or a listing shows an airport car park with a shuttle or a valet).
Otherwise it is deleted only when nothing was ever sent to it (no mail, no SMS, still « À contacter ») and it was created by
the workflow (on or after CREATED_SINCE); a prospect that was already listed before keeps its row and only loses the marker
(origin, foundOn and opensOn put back to empty by PATCH). APPLY=false (the default): the preview only.
"""
import os
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(__file__))
import import_prospects as api  # noqa: E402  (sign-in, calls, sign-out)

APPLY = os.environ.get("APPLY", "").strip().lower() == "true"
CREATED_SINCE = os.environ.get("CREATED_SINCE", "").strip() or "2026-11-22"
KEEP_RAW = os.environ.get("KEEP", "")


def plain(text):
    text = unicodedata.normalize("NFD", text or "")
    return " ".join("".join(c for c in text if not unicodedata.combining(c)).lower().split())


KEEP = {plain(n) for n in KEEP_RAW.replace("\n", ";").split(";") if n.strip()}


def never_contacted(p):
    return p.get("status") == "to_contact" and not p.get("firstContactedAt") and not p.get("lastSmsAt") and not p.get("step")


def main():
    try:
        api.login()
        answer = api.call("GET", "/internal/platform/prospects")
        prospects = [p for p in answer.get("data", answer.get("prospects", [])) if p.get("origin") in ("bodacc", "directory")]
        rows, removed, unmarked, kept = [], 0, 0, 0
        for p in sorted(prospects, key=lambda p: (p.get("airportCode") or "", p.get("companyName") or "")):
            name = p.get("companyName") or "?"
            if plain(name) in KEEP:
                kept += 1
                rows.append(f"| {name} | {p.get('airportCode') or ''} | gardé (vérifié) |")
                continue
            created = (p.get("createdAt") or "")[:10]
            if created >= CREATED_SINCE and never_contacted(p):
                if APPLY:
                    api.call("DELETE", f"/internal/platform/prospects/{p['id']}")
                removed += 1
                rows.append(f"| {name} | {p.get('airportCode') or ''} | {'supprimé' if APPLY else 'à supprimer'} |")
            else:
                if APPLY:
                    api.call("PATCH", f"/internal/platform/prospects/{p['id']}", {"origin": None, "foundOn": None, "opensOn": None})
                unmarked += 1
                rows.append(f"| {name} | {p.get('airportCode') or ''} | {'marqueur retiré' if APPLY else 'marqueur à retirer'} (déjà listé avant ou déjà contacté) |")
        title = "Nettoyage fait" if APPLY else "Aperçu du nettoyage (rien n'est écrit)"
        summary = [f"## {title}", "", f"{len(prospects)} prospects marqués « Nouveau parking » · {kept} gardés · "
                   f"{removed} {'supprimés' if APPLY else 'à supprimer'} · {unmarked} {'démarqués' if APPLY else 'à démarquer'}",
                   "", "| Prospect | Aéroport | Résultat |", "|---|---|---|", *rows]
        print("\n".join(summary))
        target = os.environ.get("GITHUB_STEP_SUMMARY")
        if target:
            with open(target, "a", encoding="utf-8") as fh:
                fh.write("\n".join(summary) + "\n")
        missing = KEEP - {plain(p.get("companyName") or "") for p in prospects}
        if missing:
            print(f"::warning::Noms à garder introuvables parmi les prospects marqués : {', '.join(sorted(missing))}")
    finally:
        api.logout()


if __name__ == "__main__":
    main()
