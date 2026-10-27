"""Creates or updates one CNAME of a Cloudflare zone (workflow cloudflare-dns.yml). Never prints a token."""

import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.cloudflare.com/client/v4"


def call(token: str, method: str, path: str, body: dict | None = None) -> dict:
    request = urllib.request.Request(
        f"{API}{path}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        payload = json.load(error)
        codes = ", ".join(f"{e.get('code')} {e.get('message')}" for e in payload.get("errors", []))
        raise SystemExit(f"::error::Cloudflare answered {error.code} on {method} {path.split('?')[0]}: {codes}")


def main() -> None:
    token = os.environ.get("DNS_TOKEN") or os.environ.get("WORKERS_TOKEN")
    if not token:
        sys.exit("::error::Neither CLOUDFLARE_DNS_TOKEN nor CLOUDFLARE_API_TOKEN is set in the Production environment.")
    zone_name = os.environ["ZONE_NAME"]
    name = os.environ["RECORD_NAME"].strip().lower()
    content = os.environ["RECORD_CONTENT"].strip().rstrip(".")
    proxied = os.environ.get("RECORD_PROXIED") == "true"
    fqdn = zone_name if name in ("", "@") else f"{name}.{zone_name}"

    zones = call(token, "GET", f"/zones?name={zone_name}")["result"]
    if not zones:
        sys.exit(f"::error::The token sees no zone {zone_name}: give it « Zone · DNS · Edit » on {zone_name}.")
    zone_id = zones[0]["id"]

    existing = call(token, "GET", f"/zones/{zone_id}/dns_records?name={fqdn}")["result"]
    record = {"type": "CNAME", "name": fqdn, "content": content, "proxied": proxied, "ttl": 1, "comment": "Plazo Pro (Vercel)"}
    others = [r for r in existing if r["type"] != "CNAME"]
    if others:
        kinds = ", ".join(sorted({r["type"] for r in others}))
        sys.exit(f"::error::{fqdn} already has {kinds} records: nothing changed.")
    if existing:
        call(token, "PUT", f"/zones/{zone_id}/dns_records/{existing[0]['id']}", record)
        print(f"Updated: {fqdn} CNAME {content} (proxied: {proxied})")
    else:
        call(token, "POST", f"/zones/{zone_id}/dns_records", record)
        print(f"Created: {fqdn} CNAME {content} (proxied: {proxied})")


if __name__ == "__main__":
    main()
