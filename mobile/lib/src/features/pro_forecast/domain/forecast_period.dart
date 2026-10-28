/// « Planning prévisionnel » (28/10/2026, direction A « Calendrier par mois »): the periods and gauges of the
/// calendar, the same rules as `admin/src/lib/forecast.ts`. Dates are YYYY-MM-DD strings, read as UTC days.
library;

enum ForecastView { week, month, quarter }

DateTime _d(String date) => DateTime.utc(int.parse(date.substring(0, 4)), int.parse(date.substring(5, 7)), int.parse(date.substring(8, 10)));
String _s(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

String addDays(String date, int n) => _s(_d(date).add(Duration(days: n)));

/// First day of the month `n` months after the one of `date`.
String addMonths(String date, int n) {
  final d = _d(date);
  return _s(DateTime.utc(d.year, d.month + n, 1));
}

/// Monday of the week of `date` (weeks run Monday → Sunday).
String mondayOf(String date) => addDays(date, -(_d(date).weekday - 1));

/// The dates read for a view around `anchor`: a week, a calendar month, or three calendar months (92 days at most).
({String from, int days}) periodOf(ForecastView view, String anchor) {
  if (view == ForecastView.week) return (from: mondayOf(anchor), days: 7);
  final from = addMonths(anchor, 0);
  final to = addMonths(from, view == ForecastView.month ? 1 : 3);
  return (from: from, days: _d(to).difference(_d(from)).inDays);
}

/// The anchor of the previous (-1) or next (+1) period.
String shiftPeriod(ForecastView view, String anchor, int step) => switch (view) {
  ForecastView.week => addDays(mondayOf(anchor), 7 * step),
  ForecastView.month => addMonths(anchor, step),
  ForecastView.quarter => addMonths(anchor, 3 * step),
};

/// The months of a period, each as weeks of seven cells (null before the 1st and after the last day).
List<({String month, List<List<String?>> weeks})> monthGrids(String from, int days) {
  final grids = <({String month, List<List<String?>> weeks})>[];
  final last = addDays(from, days - 1);
  for (var month = addMonths(from, 0); month.compareTo(last) <= 0; month = addMonths(month, 1)) {
    final end = addDays(addMonths(month, 1), -1);
    final cells = <String?>[for (var i = 0; i < _d(month).weekday - 1; i++) null];
    for (var d = month; d.compareTo(end) <= 0; d = addDays(d, 1)) {
      cells.add(d);
    }
    while (cells.length % 7 != 0) {
      cells.add(null);
    }
    grids.add((month: month, weeks: [for (var i = 0; i < cells.length; i += 7) cells.sublist(i, i + 7)]));
  }
  return grids;
}

enum GaugeLevel { low, mid, high, full }

/// Night load in percent of the real capacity, and its colour band (pale under 70 %, lime, amber above 85 %, red when full).
({int pct, GaugeLevel level}) gaugeOf({required int parked, required int bookable}) {
  final pct = bookable > 0 ? (parked * 100 / bookable).round() : (parked > 0 ? 100 : 0);
  final level = parked > 0 && parked >= bookable
      ? GaugeLevel.full
      : pct > 85
      ? GaugeLevel.high
      : pct >= 70
      ? GaugeLevel.mid
      : GaugeLevel.low;
  return (pct: pct, level: level);
}
