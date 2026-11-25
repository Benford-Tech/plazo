"""Exports the prospects of Plateforme › Prospection, encrypted, to prepare the prospecting calls
(25/11/2026, « Analyse toutes les prospect pour préparer les appel de pospection »).

The repository is public: its logs and artifacts can be read by anyone. So the list is never printed, and the file is
encrypted before it leaves the runner: a random AES-256 key encrypts the JSON, and the RSA public key given as
PUBLIC_KEY (PEM) encrypts that key (OAEP). Only the holder of the private key reads it. Read-only: nothing is written.
Signs in with PLAZO_ADMIN_EMAIL / PLAZO_ADMIN_PASSWORD and closes the session at the end.
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
import import_prospects as api  # noqa: E402

PUBLIC_KEY = os.environ.get("PUBLIC_KEY", "").strip()
OUT = os.environ.get("OUT_DIR", "export")


def run(*command):
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    if "BEGIN PUBLIC KEY" not in PUBLIC_KEY:
        api.fail("PUBLIC_KEY must be an RSA public key in PEM")
    os.makedirs(OUT, exist_ok=True)
    work = os.environ.get("RUNNER_TEMP", "/tmp")
    plain, key, pem = (os.path.join(work, n) for n in ("prospects.json", "aes.key", "public.pem"))
    # A one-line input loses its line breaks: put them back around the base64 body.
    body = PUBLIC_KEY.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").split()
    with open(pem, "w", encoding="utf-8") as out:
        out.write("-----BEGIN PUBLIC KEY-----\n" + "\n".join(body) + "\n-----END PUBLIC KEY-----\n")
    api.login()
    try:
        answer = api.call("GET", "/internal/platform/prospects")
    finally:
        api.logout()
    with open(plain, "w", encoding="utf-8") as out:
        json.dump(answer, out, ensure_ascii=False)
    try:
        run("openssl", "rand", "-out", key, "32")
        run("openssl", "enc", "-aes-256-cbc", "-pbkdf2", "-salt", "-in", plain, "-out", os.path.join(OUT, "prospects.json.enc"), "-pass", f"file:{key}")
        run("openssl", "pkeyutl", "-encrypt", "-pubin", "-inkey", pem, "-pkeyopt", "rsa_padding_mode:oaep", "-in", key, "-out", os.path.join(OUT, "key.enc"))
    finally:
        for path in (plain, key):
            if os.path.exists(path):
                os.remove(path)
    print(f"{len(answer.get('data', []))} prospects exportés, chiffrés.")


if __name__ == "__main__":
    main()
