import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/helpers/join_code.dart';

TextEditingValue _type(String text) => const JoinCodeFormatter().formatEditUpdate(
  TextEditingValue.empty,
  TextEditingValue(
    text: text,
    selection: TextSelection.collapsed(offset: text.length),
  ),
);

void main() {
  group('code du jour (variante A)', () {
    test('normalisation : majuscules, sans espaces ni tirets, O → 0, I et L → 1', () {
      expect(normalizeJoinCode('k7qm2-xp9td'), 'K7QM2XP9TD');
      expect(normalizeJoinCode(' K7QM2 XP9TD '), 'K7QM2XP9TD');
      expect(normalizeJoinCode('O0IL1-ABCDE'), '00111ABCDE');
      // Incomplete or too long: null (the API answers join_code_invalid anyway).
      expect(normalizeJoinCode('K7QM2-XP9T'), isNull);
      expect(normalizeJoinCode(''), isNull);
    });

    test('lettres hors alphabet de Crockford (U) ignorées, dix caractères au plus', () {
      expect(joinCodeChars('UK7QM2XP9TDZZ'), 'K7QM2XP9TD');
      expect(joinCodeChars('k7-qm'), 'K7QM');
    });

    test('affichage XXXXX-XXXXX : le tiret apparaît au sixième caractère', () {
      expect(formatJoinCode('K7QM2'), 'K7QM2');
      expect(formatJoinCode('K7QM2X'), 'K7QM2-X');
      expect(formatJoinCode('K7QM2XP9TD'), 'K7QM2-XP9TD');
    });

    test('le champ ajoute le tiret seul et accepte un code collé, ou le message du gérant', () {
      expect(_type('k7qm2xp9td').text, 'K7QM2-XP9TD');
      expect(_type('k7qm2 xp9td').text, 'K7QM2-XP9TD');
      final pasted = _type("Rejoignez l'équipe de Parkair Lyon sur Plazo Pro : installez l'app, puis tapez le code du jour K7QM2-XP9TD. Il change à minuit.");
      expect(pasted.text, 'K7QM2-XP9TD');
      expect(pasted.selection, const TextSelection.collapsed(offset: 11));
      // Backspace after the dash: one character goes, the dash with it.
      final back = const JoinCodeFormatter().formatEditUpdate(const TextEditingValue(text: 'K7QM2-X'), const TextEditingValue(text: 'K7QM2-'));
      expect(back.text, 'K7QM2');
    });
  });
}
