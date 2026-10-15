#!/usr/bin/env python3
"""Finds a node of the emulator's current screen and taps it, for e2e.sh (Android emulator workflow).

Flutter exposes its semantics tree to uiautomator: a widget's label is in the node's `text` or `content-desc`
(a bottom tab reads « Mes réservations\\nOnglet 2 sur 3 »), a text field is an `android.widget.EditText`. The tree
appears once an accessibility client asks for it, so the first dumps after a launch may hold no Flutter node: the
command keeps dumping until its timeout. A dump needs a quiet screen: when none can be read (« could not get idle
state », a live countdown redrawing every second), the command exits 2 and e2e.sh opens the screen by its route.

  ui.py tap REGEX [--last] [--timeout S]   tap the first node whose text or description matches REGEX
                                           (--last: the lowest one on screen, e.g. a bottom tab)
  ui.py has REGEX [--timeout S]            exit 0 when a node matches
  ui.py field N [--timeout S]              tap the N-th text field from the top (1 = first)

Exit codes: 0 done, 1 not found before the timeout, 2 no dump could be read.
"""
import argparse
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

DUMP = '/sdcard/plazo-ui.xml'


def adb(*args: str) -> str:
    """The command's standard output, '' when adb is missing, fails to answer or times out."""
    try:
        return subprocess.run(['adb', *args], capture_output=True, text=True, timeout=60).stdout
    except (OSError, subprocess.TimeoutExpired):
        return ''


def dump():
    """The current screen as an XML tree, or None (uiautomator waits up to about 10 s for an idle screen)."""
    if 'dumped to' not in adb('shell', 'uiautomator', 'dump', DUMP):
        return None
    try:
        return ET.fromstring(adb('exec-out', 'cat', DUMP))
    except ET.ParseError:
        return None


def bounds(node):
    x1, y1, x2, y2 = (int(v) for v in re.findall(r'-?\d+', node.get('bounds', '[0,0][0,0]')))
    return x1, y1, x2, y2


def matches(node, pattern) -> bool:
    return any(pattern.search(node.get(attr) or '') for attr in ('text', 'content-desc'))


def tap(node) -> None:
    x1, y1, x2, y2 = bounds(node)
    adb('shell', 'input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['tap', 'has', 'field'])
    parser.add_argument('target')
    parser.add_argument('--last', action='store_true')
    parser.add_argument('--timeout', type=float, default=20)
    args = parser.parse_args()
    pattern = re.compile(args.target) if args.command != 'field' else None
    index = int(args.target) - 1 if args.command == 'field' else 0

    deadline = time.time() + args.timeout
    read_once = False
    while time.time() < deadline:
        root = dump()
        if root is not None:
            read_once = True
            nodes = [n for n in root.iter('node') if bounds(n)[3] > bounds(n)[1]]
            if pattern is None:
                fields = sorted((n for n in nodes if n.get('class') == 'android.widget.EditText'), key=lambda n: bounds(n)[1])
                if 0 <= index < len(fields):
                    tap(fields[index])
                    return 0
            else:
                found = [n for n in nodes if matches(n, pattern)]
                if found:
                    if args.command == 'tap':
                        tap(max(found, key=lambda n: bounds(n)[3]) if args.last else found[0])
                    return 0
        time.sleep(1)
    return 1 if read_once else 2


if __name__ == '__main__':
    sys.exit(main())
