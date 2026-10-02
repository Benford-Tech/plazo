/// Stay dates, with the same rules as the site (site/src/lib/dates.ts, calendar.ts) and the API.
///
/// Dates exchanged with the API are wall-clock times at the parking ("2026-10-04T06:30",
/// Europe/Paris for the MVP). French labels are built by hand, like the site's, so that both print
/// exactly the same strings. Prices are never computed here: the API gives them.
library;

const _weekdays = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const _months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const _weekdayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const _monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/// Longest stay the API accepts.
const maxStayDays = 90;

final _localRe = RegExp(r'^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$');
final _dateRe = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$');

String _pad(int n) => n.toString().padLeft(2, '0');

DateTime _utcDate(String date) {
  final m = _dateRe.firstMatch(date)!;
  return DateTime.utc(int.parse(m[1]!), int.parse(m[2]!), int.parse(m[3]!));
}

String _dateOf(DateTime utc) => '${utc.year}-${_pad(utc.month)}-${_pad(utc.day)}';

bool isValidDate(String date) {
  final m = _dateRe.firstMatch(date);
  if (m == null) return false;
  final y = int.parse(m[1]!), mo = int.parse(m[2]!), d = int.parse(m[3]!);
  final utc = DateTime.utc(y, mo, d);
  return utc.year == y && utc.month == mo && utc.day == d;
}

bool isValidTime(String time) {
  final m = RegExp(r'^(\d{2}):(\d{2})$').firstMatch(time);
  return m != null && int.parse(m[1]!) < 24 && int.parse(m[2]!) < 60;
}

/// "2026-10-04T06:30" -> (date, time), or null when it is not a real local datetime.
({String date, String time})? parseLocal(String? value) {
  if (value == null || !_localRe.hasMatch(value)) return null;
  final date = value.substring(0, 10);
  final time = value.substring(11);
  return isValidDate(date) && isValidTime(time) ? (date: date, time: time) : null;
}

String addDays(String date, int days) => _dateOf(_utcDate(date).add(Duration(days: days)));

/// Last Sunday of a month (UTC date).
DateTime _lastSunday(int year, int month) {
  final last = DateTime.utc(year, month + 1, 0);
  return last.subtract(Duration(days: last.weekday % 7));
}

/// Europe/Paris offset of an instant: CEST (+2) from the last Sunday of March 01:00 UTC to the
/// last Sunday of October 01:00 UTC, CET (+1) otherwise (EU rule).
Duration parisOffset(DateTime instant) {
  final utc = instant.toUtc();
  final start = _lastSunday(utc.year, 3).add(const Duration(hours: 1));
  final end = _lastSunday(utc.year, 10).add(const Duration(hours: 1));
  return utc.isBefore(start) || !utc.isBefore(end) ? const Duration(hours: 1) : const Duration(hours: 2);
}

/// Wall-clock time of an instant at the parking, "YYYY-MM-DDTHH:mm".
String fromInstant(DateTime instant) {
  final local = instant.toUtc().add(parisOffset(instant));
  return '${_dateOf(local)}T${_pad(local.hour)}:${_pad(local.minute)}';
}

/// Instant of a local wall-clock time at the parking (DST transitions included), or null.
DateTime? toInstant(String local) {
  final parsed = parseLocal(local);
  if (parsed == null) return null;
  final m = _localRe.firstMatch(local)!;
  final naive = DateTime.utc(int.parse(m[1]!), int.parse(m[2]!), int.parse(m[3]!), int.parse(m[4]!), int.parse(m[5]!));
  var utc = naive.subtract(parisOffset(naive));
  utc = naive.subtract(parisOffset(utc));
  return utc;
}

/// Today's date at the parking, "YYYY-MM-DD".
String todayLocal(DateTime now) => fromInstant(now).substring(0, 10);

/// Dates suggested in an empty search: tomorrow 08:00 to a week later 18:00 (as the site).
({String arrival, String returnAt}) defaultStay(DateTime now) {
  final tomorrow = addDays(todayLocal(now), 1);
  return (arrival: '${tomorrow}T08:00', returnAt: '${addDays(tomorrow, 7)}T18:00');
}

/// "2026-10-04" -> "dim. 4 oct."
String formatDay(String date) {
  final d = _utcDate(date);
  return '${_weekdays[d.weekday % 7]} ${d.day} ${_months[d.month - 1]}';
}

/// "2026-10-10" -> "samedi 10 octobre 2026" (spoken labels of the calendar's days).
String formatDayLong(String date) {
  final d = _utcDate(date);
  return '${_weekdayNames[d.weekday % 7]} ${d.day} ${_monthNames[d.month - 1]} ${d.year}';
}

/// "octobre 2026" (title of a calendar month).
String monthTitle(int year, int month) => '${_monthNames[month - 1]} $year';

/// Short dates of a stay for the single "Vos dates" pill: the return drops its month when it is
/// the drop-off's ("sam. 3 oct." → "sam. 10"), and shows its year when that differs.
({String start, String end}) formatStayDates(String start, String end) {
  final a = _utcDate(start), b = _utcDate(end);
  final sameYear = a.year == b.year;
  if (sameYear && a.month == b.month) return (start: formatDay(start), end: '${_weekdays[b.weekday % 7]} ${b.day}');
  return (start: formatDay(start), end: sameYear ? formatDay(end) : '${formatDay(end)} ${b.year}');
}

