/// Prices as the site prints them (site/src/lib/money.ts). Display only: every amount comes from
/// the API, never computed in the app; the staff's typed amounts are only read back (parseEuroInput).
library;

const _nbsp = ' ';
const _narrowNbsp = ' ';

String _thousands(int n) => n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => _narrowNbsp);

/// 5500 -> "55,00 €", 123456 -> "1 234,56 €".
String formatEuros(int cents) {
  final negative = cents < 0;
  final abs = cents.abs();
  return '${negative ? '-' : ''}${_thousands(abs ~/ 100)},${(abs % 100).toString().padLeft(2, '0')}$_nbsp€';
}

/// Whole euros for filters and slider bounds: 12000 -> "120 €".
String formatWholeEuros(int cents) => '${_thousands((cents / 100).round())}$_nbsp€';

/// Short price of a map pill: whole euros when exact ("45 €"), else with cents ("34,99 €").
String formatShortEuros(int cents) => cents % 100 == 0 ? formatWholeEuros(cents) : formatEuros(cents);

/// An amount as the staff types it back in a form: 2600 -> "26,00" (no thousands separator, no sign), null -> "".
String formatEuroInput(int? cents) => cents == null ? '' : '${cents ~/ 100},${(cents % 100).toString().padLeft(2, '0')}';

/// The staff's typed amount in euro cents: "45,50", "45.50", "45", "45 €", "1 200,00" (10/10/2026, the booking's
/// price). Empty: valid, no amount. Letters, a sign, or more than two decimals: not valid.
({bool valid, int? cents}) parseEuroInput(String text) {
  final s = text.replaceAll(RegExp(r'[\s\u00a0\u202f€]'), '');
  if (s.isEmpty) return (valid: true, cents: null);
  final m = RegExp(r'^(\d+)(?:[.,](\d{1,2}))?$').firstMatch(s);
  final euros = m == null ? null : int.tryParse(m.group(1)!);
  if (euros == null || euros > 1000000000) return (valid: false, cents: null);
  return (valid: true, cents: euros * 100 + int.parse((m!.group(2) ?? '0').padRight(2, '0')));
}
