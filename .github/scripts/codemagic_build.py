#!/usr/bin/env python3
"""Drive Codemagic from GitHub (workflow codemagic-build.yml): start a build, read its status, list groups.

Actions (ACTION):
  status        the build BUILD_ID (default: the app's last build): status, workflow, times, artifacts
  steps         the steps of that build with their status (which one failed)
  logs          the end of the log of each failed step of that build, and of its store uploads (they run with
                ignore_failure, so a refused upload shows only in the summary step): why Google Play or App Store
                Connect said no
  start         queue WORKFLOW_ID (default mobile-release-android) on BRANCH (default main)
  cancel        cancel the build BUILD_ID (queued or running; v1 API), e.g. one queued for hours
  groups        the app's variable groups and the NAMES of their variables (never the values)
  ensure-group  create the app variable group GROUP_NAME when it is missing (empty)
  team          why a build waits: on a personal account (Plazo, 11/10/2026) the last build of every app of the
                account and where the free minutes are counted; in a team its subscription and running builds
Nothing secret is printed.
"""
import os

import re

from codemagic_api import (API_V1, build_url, call, cancel_build, ensure_group, fail, fetch_text, find_app, groups_of,
                           paginated, start_build, summary, team_has_app, teams_of_user, variables_of)

ACTION = os.environ.get("ACTION", "status").strip()
WORKFLOW_ID = os.environ.get("WORKFLOW_ID", "").strip() or "mobile-release-android"
BRANCH = os.environ.get("BRANCH", "").strip() or "main"
BUILD_ID = os.environ.get("BUILD_ID", "").strip()
GROUP_NAME = os.environ.get("GROUP_NAME", "").strip()
INSTANCE_TYPE = os.environ.get("INSTANCE_TYPE", "").strip()

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


def steps(app):
    """The steps Codemagic ran for the build and their status: which one failed."""
    build_id = BUILD_ID or app.get("last_build_id")
    if not build_id:
        fail("aucun build : préciser build_id")
    code, payload = call("GET", f"/api/v3/builds/{build_id}/actions", query={"page_size": 100})
    actions = payload.get("data", [])
    lines = [f"Étapes du build {build_id} ({len(actions)}) :"]
    for action in actions:
        when = f" {action.get('started_at') or '—'} → {action.get('finished_at') or '—'}"
        lines.append(f"- {action.get('status') or '?'} · {action.get('type')} · {action.get('name')}{when}")
    if not actions:
        lines.append("- aucune étape : le build n'a pas démarré (configuration refusée, machine ou minutes indisponibles : "
                     f"la raison est sur {build_url(app['id'], build_id)})")
    print("\n".join(lines))
    summary(lines)


LOG_LINES = 60
STORE_STEP = re.compile(r"Google Play|App Store|TestFlight|Bilan", re.IGNORECASE)


def logs(app):
    """The last lines of the log of every failed step, and of the store steps (v1 API: build.buildActions[].logUrl)."""
    build_id = BUILD_ID or app.get("last_build_id")
    if not build_id:
        fail("aucun build : préciser build_id")
    code, payload = call("GET", f"{API_V1}/builds/{build_id}")
    actions = ((payload or {}).get("build") or {}).get("buildActions") or []
    picked = [a for a in actions if a.get("status") not in ("success", "skipped") or STORE_STEP.search(a.get("name") or "")]
    lines = [f"Journaux du build {build_id} ({len(picked)} étape(s) sur {len(actions)}) :"]
    if actions and not any(a.get("logUrl") for a in actions):
        lines.append(f"- pas de logUrl dans la réponse ; champs d'une étape : {sorted(actions[0].keys())}")
    for action in picked:
        url = action.get("logUrl")
        text = fetch_text(url) if url else "(pas de journal)"
        tail = [line.rstrip() for line in text.splitlines() if line.strip()][-LOG_LINES:]
        lines += [f"### {action.get('name')} · {action.get('status')}", "```", *tail, "```"]
    print("\n".join(lines))
    summary(lines)


def start(app):
    build_id, url = start_build(app["id"], WORKFLOW_ID, BRANCH, INSTANCE_TYPE or None)
    machine = f" (machine `{INSTANCE_TYPE}`)" if INSTANCE_TYPE else ""
    line = f"Build Codemagic lancé : `{WORKFLOW_ID}` sur `{BRANCH}`{machine} → {url} (id `{build_id}`)"
    print(line)
    summary([line])


def cancel(app):
    """Cancel a queued or running build: a build queued for hours on the free plan blocks the one slot."""
    if not BUILD_ID:
        fail("build_id manquant (le build à annuler)")
    url = build_url(app["id"], BUILD_ID)
    if cancel_build(BUILD_ID):
        line = f"Build `{BUILD_ID}` annulé → {url}"
    else:
        line = f"Build `{BUILD_ID}` déjà terminé, rien à annuler → {url}"
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
                 "- Compte personnel : 500 minutes gratuites par mois sur Mac mini M2 (compteur sur "
                 "https://codemagic.io/billing/user, remis à zéro le 1er ; au-delà, « Enable billing » sur cette page : "
                 "macOS M2 0,095 $/min, Linux 0,045 $/min et seulement avec la facturation), un seul build à la fois ; un "
                 "build d'une autre app du compte occupe cette place. Dernier build de chaque app du compte :"]
        busy = 0
        for app_row in paginated("/api/v3/user/apps"):
            last = app_row.get("last_build_id")
            if not last:
                lines.append(f"  - `{app_row.get('name')}` : aucun build")
                continue
            code, payload = call("GET", f"/api/v3/builds/{last}")
            build = payload.get("data") or {}
            busy += build.get("status") in RUNNING
            lines.append(f"  - `{app_row.get('name')}` : {build.get('status')} (créé {build.get('created_at')}, "
                         f"fini {build.get('finished_at') or '—'}, machine `{build.get('instance_type') or '?'}`)")
        if busy:
            lines.append("- Un build qui reste en attente alors que rien d'autre ne tourne : minutes gratuites du mois "
                         "épuisées (compteur ci-dessus), file d'attente Codemagic (https://status.codemagic.io) ou pool "
                         "saturé pour l'image Xcode du workflow (même pour Android : épingler `xcode:` sur une autre "
                         "version dans codemagic.yaml, 11/10/2026) ; Codemagic annule de lui-même un build en attente "
                         "depuis 5 h, l'action `cancel` l'annule avant.")
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
    actions = {"status": status, "steps": steps, "logs": logs, "start": start, "cancel": cancel, "groups": groups,
               "ensure-group": ensure, "team": team}
    if ACTION not in actions:
        fail(f"action inconnue : {ACTION} ({', '.join(actions)})")
    actions[ACTION](app)


if __name__ == "__main__":
    main()
