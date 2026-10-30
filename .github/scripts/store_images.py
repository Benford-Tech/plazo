#!/usr/bin/env python3
"""Replace the screenshots of Plazo and Plazo Pro on Google Play and the App Store (30/10/2026, « publie les images sur
les stores »).

Uploads the marketing images of brand/stores/marketing/A (the style chosen on 13/10/2026), in the order of the listings:
- Google Play: the phone screenshots of every listing language (play/, 1080 x 1920), in one edit, committed at the end;
- App Store: the iPhone 6.9" (appstore69/, APP_IPHONE_67), iPhone 6.3" (appstore63/, APP_IPHONE_61) and iPad 13"
  (ipad13/, APP_IPAD_PRO_3GEN_129) sets of every localization of the version that can still be edited.

Feature graphics, icons and the App Store header / search images are left alone. DRY_RUN=1 only says what would change.
Secrets come from the environment (GitHub environment « stores »), never printed.
"""
import base64
import hashlib
import json
import os
import sys
import time
from pathlib import Path

import jwt
import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[2]
IMAGES = ROOT / 'brand' / 'stores' / 'marketing' / 'A'
APPS = {
    'plazo': {'package': 'com.benfordtech.plazo', 'bundle': 'com.benfordtech.plazo'},
    'plazo-pro': {'package': 'com.benfordtech.plazopro', 'bundle': 'com.benfordtech.plazopro'},
}
APPLE_SETS = {'appstore69': 'APP_IPHONE_67', 'appstore63': 'APP_IPHONE_61', 'ipad13': 'APP_IPAD_PRO_3GEN_129'}
# App Store versions whose metadata can still change.
EDITABLE = {'PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY'}
DRY = os.environ.get('DRY_RUN') == '1'
failures = []


def images(app, folder):
    files = sorted((IMAGES / app / folder).glob('*.png'))
    if not files:
        raise SystemExit(f'no images in {IMAGES / app / folder}')
    return files


# ---------------------------------------------------------------- Google Play
PLAY = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
PLAY_UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications'


def play_session():
    # GitHub's « stores » environment, or Codemagic's mobile_secrets group (either name, codemagic.yaml).
    raw = next((os.environ.get(n, '').strip() for n in ('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON',
                'GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS', 'GCLOUD_SERVICE_ACCOUNT_CREDENTIALS')
                if os.environ.get(n, '').strip()), '')
    if not raw:
        return None
    if not raw.startswith('{'):
        raw = base64.b64decode(raw).decode()
    creds = service_account.Credentials.from_service_account_info(
        json.loads(raw), scopes=['https://www.googleapis.com/auth/androidpublisher'])
    creds.refresh(Request())
    s = requests.Session()
    s.headers['Authorization'] = f'Bearer {creds.token}'
    return s


def check(r, what):
    if r.status_code >= 400:
        raise RuntimeError(f'{what}: HTTP {r.status_code} {r.text[:400]}')
    return r


def play(app, s):
    pkg = APPS[app]['package']
    files = images(app, 'play')
    edit = check(s.post(f'{PLAY}/{pkg}/edits'), 'open edit').json()['id']
    base = f'{PLAY}/{pkg}/edits/{edit}'
    try:
        langs = [l['language'] for l in check(s.get(f'{base}/listings'), 'listings').json().get('listings', [])]
        if not langs:
            raise RuntimeError('no store listing')
        for lang in langs:
            before = check(s.get(f'{base}/listings/{lang}/phoneScreenshots'), 'list').json().get('images', [])
            print(f'  Google Play {app} {lang}: {len(before)} → {len(files)} captures')
            if DRY:
                continue
            check(s.delete(f'{base}/listings/{lang}/phoneScreenshots'), 'delete all')
            for f in files:
                check(s.post(f'{PLAY_UPLOAD}/{pkg}/edits/{edit}/listings/{lang}/phoneScreenshots',
                             params={'uploadType': 'media'}, data=f.read_bytes(),
                             headers={'Content-Type': 'image/png'}), f'upload {f.name}')
        if DRY:
            s.delete(base)
            return
        r = s.post(f'{base}:commit')
        if r.status_code >= 400 and 'changesNotSentForReview' in r.text:
            r = s.post(f'{base}:commit', params={'changesNotSentForReview': 'true'})
        check(r, 'commit')
        print(f'  Google Play {app}: publié')
    except Exception:
        s.delete(base)
        raise


# ---------------------------------------------------------------- App Store Connect
ASC = 'https://api.appstoreconnect.apple.com/v1'


def asc_session():
    issuer = os.environ.get('APP_STORE_CONNECT_ISSUER_ID', '').strip()
    key_id = os.environ.get('APP_STORE_CONNECT_KEY_IDENTIFIER', '').strip()
    key = os.environ.get('APP_STORE_CONNECT_PRIVATE_KEY', '').strip()
    if not (issuer and key_id and key):
        return None
    if key.startswith('@'):
        print(f'  clé App Store Connect donnée en {key.split(":")[0]}:…')
    key = apple_key(key)
    now = int(time.time())
    token = jwt.encode({'iss': issuer, 'iat': now, 'exp': now + 1100, 'aud': 'appstoreconnect-v1'}, key,
                       algorithm='ES256', headers={'kid': key_id, 'typ': 'JWT'})
    s = requests.Session()
    s.headers['Authorization'] = f'Bearer {token}'
    return s


