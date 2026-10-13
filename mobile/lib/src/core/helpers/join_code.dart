/// « Code du jour » of a parking (13/10/2026): ten characters of Crockford's base 32 (digits and letters, without I,
/// L, O and U), shown as two groups of five, `K7QM2-XP9TD`. Mirrors backend/src/domain/join-code.ts: the typed text
/// is upper-cased, spaces and dashes are dropped, O is read as 0, I and L as 1. The server stays the judge.
library;

import 'package:flutter/services.dart';

const joinCodeAlphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const joinCodeLength = 10;

/// A code in a longer text (the manager's « message prêt à envoyer » pasted whole): its dashed form only.
final _codeInText = RegExp(r'(?<![0-9A-Za-z])([0-9A-Za-z]{5})-([0-9A-Za-z]{5})(?![0-9A-Za-z])');

String _mapChar(String c) => switch (c) {
  'O' => '0',
  'I' || 'L' => '1',
  _ => c,
};

/// The code's characters in `input`, normalised, at most ten (anything outside the alphabet is dropped).
String joinCodeChars(String input) {
  var source = input;
  if (input.length > 12) {
    final match = _codeInText.firstMatch(input);
    if (match != null) source = '${match.group(1)}${match.group(2)}';
  }
  final out = StringBuffer();
  for (final rune in source.toUpperCase().runes) {
    final c = _mapChar(String.fromCharCode(rune));
    if (joinCodeAlphabet.contains(c)) out.write(c);
    if (out.length == joinCodeLength) break;
  }
  return out.toString();
}

/// The code as the API takes it, or null unless `input` holds exactly ten characters of the alphabet.
String? normalizeJoinCode(String input) {
  final chars = joinCodeChars(input);
  return chars.length == joinCodeLength ? chars : null;
}

/// `K7QM2XP9TD` → `K7QM2-XP9TD`; a partial code gets its dash once a sixth character follows the first group.
String formatJoinCode(String chars) => chars.length <= 5 ? chars : '${chars.substring(0, 5)}-${chars.substring(5)}';

/// Variant A of the code field (13/10/2026): one field, the dash added by itself, a pasted code (or message) accepted.
class JoinCodeFormatter extends TextInputFormatter {
  const JoinCodeFormatter();

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    // The dash only shows once a sixth character follows it: a backspace never gets stuck on it.
    final text = formatJoinCode(joinCodeChars(newValue.text));
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
