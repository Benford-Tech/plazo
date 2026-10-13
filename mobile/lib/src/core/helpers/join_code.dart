/// « Code du jour » of a parking (13/10/2026): ten characters of Crockford's base 32 (digits and letters, without I,
/// L, O and U), shown as two groups of five, `K7QM2-XP9TD`. Mirrors backend/src/domain/join-code.ts: the typed text
/// is upper-cased, spaces and dashes are dropped, O is read as 0, I and L as 1. The server stays the judge.
library;

import 'package:flutter/services.dart';

const joinCodeAlphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const joinCodeLength = 10;

/// A code in a longer text (the manager's « message prêt à envoyer » pasted whole): its dashed form only.
final _codeInText = RegExp(r'(?<![0-9A-Za-z])([0-9A-Za-z]{5})-([0-9A-Za-z]{5})(?![0-9A-Za-z])');

/// What a typed (or pasted) code may hold besides its characters: spaces and dashes.
final _typedCode = RegExp(r'^[0-9A-Za-z\s-]*$');

final _letterOrDigit = RegExp(r'^[0-9A-Z]$');

String _mapChar(String c) => switch (c) {
  'O' => '0',
  'I' || 'L' => '1',
  _ => c,
};

/// Upper-cased letters and digits of `input`, O read as 0, I and L as 1; spaces, dashes and the rest dropped.
String _letters(String input) {
  final out = StringBuffer();
  for (final rune in input.toUpperCase().runes) {
    final c = _mapChar(String.fromCharCode(rune));
    if (_letterOrDigit.hasMatch(c)) out.write(c);
  }
  return out.toString();
}

bool _inAlphabet(String chars) => chars.split('').every(joinCodeAlphabet.contains);

/// The code's characters in `input`, normalised, at most ten. A long text (the manager's message) gives its LAST
/// dashed code made of the alphabet only (a parking name such as « Rhone-Alpes » comes before it), or nothing.
/// A letter outside the alphabet (U) is kept, so the code reads as wrong instead of shifting silently.
String joinCodeChars(String input) {
  final chars = _letters(input);
  if (input.length > 12 && (chars.length > joinCodeLength || !_typedCode.hasMatch(input))) {
    final codes = _codeInText.allMatches(input).map((m) => _letters('${m.group(1)}${m.group(2)}')).where(_inAlphabet).toList();
    return codes.isEmpty ? '' : codes.last;
  }
  return chars.length > joinCodeLength ? chars.substring(0, joinCodeLength) : chars;
}

/// The code as the API takes it, or null unless `input` holds exactly ten characters of the alphabet.
String? normalizeJoinCode(String input) {
  final chars = joinCodeChars(input);
  return chars.length == joinCodeLength && _inAlphabet(chars) ? chars : null;
}

/// Ten characters, one of them outside the alphabet (U): a misread code, said before any try counts.
bool hasForeignJoinCodeLetter(String input) {
  final chars = joinCodeChars(input);
  return chars.length == joinCodeLength && !_inAlphabet(chars);
}

/// `K7QM2XP9TD` → `K7QM2-XP9TD`; a partial code gets its dash once a sixth character follows the first group.
String formatJoinCode(String chars) => chars.length <= 5 ? chars : '${chars.substring(0, 5)}-${chars.substring(5)}';

/// Variant A of the code field (13/10/2026): one field, the dash added by itself, a pasted code (or message) accepted.
class JoinCodeFormatter extends TextInputFormatter {
  const JoinCodeFormatter();

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    // The dash only shows once a sixth character follows it: a backspace never gets stuck on it.
    final chars = joinCodeChars(newValue.text);
    // A pasted text without a code leaves the field as it was.
    if (chars.isEmpty && newValue.text.length > 12) return oldValue;
    final text = formatJoinCode(chars);
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