/// "3 → 10 oct." (results header, booking bar).
String shortRange(String start, String end) {
  final a = _utcDate(start), b = _utcDate(end);
  if (a.year == b.year && a.month == b.month) return '${a.day} → ${b.day} ${_months[b.month - 1]}';
  return '${a.day} ${_months[a.month - 1]} → ${b.day} ${_months[b.month - 1]}';
}

/// "2026-10-04T06:30" -> "dim. 4 oct. · 06:30"
String formatDateTime(String local) {
  final p = parseLocal(local);
  return p == null ? local : '${formatDay(p.date)} · ${p.time}';
}

/// "2026-10-03T06:30" -> "sam. 3 oct. à 06:30"
String formatDateTimeAt(String local) {
  final p = parseLocal(local);
  return p == null ? local : '${formatDay(p.date)} à ${p.time}';
}

/// Billable days of a stay, as the API counts them: every local calendar day touched.
int stayDays(String arrival, String returnAt) {
  final first = arrival.substring(0, 10);
  final last = returnAt.substring(0, 10);
  var days = 1;
  for (var d = first; d.compareTo(last) < 0; d = addDays(d, 1)) {
    days += 1;
  }
  return days;
}

/// "1 jour", "8 jours".
String daysLabel(int days) => '$days jour${days > 1 ? 's' : ''}';

/// Half-hour slots of the time pickers: 05:00 to 23:30 (as the site).
final List<String> timeSlots = List.generate((24 - 5) * 2, (i) {
  final minutes = 5 * 60 + i * 30;
  return '${_pad(minutes ~/ 60)}:${minutes % 60 == 0 ? '00' : '30'}';
});

/// The slots, plus the current time when it is not one of them (e.g. 15:05 from a shared link).
List<String> timeOptions(String? current) {
  if (current == null || !isValidTime(current) || timeSlots.contains(current)) return timeSlots;
  return [...timeSlots, current]..sort();
}

/// Same checks as the API, so that obviously wrong dates never reach it. Empty map when valid;
/// values are API codes ("return_before_arrival"…), translated by errors.<code>.
Map<String, String> validateStay(String? arrival, String? returnAt, DateTime now) {
  final errors = <String, String>{};
  if (arrival == null || arrival.isEmpty) {
    errors['arrivalAt'] = 'required';
  } else if (parseLocal(arrival) == null) {
    errors['arrivalAt'] = 'invalid_datetime';
  }
  if (returnAt == null || returnAt.isEmpty) {
    errors['returnAt'] = 'required';
  } else if (parseLocal(returnAt) == null) {
    errors['returnAt'] = 'invalid_datetime';
  }
  if (errors.isNotEmpty) return errors;
  final a = toInstant(arrival!)!, r = toInstant(returnAt!)!;
  if (!r.isAfter(a)) {
    errors['returnAt'] = 'return_before_arrival';
  } else if (returnAt.compareTo('${addDays(arrival.substring(0, 10), maxStayDays)}${arrival.substring(10)}') > 0) {
    errors['returnAt'] = 'stay_too_long';
  }
  // The API tolerates one hour in the past (a traveller booking at the gate).
  if (a.isBefore(now.subtract(const Duration(hours: 1)))) errors['arrivalAt'] = 'arrival_in_past';
  return errors;
}

/// Which end of the range the next tap on a day sets.
enum RangeSide { start, end }

/// A range being picked in the date sheet.
class RangeDraft {
  const RangeDraft({this.start, this.end, this.picking = RangeSide.start});
  final String? start;
  final String? end;
  final RangeSide picking;

  RangeDraft copyWith({String? start, String? end, RangeSide? picking, bool clearEnd = false}) =>
      RangeDraft(start: start ?? this.start, end: clearEnd ? null : (end ?? this.end), picking: picking ?? this.picking);

  @override
  bool operator ==(Object other) => other is RangeDraft && other.start == start && other.end == end && other.picking == picking;

  @override
  int get hashCode => Object.hash(start, end, picking);
}

/// Applies a tap on a day (site's pickDay): picking the drop-off keeps the return when it still
/// comes after it, then asks for the return; a return before the drop-off becomes the new drop-off.
/// Days before today at the parking ([minDate]) cannot be picked.
RangeDraft pickDay(RangeDraft draft, String day, String minDate) {
  if (day.compareTo(minDate) < 0) return draft;
  final start = draft.start;
  if (draft.picking == RangeSide.start || start == null) {
    final end = draft.end;
    return RangeDraft(start: day, end: end != null && end.compareTo(day) >= 0 ? end : null, picking: RangeSide.end);
  }
  if (day.compareTo(start) < 0) return RangeDraft(start: day, picking: RangeSide.end);
  return RangeDraft(start: start, end: day, picking: RangeSide.start);
}

/// Billable days of a picked range (null until both ends are set).
int? rangeDays(String? start, String? end) =>
    start != null && end != null && end.compareTo(start) >= 0 ? stayDays('${start}T00:00', '${end}T00:00') : null;

/// Weeks of a month (Monday first), days as "YYYY-MM-DD" or null outside the month.
List<List<String?>> monthWeeks(int year, int month) {
  final first = DateTime.utc(year, month, 1);
  final count = DateTime.utc(year, month + 1, 0).day;
  final lead = (first.weekday + 6) % 7;
  final cells = <String?>[...List.filled(lead, null), for (var d = 1; d <= count; d++) '$year-${_pad(month)}-${_pad(d)}'];
  while (cells.length % 7 != 0) {
    cells.add(null);
  }
  return [for (var i = 0; i < cells.length; i += 7) cells.sublist(i, i + 7)];
}