def apple_key(raw):
    """The .p8 key as PEM, however it was handed over: PEM, PEM with literal \\n, a file path, or base64 (with or
    without its padding and PEM armour). Never printed."""
    raw = raw.strip().strip('"').strip("'")
    # Codemagic's tools take « @env:NAME » and « @file:PATH », which its App Store Connect integration hands over.
    for _ in range(3):
        if raw.startswith('@env:'):
            raw = os.environ.get(raw[5:], '').strip()
        elif raw.startswith('@file:'):
            raw = Path(os.path.expanduser(raw[6:])).read_text().strip()
    if os.path.isfile(raw):
        raw = Path(raw).read_text().strip()
    raw = raw.replace('\\n', '\n')
    if 'BEGIN' in raw:
        return raw
    body = ''.join(raw.split())
    try:
        decoded = base64.b64decode(body + '=' * (-len(body) % 4)).decode()
        if 'BEGIN' in decoded:
            return decoded
    except (ValueError, UnicodeDecodeError):
        pass
    # The bare key body: wrap it in its armour.
    lines = [body[i:i + 64] for i in range(0, len(body), 64)]
    return '-----BEGIN PRIVATE KEY-----\n' + '\n'.join(lines) + '\n-----END PRIVATE KEY-----\n'


def apple(app, s):
    bundle = APPS[app]['bundle']
    apps = check(s.get(f'{ASC}/apps', params={'filter[bundleId]': bundle}), 'app').json()['data']
    if not apps:
        raise RuntimeError(f'no App Store Connect app for {bundle}')
    versions = check(s.get(f'{ASC}/apps/{apps[0]["id"]}/appStoreVersions',
                           params={'filter[platform]': 'IOS', 'limit': 10}), 'versions').json()['data']
    states = [(v['attributes']['versionString'], v['attributes'].get('appStoreState')) for v in versions]
    version = next((v for v in versions if v['attributes'].get('appStoreState') in EDITABLE), None)
    if not version:
        raise RuntimeError('aucune version modifiable (' + ', '.join(f'{n} {st}' for n, st in states) + ') : les '
                           'captures ne changent que sur une version « Prête à être soumise » ou refusée')
    print(f'  App Store {app}: version {version["attributes"]["versionString"]} '
          f'({version["attributes"]["appStoreState"]})')
    locs = check(s.get(f'{ASC}/appStoreVersions/{version["id"]}/appStoreVersionLocalizations'), 'locales').json()['data']
    for loc in locs:
        sets = check(s.get(f'{ASC}/appStoreVersionLocalizations/{loc["id"]}/appScreenshotSets'), 'sets').json()['data']
        for folder, display in APPLE_SETS.items():
            files = images(app, folder)
            current = next((x for x in sets if x['attributes']['screenshotDisplayType'] == display), None)
            old = []
            if current:
                old = check(s.get(f'{ASC}/appScreenshotSets/{current["id"]}/appScreenshots'), 'shots').json()['data']
            print(f'    {loc["attributes"]["locale"]} {display}: {len(old)} → {len(files)}')
            if DRY:
                continue
            if not current:
                current = check(s.post(f'{ASC}/appScreenshotSets', json={'data': {
                    'type': 'appScreenshotSets', 'attributes': {'screenshotDisplayType': display},
                    'relationships': {'appStoreVersionLocalization': {
                        'data': {'type': 'appStoreVersionLocalizations', 'id': loc['id']}}}}}), 'new set').json()['data']
            for shot in old:
                check(s.delete(f'{ASC}/appScreenshots/{shot["id"]}'), 'delete')
            ids = [upload_shot(s, current['id'], f) for f in files]
            check(s.patch(f'{ASC}/appScreenshotSets/{current["id"]}/relationships/appScreenshots',
                          json={'data': [{'type': 'appScreenshots', 'id': i} for i in ids]}), 'order')
    if not DRY:
        print(f'  App Store {app}: publié (visible avec la prochaine version soumise)')


def upload_shot(s, set_id, f):
    data = f.read_bytes()
    shot = check(s.post(f'{ASC}/appScreenshots', json={'data': {
        'type': 'appScreenshots', 'attributes': {'fileName': f.name, 'fileSize': len(data)},
        'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': set_id}}}}}),
        f'reserve {f.name}').json()['data']
    for op in shot['attributes']['uploadOperations']:
        part = data[op['offset']:op['offset'] + op['length']]
        headers = {h['name']: h['value'] for h in op.get('requestHeaders', [])}
        r = requests.request(op['method'], op['url'], data=part, headers=headers, timeout=120)
        if r.status_code >= 400:
            raise RuntimeError(f'upload {f.name}: HTTP {r.status_code}')
    check(s.patch(f'{ASC}/appScreenshots/{shot["id"]}', json={'data': {
        'type': 'appScreenshots', 'id': shot['id'],
        'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(data).hexdigest()}}}), f'commit {f.name}')
    return shot['id']


def main():
    apps = (os.environ.get('APPS') or 'plazo plazo-pro').split()
    stores = (os.environ.get('STORES') or 'google apple').split()
    for app in apps:
        if app not in APPS:
            raise SystemExit(f'unknown app {app}')
    if 'google' in stores:
        s = play_session()
        if not s:
            failures.append('Google Play : GOOGLE_PLAY_SERVICE_ACCOUNT_JSON manque')
        else:
            for app in apps:
                try:
                    play(app, s)
                except Exception as e:  # one app's failure must not stop the other
                    failures.append(f'Google Play {app} : {e}')
    if 'apple' in stores:
        s = asc_session()
        if not s:
            failures.append('App Store : clé App Store Connect manquante')
        else:
            for app in apps:
                try:
                    apple(app, s)
                except Exception as e:
                    failures.append(f'App Store {app} : {e}')
    for f in failures:
        print('ÉCHEC', f, file=sys.stderr)
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
