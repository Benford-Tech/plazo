/// Plates, as the site formats them (site/src/lib/plate.ts).
library;

/// Letters and digits only, upper-case: "gk 318 px" -> "GK318PX".
String plateKey(String plate) => plate.toUpperCase().replaceAll(RegExp('[^A-Z0-9]'), '');

/// French plates (SIV) get their dashes, "gk318px" -> "GK-318-PX"; foreign plates stay as typed, upper-cased.
String formatPlate(String plate) {
  final key = plateKey(plate);
  if (RegExp(r'^[A-Z]{2}\d{3}[A-Z]{2}$').hasMatch(key)) return '${key.substring(0, 2)}-${key.substring(2, 5)}-${key.substring(5)}';
  return plate.trim().toUpperCase().replaceAll(RegExp(r'\s+'), ' ');
}

/// A French SIV plate ("AB-123-CD"), for the hint under the field.
bool isFrenchPlate(String plate) => RegExp(r'^[A-Z]{2}\d{3}[A-Z]{2}$').hasMatch(plateKey(plate));

/// Display form of a phone number: "0612345678" -> "06 12 34 56 78".
String formatPhone(String phone) {
  final compact = phone.replaceAll(RegExp(r'[\s.()-]'), '');
  if (RegExp(r'^0\d{9}$').hasMatch(compact)) return compact.replaceAllMapped(RegExp(r'(\d{2})(?=\d)'), (m) => '${m[1]} ');
  if (RegExp(r'^\+33\d{9}$').hasMatch(compact)) {
    return '+33 ${compact.substring(3, 4)} ${compact.substring(4).replaceAllMapped(RegExp(r'(\d{2})(?=\d)'), (m) => '${m[1]} ')}';
  }
  return phone.trim();
}

/// First name for a greeting: "Camille Laurent" -> "Camille"; "" for a title or an initial.
String firstName(String fullName) {
  final first = fullName.trim().split(RegExp(r'\s+')).first;
  return RegExp(r'^(m|mr|mme|mlle|mrs|ms|dr|pr|me)\.?$|\.$', caseSensitive: false).hasMatch(first) ? '' : first;
}

/// Whether the API sends the confirmation SMS to this number (French mobiles 06 / 07 only).
bool isFrenchMobile(String phone) {
  var digits = phone.replaceAll('(0)', '').replaceAll(RegExp(r'[\s.()-]'), '');
  if (digits.startsWith('00')) digits = '+${digits.substring(2)}';
  if (digits.startsWith('+33')) digits = '0${digits.substring(3).replaceFirst(RegExp('^0'), '')}';
  return RegExp(r'^0[67]\d{8}$').hasMatch(digits);
}
