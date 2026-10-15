#!/usr/bin/env python3
"""Is the Worker "plazo" still the mail relay? (email-worker-ci.yml, scheduled check, 15/10/2026)

Cloudflare's Git integration (Workers Builds) is still linked to the repository and deploys the Worker on pushes to
main; its build has no email handler, so Email Routing answers « Destination worker not found » and refuses every
mail (14/10/2026 19:02 UTC, after #106). The relay has an `email` and a `scheduled` handler: the current deployment's
main version must have both. Writes healthy=true|false to GITHUB_OUTPUT; anything unreadable counts as not healthy,
so the job redeploys (a deploy of the same code is harmless). Run from email-worker/ (wrangler.toml). Prints no secret.
"""
import json
import os
import subprocess

REQUIRED = {"email", "scheduled"}


def wrangler(*args):
    result = subprocess.run(["npx", "wrangler", *args, "--json"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"wrangler {' '.join(args)} a échoué ({result.returncode}) : {result.stderr.strip()[-300:]}")
        return None
    try:
        return json.loads(result.stdout)
    except ValueError:
        print(f"wrangler {' '.join(args)} : réponse illisible")
        return None


def healthy():
    status = wrangler("deployments", "status")
    if isinstance(status, list):
        status = status[0] if status else None
    versions = (status or {}).get("versions") or []
    if not versions:
        print("Aucun déploiement lu.")
        return False
    main = max(versions, key=lambda v: v.get("percentage") or 0)
    version_id = main.get("version_id") or main.get("id")
    print(f"Déploiement actuel : source {status.get('source')}, créé {status.get('created_on')}, version {version_id}")
    version = wrangler("versions", "view", version_id) if version_id else None
    handlers = set(((version or {}).get("resources") or {}).get("script", {}).get("handlers") or [])
    print(f"Gestionnaires de cette version : {', '.join(sorted(handlers)) or 'aucun'}")
    return REQUIRED <= handlers


def main():
    ok = healthy()
    print("Le Worker est bien le relais des mails." if ok else "::warning::Le Worker n'est plus le relais des mails : redéploiement.")
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write(f"healthy={'true' if ok else 'false'}\n")


if __name__ == "__main__":
    main()
