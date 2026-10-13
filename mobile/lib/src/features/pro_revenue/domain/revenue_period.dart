import 'package:intl/intl.dart';

/// The page's three periods (P-B, 13/10/2026): a day, a week (Monday to Sunday) or a calendar month.
enum RevenueSpan { day, week, month }

/// Local dates only (YYYY-MM-DD, the parking's calendar): computed at noon UTC, never shifted by a time zone.
DateTime parseDay(String iso) => DateTime.utc(int.parse(iso.substring(0, 4)), int.parse(iso.substring(5, 7)), int.parse(iso.substring(8, 10)), 12);

String formatDay(DateTime day) => '${day.year.toString().padLeft(4, '0')}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';

String addDays(String iso, int days) => formatDay(parseDay(iso).add(Duration(days: days)));

/// The first and last local dates of the period around [anchor].
({String from, String to}) revenuePeriod(RevenueSpan span, String anchor) {
  final a = parseDay(anchor);
  switch (span) {
    case RevenueSpan.day:
      return (from: anchor, to: anchor);
    case RevenueSpan.week:
      final monday = addDays(anchor, 1 - a.weekday);
      return (from: monday, to: addDays(monday, 6));
    case RevenueSpan.month:
      return (from: formatDay(DateTime.utc(a.year, a.month, 1, 12)), to: formatDay(DateTime.utc(a.year, a.month + 1, 0, 12)));
  }
}

/// The anchor of the period [delta] periods away (‹ and ›).
String stepAnchor(RevenueSpan span, String anchor, int delta) {
  final a = parseDay(anchor);
  return switch (span) {
    RevenueSpan.day => addDays(anchor, delta),
    RevenueSpan.week => addDays(anchor, 7 * delta),
    RevenueSpan.month => formatDay(DateTime.utc(a.year, a.month + delta, 1, 12)),
  };
}

/// Switching between day, week and month: today when the shown period holds it, else the period's first day.
String anchorForSpan({required RevenueSpan from, required String anchor, required String today}) {
  final p = revenuePeriod(from, anchor);
  return today.compareTo(p.from) >= 0 && today.compareTo(p.to) <= 0 ? today : p.from;
}

bool holds(({String from, String to}) period, String day) => day.compareTo(period.from) >= 0 && day.compareTo(period.to) <= 0;

String _capitalised(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

/// The period's name under the switch: « Aujourd'hui », « Hier », « Lundi 6 octobre », « Cette semaine »,
/// « Du 29 sept. au 5 oct. », « Octobre 2026 ». The year is said when it is not today's.
/// The words come from the translations (`revenue.period.*`); [range] builds « Du … au … ».
String periodLabel(
  RevenueSpan span,
  String anchor,
  String today, {
  required String todayWord,
  required String yesterdayWord,
  required String thisWeekWord,
  required String Function(String first, String last) range,
}) {
  final a = parseDay(anchor);
  final year = a.year == parseDay(today).year ? '' : ' ${a.year}';
  switch (span) {
    case RevenueSpan.day:
      if (anchor == today) return todayWord;
      if (anchor == addDays(today, -1)) return yesterdayWord;
      return _capitalised(DateFormat('EEEE d MMMM', 'fr_FR').format(a)) + year;
    case RevenueSpan.week:
      final p = revenuePeriod(span, anchor);
      if (holds(p, today)) return thisWeekWord;
      final first = parseDay(p.from);
      final last = parseDay(p.to);
      final lastYear = last.year == parseDay(today).year ? '' : ' ${last.year}';
      return first.month == last.month
          ? range('${first.day}', '${DateFormat('d MMMM', 'fr_FR').format(last)}$lastYear')
          : range(DateFormat('d MMM', 'fr_FR').format(first), '${DateFormat('d MMM', 'fr_FR').format(last)}$lastYear');
    case RevenueSpan.month:
      return _capitalised(DateFormat('MMMM y', 'fr_FR').format(a));
  }
}
