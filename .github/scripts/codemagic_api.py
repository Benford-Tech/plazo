"""Small client of the Codemagic REST API v3, shared by the GitHub workflows that drive Codemagic.

Authentication: CODEMAGIC_API_TOKEN (the token of a team member, Codemagic › Team settings › Integrations ›
Codemagic API), kept as a GitHub repository secret. Nothing here prints a value: only names, ids and URLs.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API = os.environ.get("CODEMAGIC_API", "https://codemagic.io").rstrip("/")
TOKEN = os.environ.get("CODEMAGIC_API_TOKEN", "")
APP_NAME = os.environ.get("APP_NAME", "plazo")


def fail(message):
    print(f"ERREUR: {message}", file=sys.stderr)
    sys.exit(1)


def call(method, path, body=None, query=None):
    if not TOKEN:
        fail("CODEMAGIC_API_TOKEN est vide (secret GitHub absent)")
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


def find_app(name=None):
    """The Codemagic app of this repository, by exact name: the user's apps first, then every team's."""
    name = name or APP_NAME
    candidates = [a for a in paginated("/api/v3/user/apps", {"name": name})
                  if a.get("name", "").lower() == name.lower() and not a.get("archived")]
    if not candidates:
        for team in paginated("/api/v3/user/teams"):
            candidates += [a for a in paginated(f"/api/v3/teams/{team['id']}/apps", {"name": name})
                           if a.get("name", "").lower() == name.lower() and not a.get("archived")]
    ids = sorted({a["id"] for a in candidates})
    if not ids:
        fail(f"aucune app Codemagic nommée « {name} » pour ce jeton : ajouter le dépôt à l'équipe d'abord")
    if len(ids) > 1:
        fail(f"plusieurs apps Codemagic s'appellent « {name} » ({', '.join(ids)}) : préciser APP_NAME")
    return next(a for a in candidates if a["id"] == ids[0])


def teams_of_user():
    return list(paginated("/api/v3/user/teams"))


def team_has_app(team_id, app_id, name=None):
    """Whether the team lists the app (looked up by name, which the endpoint filters on, then by id)."""
    apps = paginated(f"/api/v3/teams/{team_id}/apps", {"name": name or APP_NAME})
    return any(a.get("id") == app_id for a in apps)


def find_team(app_id):
    """The team that owns the app, or None when it is a personal app."""
    for team in teams_of_user():
        if team_has_app(team["id"], app_id):
            return team
    return None


def groups_of(app_id):
    return list(paginated(f"/api/v3/apps/{app_id}/variable-groups"))


def ensure_group(app_id, name):
    """The id of the app's variable group `name`, created empty when missing. Returns (id, created)."""
    for group in groups_of(app_id):
        if group.get("name") == name:
            return group["id"], False
    status, payload = call("POST", f"/api/v3/apps/{app_id}/variable-groups", {"name": name})
    return payload["data"]["id"], True


def variables_of(group_id):
    """name -> {id, name, secure} (values are never requested from a secure group, and never printed)."""
    return {v["name"]: v for v in paginated(f"/api/v3/variable-groups/{group_id}/variables")}


def start_build(app_id, workflow_id, branch, instance_type=None):
    body = {"workflow_id": workflow_id, "branch": branch}
    if instance_type:
        # Overrides the workflow's machine: an Android-only build runs on Linux as well as on a Mac mini.
        body["instance_type"] = instance_type
    status, payload = call("POST", f"/api/v3/apps/{app_id}/builds", body)
    build_id = payload["data"]["id"]
    return build_id, build_url(app_id, build_id)


def build_url(app_id, build_id):
    return f"https://codemagic.io/app/{app_id}/build/{build_id}"


def summary(lines):
    """Append Markdown lines to the GitHub step summary when running in Actions."""
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")
