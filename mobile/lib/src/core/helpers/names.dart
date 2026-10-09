/// People's names in two parts (staff 06/10/2026, travellers 09/10/2026): the server stores the first and the last
/// name apart and rebuilds the display name "Prénom Nom" from them.
library;

import 'plate.dart';

/// A person's first and last name.
typedef NameParts = ({String firstName, String lastName});

/// Splits a display name at the first space, as the server does for older rows: "Jean de La Tour" -> Jean / de La Tour.
NameParts splitName(String? full) {
  final trimmed = (full ?? '').trim().replaceAll(RegExp(r'\s+'), ' ');
  if (trimmed.isEmpty) return (firstName: '', lastName: '');
  final space = trimmed.indexOf(' ');
  if (space < 0) return (firstName: trimmed, lastName: '');
  return (firstName: trimmed.substring(0, space), lastName: trimmed.substring(space + 1));
}

/// The stored first and last name, or the display name split when both are empty (older rows, older servers).
NameParts nameParts(String? firstName, String? lastName, String? full) {
  final first = (firstName ?? '').trim();
  final last = (lastName ?? '').trim();
  if (first.isNotEmpty || last.isNotEmpty) return (firstName: first, lastName: last);
  return splitName(full);
}

/// The first name to greet a traveller with ("C'est réservé, Camille !"): the stored one, else the first word of the
/// display name; "" for a title or an initial ("M.", "J.").
String greetingName(String? storedFirstName, String fullName) {
  final stored = (storedFirstName ?? '').trim().replaceAll(RegExp(r'\s+'), ' ');
  if (stored.isEmpty) return firstName(fullName);
  return firstName(stored).isEmpty ? '' : stored;
}
