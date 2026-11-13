import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Every language of the app (13/11/2026) has each French text, with the same placeholders.
const _plural = {'zero', 'one', 'two', 'few', 'many', 'other'};

Map<String, String> _leaves(Map<String, dynamic> node, [String path = '']) {
  final out = <String, String>{};
  node.forEach((k, v) {
    final p = path.isEmpty ? k : '$path.$k';
    if (v is Map<String, dynamic>) {
      out.addAll(_leaves(v, p));
    } else {
      out[p] = '$v';
    }
  });
  return out;
}

List<String> _placeholders(String s) => RegExp(r'\{[^}]*\}').allMatches(s).map((m) => m.group(0)!).toList()..sort();

void main() {
  final french = _leaves(jsonDecode(File('assets/l10n/fr-FR.json').readAsStringSync()) as Map<String, dynamic>);
  final files = Directory('assets/l10n').listSync().whereType<File>().where((f) => !f.path.endsWith('fr-FR.json')).toList();

  test('les huit langues sont là', () => expect(files, hasLength(8)));

  for (final file in files) {
    test('${file.uri.pathSegments.last} : mêmes clés et mêmes variables que le français', () {
      final other = _leaves(jsonDecode(file.readAsStringSync()) as Map<String, dynamic>);
      final problems = <String>[];
      french.forEach((key, value) {
        final t = other[key];
        if (t == null) {
          problems.add('missing $key');
        } else if (_placeholders(t).join() != _placeholders(value).join()) {
          problems.add('placeholders $key');
        }
      });
      for (final key in other.keys.where((k) => !french.containsKey(k))) {
        if (!_plural.contains(key.split('.').last)) problems.add('extra $key');
      }
      expect(problems, isEmpty);
    });
  }
}
