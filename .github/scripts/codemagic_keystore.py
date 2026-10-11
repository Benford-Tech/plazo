#!/usr/bin/env python3
"""Put the Android upload keystore into Codemagic, through its REST API v3, then start a build.

Run by .github/workflows/android-keystore.yml once the keystore exists in KEYSTORE_DIR. Codemagic has
no API for its « Code signing identities », but it has one for variable groups: the keystore goes,
base64-encoded, into the SECURE variables of the app's group « plazo_android_signing » (CM_KEYSTORE,
CM_KEYSTORE_PASSWORD, CM_KEY_ALIAS, CM_KEY_PASSWORD), which codemagic.yaml decodes at build time.

Environment:
  CODEMAGIC_API_TOKEN  the token of a team member (Codemagic › Team settings › Integrations › Codemagic API)
  KEYSTORE_DIR         folder holding plazo-upload.jks and plazo-upload-password.txt
  REPLACE              "true" to overwrite a keystore already in the group (default: refuse)
  START_BUILD          "true" to queue WORKFLOW_ID on BRANCH afterwards (default: true)
  APP_NAME, GROUP_NAME, WORKFLOW_ID, BRANCH, KEY_ALIAS  optional overrides
Nothing secret is printed: only names, ids and URLs.
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API = os.environ.get("CODEMAGIC_API", "https://codemagic.io").rstrip("/")
TOKEN = os.environ.get("CODEMAGIC_API_TOKEN", "")
APP_NAME = os.environ.get("APP_NAME", "plazo")
GROUP_NAME = os.environ.get("GROUP_NAME", "plazo_android_signing")
WORKFLOW_ID = os.environ.get("WORKFLOW_ID", "mobile-release-android")
BRANCH = os.environ.get("BRANCH", "main")
KEY_ALIAS = os.environ.get("KEY_ALIAS", "upload")
KEYSTORE_DIR = os.environ.get("KEYSTORE_DIR", "out")
REPLACE = os.environ.get("REPLACE", "false").lower() == "true"
START_BUILD = os.environ.get("START_BUILD", "true").lower() != "false"
VARIABLE_NAMES = ("CM_KEYSTORE", "CM_KEYSTORE_PASSWORD", "CM_KEY_ALIAS", "CM_KEY_PASSWORD")


def fail(message):
    print(f"ERREUR: {message}", file=sys.stderr)
    sys.exit(1)


def call(method, path, body=None, query=None):
    url = f"{API}{path}"
    if query:
        url += "?" + urllib.parse.urlencode(query)
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("x-auth-token", TOKEN)
    request.add_header("Accept", "application/json")
    if data is not None:
        request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read()
            return response.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")[:500]
        # The error body never carries our values: it is safe to show.
        fail(f"Codemagic a répondu {error.code} sur {method} {path} : {detail}")


def paginated(path, query=None):
    page = 1
    while True:
        status, payload = call("GET", path, query={**(query or {}), "page": page, "page_size": 100})
        yield from payload.get("data", [])
        if page >= int(payload.get("total_pages") or 1):
            return
        page += 1


def find_app():
    """The Codemagic app of this repository: by exact name, in the user's apps then in every team."""
    candidates = [a for a in paginated("/api/v3/user/apps", {"name": APP_NAME})
                  if a.get("name", "").lower() == APP_NAME.lower() and not a.get("archived")]
    if not candidates:
        for team in paginated("/api/v3/user/teams"):
            candidates += [a for a in paginated(f"/api/v3/teams/{team['id']}/apps", {"name": APP_NAME})
                           if a.get("name", "").lower() == APP_NAME.lower() and not a.get("archived")]
    ids = sorted({a["id"] for a in candidates})
    if not ids:
        fail(f"aucune app Codemagic nommée « {APP_NAME} » pour ce jeton : ajouter le dépôt à l'équipe d'abord")
    if len(ids) > 1:
        fail(f"plusieurs apps Codemagic s'appellent « {APP_NAME} » ({', '.join(ids)}) : préciser APP_NAME")
    return ids[0]


def find_or_create_group(app_id):
    for group in paginated(f"/api/v3/apps/{app_id}/variable-groups"):
        if group.get("name") == GROUP_NAME:
            return group["id"], False
    status, payload = call("POST", f"/api/v3/apps/{app_id}/variable-groups", {"name": GROUP_NAME})
    return payload["data"]["id"], True


def main():
    if not TOKEN:
        fail("CODEMAGIC_API_TOKEN est vide")
    with open(os.path.join(KEYSTORE_DIR, "plazo-upload.jks"), "rb") as handle:
        keystore_b64 = base64.b64encode(handle.read()).decode()
    with open(os.path.join(KEYSTORE_DIR, "plazo-upload-password.txt"), encoding="utf-8") as handle:
        password = handle.read().strip()
    if len(password) < 20:
        fail("mot de passe trop court")

    app_id = find_app()
    print(f"App Codemagic : {app_id}")
    group_id, created = find_or_create_group(app_id)
    print(f"Groupe « {GROUP_NAME} » : {group_id} ({'créé' if created else 'existant'})")

    existing = {v["name"]: v for v in paginated(f"/api/v3/variable-groups/{group_id}/variables")}
    present = [name for name in VARIABLE_NAMES if name in existing]
    if present and not REPLACE:
        fail("le groupe contient déjà une clé (" + ", ".join(present) + "). Une clé déjà envoyée à Google Play "
             "ne se remplace pas : relancer avec « replace » seulement si aucun AAB n'a encore été importé")
    for name in present:
        call("DELETE", f"/api/v3/variable-groups/{group_id}/variables/{existing[name]['id']}")
        print(f"Variable remplacée : {name}")

    variables = [
        {"name": "CM_KEYSTORE", "value": keystore_b64},
        {"name": "CM_KEYSTORE_PASSWORD", "value": password},
        {"name": "CM_KEY_ALIAS", "value": KEY_ALIAS},
        {"name": "CM_KEY_PASSWORD", "value": password},
    ]
    call("POST", f"/api/v3/variable-groups/{group_id}/variables", {"secure": True, "variables": variables})

    after = {v["name"]: v for v in paginated(f"/api/v3/variable-groups/{group_id}/variables")}
    missing = [name for name in VARIABLE_NAMES if name not in after]
    if missing:
        fail("variables absentes après l'envoi : " + ", ".join(missing))
    not_secure = [name for name in VARIABLE_NAMES if not after[name].get("secure")]
    if not_secure:
        fail("variables envoyées sans le marquage « Secure » : " + ", ".join(not_secure))
    print("Clé envoyée à Codemagic : " + ", ".join(VARIABLE_NAMES) + " (Secure)")

    summary = [f"- App Codemagic `{app_id}`, groupe `{GROUP_NAME}` (`{group_id}`) : clé envoyée, variables Secure."]
    if START_BUILD:
        status, payload = call("POST", f"/api/v3/apps/{app_id}/builds", {"workflow_id": WORKFLOW_ID, "branch": BRANCH})
        build_id = payload["data"]["id"]
        build_url = f"https://codemagic.io/app/{app_id}/build/{build_id}"
        print(f"Build Codemagic lancé : {WORKFLOW_ID} sur {BRANCH} → {build_url}")
        summary.append(f"- Build `{WORKFLOW_ID}` sur `{BRANCH}` lancé : {build_url}")
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        with open(step_summary, "a", encoding="utf-8") as handle:
            handle.write("\n".join(summary) + "\n")


if __name__ == "__main__":
    main()
