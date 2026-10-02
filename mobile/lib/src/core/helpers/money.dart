/// Prices as the site prints them (site/src/lib/money.ts). Display only: every amount comes from
/// the API, never computed in the app.
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
