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
import os

from codemagic_api import call, ensure_group, fail, find_app, start_build, summary, variables_of

GROUP_NAME = os.environ.get("GROUP_NAME", "plazo_android_signing")
WORKFLOW_ID = os.environ.get("WORKFLOW_ID", "mobile-release-android")
BRANCH = os.environ.get("BRANCH", "main")
KEY_ALIAS = os.environ.get("KEY_ALIAS", "upload")
KEYSTORE_DIR = os.environ.get("KEYSTORE_DIR", "out")
REPLACE = os.environ.get("REPLACE", "false").lower() == "true"
START_BUILD = os.environ.get("START_BUILD", "true").lower() != "false"
VARIABLE_NAMES = ("CM_KEYSTORE", "CM_KEYSTORE_PASSWORD", "CM_KEY_ALIAS", "CM_KEY_PASSWORD")
# Every group codemagic.yaml references must exist, or Codemagic refuses the build before it starts
# (« references to unknown variable group(s) »): the Google Play group is created empty when missing,
# its credentials being added by hand later (mobile/publier-sur-les-stores.md, step 1.5).
OTHER_GROUPS = ("mobile_secrets",)


def main():
    with open(os.path.join(KEYSTORE_DIR, "plazo-upload.jks"), "rb") as handle:
        keystore_b64 = base64.b64encode(handle.read()).decode()
    with open(os.path.join(KEYSTORE_DIR, "plazo-upload-password.txt"), encoding="utf-8") as handle:
        password = handle.read().strip()
    if len(password) < 20:
        fail("mot de passe trop court")

    app_id = find_app()["id"]
    print(f"App Codemagic : {app_id}")
    group_id, created = ensure_group(app_id, GROUP_NAME)
    print(f"Groupe « {GROUP_NAME} » : {group_id} ({'créé' if created else 'existant'})")

    existing = variables_of(group_id)
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

    after = variables_of(group_id)
    missing = [name for name in VARIABLE_NAMES if name not in after]
    if missing:
        fail("variables absentes après l'envoi : " + ", ".join(missing))
    not_secure = [name for name in VARIABLE_NAMES if not after[name].get("secure")]
    if not_secure:
        fail("variables envoyées sans le marquage « Secure » : " + ", ".join(not_secure))
    print("Clé envoyée à Codemagic : " + ", ".join(VARIABLE_NAMES) + " (Secure)")
    lines = [f"- App Codemagic `{app_id}`, groupe `{GROUP_NAME}` (`{group_id}`) : clé envoyée, variables Secure."]

    for name in OTHER_GROUPS:
        other_id, other_created = ensure_group(app_id, name)
        if other_created:
            print(f"Groupe « {name} » créé vide ({other_id}) : ses variables restent à ajouter dans Codemagic")
            lines.append(f"- Groupe `{name}` créé vide : ajouter ses variables dans Codemagic (guide, étape 1.5).")

    if START_BUILD:
        build_id, url = start_build(app_id, WORKFLOW_ID, BRANCH)
        print(f"Build Codemagic lancé : {WORKFLOW_ID} sur {BRANCH} → {url}")
        lines.append(f"- Build `{WORKFLOW_ID}` sur `{BRANCH}` lancé : {url}")
    summary(lines)


if __name__ == "__main__":
    main()
