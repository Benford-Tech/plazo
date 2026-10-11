#!/usr/bin/env python3
"""Drive Codemagic from GitHub (workflow codemagic-build.yml): start a build, read its status, list groups.

Actions (ACTION):
  status        the build BUILD_ID (default: the app's last build): status, workflow, times, artifacts
  start         queue WORKFLOW_ID (default mobile-release-android) on BRANCH (default main)
  groups        the app's variable groups and the NAMES of their variables (never the values)
  ensure-group  create the app variable group GROUP_NAME when it is missing (empty)
  team          the team's subscription state and its running or queued builds (why a build waits)
Nothing secret is printed.
"""
import os

from codemagic_api import (build_url, call, ensure_group, fail, find_app, groups_of, start_build, summary, team_has_app,
                           teams_of_user, variables_of)

ACTION = os.environ.get("ACTION", "status").strip()
WORKFLOW_ID = os.environ.get("WORKFLOW_ID", "").strip() or "mobile-release-android"
BRANCH = os.environ.get("BRANCH", "").strip() or "main"
BUILD_ID = os.environ.get("BUILD_ID", "").strip()
GROUP_NAME = os.environ.get("GROUP_NAME", "").strip()

ENDED = {"finished", "failed", "canceled", "timeout", "skipped"}


def human_size(size):
    for unit in ("o", "Ko", "Mo"):
        if size < 1024:
            return f"{size:.0f} {unit}"
        size /= 1024
    return f"{size:.1f} Go"


def status(app):
    build_id = BUILD_ID or app.get("last_build_id")
    if not build_id:
        fail("aucun build : préciser build_id, ou l'app n'a encore jamais construit")
    code, payload = call("GET", f"/api/v3/builds/{build_id}")
    build = payload["data"]
    workflow = build.get("workflow") or {}
    state = build.get("status")
    url = build_url(app["id"], build_id)
    lines = [
        f"Build {build_id} : **{state}**",
        f"- workflow `{workflow.get('id')}` ({workflow.get('name') or 'sans nom'}), branche `{build.get('branch')}`, "
        f"commit `{(build.get('commit') or {}).get('hash', '')[:10]}`",
        f"- créé {build.get('created_at')}, démarré {build.get('started_at') or '—'}, fini {build.get('finished_at') or '—'}",
        f"- {url}",
    ]
    artifacts = build.get("artifacts") or []
    if artifacts:
        lines.append("- artefacts :")
        for artifact in artifacts:
            version = f" ({artifact.get('version_name')} / {artifact.get('version_code')})" if artifact.get("version_name") else ""
            lines.append(f"  - `{artifact.get('name')}` {artifact.get('type')}, {human_size(artifact.get('size_in_bytes') or 0)}{version}")
    elif state in ENDED:
        lines.append("- aucun artefact")
    print("\n".join(lines))
    summary(lines)
    # The step is green while the build runs or succeeded, red when Codemagic reports a failure: the next
    # GitHub run of this workflow (status) tells which Codemagic step failed, by its artifacts and logs.
    if state in ENDED and state != "finished":
        fail(f"le build Codemagic s'est terminé en {state} : ouvrir {url} pour l'étape en cause")


def start(app):
    build_id, url = start_build(app["id"], WORKFLOW_ID, BRANCH)
    line = f"Build Codemagic lancé : `{WORKFLOW_ID}` sur `{BRANCH}` → {url} (id `{build_id}`)"
    print(line)
    summary([line])


def groups(app):
    lines = [f"Groupes de variables de l'app `{app['id']}` :"]
    for group in groups_of(app["id"]):
        names = sorted(variables_of(group["id"]).keys())
        lines.append(f"- `{group['name']}` ({group['id']}) : " + (", ".join(f"`{n}`" for n in names) or "vide"))
    print("\n".join(lines))
    summary(lines)


def ensure(app):
    if not GROUP_NAME:
        fail("group_name manquant")
    group_id, created = ensure_group(app["id"], GROUP_NAME)
    line = f"Groupe `{GROUP_NAME}` : `{group_id}` ({'créé vide' if created else 'existait déjà'})"
    print(line)
    summary([line])


RUNNING = ("initializing", "queued", "preparing", "fetching", "testing", "building", "publishing", "finishing")


def team(app):
    """Why a build may wait: the team's subscription and the builds it is running or queuing."""
    teams = teams_of_user()
    owner = next((t for t in teams if team_has_app(t["id"], app["id"])), None)
    others = ", ".join(f"`{t['name']}`" for t in teams if not owner or t["id"] != owner["id"]) or "aucune"
    if not owner:
        lines = [f"App **personnelle** du compte (hors équipe) ; équipes du compte : {others}.",
                 "- Sans équipe, pas d'abonnement ni de file à lire : les minutes gratuites du compte personnel s'épuisent, "
                 "et les identités de signature et intégrations de l'équipe (iOS) ne sont pas accessibles."]
        print("\n".join(lines))
        summary(lines)
        return
    lines = [f"Équipe `{owner['name']}` (`{owner['id']}`) ; autres équipes du compte : {others}"]
    code, payload = call("GET", f"/api/v3/teams/{owner['id']}/subscriptions")
    for sub in payload.get("data", []):
        lines.append(f"- abonnement {sub.get('category')} : **{sub.get('status')}** ({sub.get('pricing_model')}"
                     + (f", essai jusqu'au {sub['trial_end_at']}" if sub.get("trial_end_at") else "") + ")")
    if not payload.get("data"):
        lines.append("- aucun abonnement")
    busy = []
    for state in RUNNING:
        code, payload = call("GET", f"/api/v3/teams/{owner['id']}/builds", query={"status": state, "page_size": 20})
        busy += payload.get("data", [])
    lines.append(f"- builds en cours ou en attente dans l'équipe : {len(busy)}")
    for build in sorted(busy, key=lambda b: b.get("created_at") or ""):
        mine = " (cette app)" if build.get("app_id") == app["id"] else ""
        lines.append(f"  - {build.get('status')} depuis {build.get('created_at')} : app `{build.get('app_id')}`{mine}, "
                     f"workflow `{(build.get('workflow') or {}).get('id')}`, build `{build.get('id')}`")
    print("\n".join(lines))
    summary(lines)


def main():
    app = find_app()
    print(f"App Codemagic : {app['id']} ({app['name']})")
    actions = {"status": status, "start": start, "groups": groups, "ensure-group": ensure, "team": team}
    if ACTION not in actions:
        fail(f"action inconnue : {ACTION} (status, start, groups, ensure-group, team)")
    actions[ACTION](app)


if __name__ == "__main__":
    main()
