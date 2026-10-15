#!/usr/bin/env python3
"""R8 report of the release APKs, as Markdown (GitHub step summary), for the Android emulator workflow.

  r8_stats.py DIR

DIR holds <app>.apk and mapping/<app>/mapping.txt (copied from build/app/outputs/mapping/<flavor>Release/).
For each app: APK size, DEX size, native libraries per ABI, then from mapping.txt how many classes R8 renamed
(Play Console's « taux d'obscurcissement ») and, per package, its share of the DEX's classes and how many keep their
names (a keep rule: flutter_stripe's consumer rule `-keep class com.stripe.** { *; }`, android/app/proguard-rules.pro).
Informative only: a missing or unreadable file is reported in the Markdown, and the script always exits 0.
"""
import argparse
import collections
import os
import re
import sys
import zipfile

CLASS = re.compile(r'^(\S.*) -> (\S+):$')


def group(name: str) -> str:
    parts = name.split('.')
    depth = 3 if parts[0] in ('com', 'org', 'io', 'androidx', 'net') and len(parts) > 3 else 2
    return '.'.join(parts[:depth]) if len(parts) > 1 else '(paquet par défaut)'


def mb(n: int) -> str:
    return f'{n / 1_048_576:.1f} Mo'


def apk_report(path: str) -> list[str]:
    with zipfile.ZipFile(path) as z:
        infos = z.infolist()
    dex = [i for i in infos if re.fullmatch(r'classes\d*\.dex', i.filename)]
    libs = collections.defaultdict(int)
    for i in infos:
        m = re.fullmatch(r'lib/([^/]+)/(.+\.so)', i.filename)
        if m:
            libs[m.group(1)] += i.compress_size
    lines = [f'- APK : {mb(os.path.getsize(path))} · DEX : {len(dex)} fichier(s), {mb(sum(i.file_size for i in dex))}']
    for abi, size in sorted(libs.items()):
        lines.append(f'- lib/{abi} (compressé) : {mb(size)}')
    return lines


def parse_mapping(path: str) -> dict[str, str]:
    """Original class name -> name in the DEX (the same when a rule keeps it)."""
    classes = {}
    with open(path, encoding='utf-8') as f:
        for line in f:
            m = CLASS.match(line.rstrip('\n'))
            if m and not line.startswith('#'):
                classes[m.group(1)] = m.group(2)
    return classes


def mapping_report(path: str) -> list[str]:
    classes = parse_mapping(path)
    total = len(classes)
    if not total:
        return ['- mapping.txt sans classe']
    kept = [c for c, o in classes.items() if c == o]
    renamed = total - len(kept)
    lines = [f'- Classes : {total}, renommées par R8 : {renamed} ({100 * renamed / total:.0f} %), nom gardé : {len(kept)}']
    by_group = collections.Counter(group(c) for c in classes)
    kept_by_group = collections.Counter(group(c) for c in kept)
    lines += ['', '| Paquet | Classes | Part des classes | Nom gardé |', '|---|---:|---:|---:|']
    for name, count in kept_by_group.most_common(15):
        share = 100 * by_group[name] / total
        lines.append(f'| `{name}` | {by_group[name]} | {share:.0f} % | {count} ({100 * count / by_group[name]:.0f} %) |')
    return lines


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('dir')
    args = parser.parse_args()
    out = ['## R8 (APK release x86_64, signature de debug)']
    try:
        apks = sorted(f for f in os.listdir(args.dir) if f.endswith('.apk'))
    except OSError as e:
        apks = []
        out.append(f'- dossier illisible : {e}')
    for apk in apks:
        app = apk[:-4]
        out += ['', f'### {app}']
        try:
            out += apk_report(os.path.join(args.dir, apk))
        except (OSError, zipfile.BadZipFile) as e:
            out.append(f'- APK illisible : {e}')
        mapping = os.path.join(args.dir, 'mapping', app, 'mapping.txt')
        if os.path.exists(mapping):
            try:
                out += mapping_report(mapping)
            except (OSError, UnicodeDecodeError) as e:
                out.append(f'- mapping.txt illisible : {e}')
        elif app != 'stripe-smoke':  # same Android code and R8 run as plazo
            out.append('- mapping.txt absent')
    print('\n'.join(out))
    return 0


if __name__ == '__main__':
    sys.exit(main())
