import 'package:easy_localization/easy_localization.dart';

/// "06:30" from an instant, in the phone's time zone (the parking's for the MVP: Europe/Paris).
String hhmm(DateTime instant) => DateFormat('HH:mm', 'fr_FR').format(instant.toLocal());

/// "06:30" from a parking-local date-time of the public API ("2026-10-04T06:30").
String localTime(String parkingLocal) => parkingLocal.length >= 16 ? parkingLocal.substring(11, 16) : parkingLocal;

/// "sam. 4 oct." from a parking-local date-time ("2026-10-04T06:30").
String localDay(String parkingLocal) {
  final date = DateTime.tryParse(parkingLocal.substring(0, 10));
  return date == null ? parkingLocal : DateFormat('EEE d MMM', 'fr_FR').format(date);
}

/// "SAM. 3 OCT." for the staff's planning header.
String planningDay(DateTime day) => DateFormat('EEE d MMM', 'fr_FR').format(day).toUpperCase();

/// "2026-10-04": a day as the API's planning takes it.
String isoDay(DateTime day) => DateFormat('yyyy-MM-dd').format(day);

/// "8,4 km" / "320 m".
String distanceLabel(int meters) => meters < 1000
    ? 'arrival.distance_m'.tr(args: ['$meters'])
    : 'arrival.distance_km'.tr(args: [(meters / 1000).toStringAsFixed(1).replaceAll('.', ',')]);

/// "1 h 52" / "12 min".
String durationLabel(Duration d) {
  final minutes = (d.inSeconds / 60).ceil();
  if (minutes >= 60) return 'arrival.hours_minutes'.tr(args: ['${minutes ~/ 60}', (minutes % 60).toString().padLeft(2, '0')]);
  return 'arrival.minutes_only'.tr(args: ['$minutes']);
}

/// "Camille Martin" -> "C. Martin" (banners stay short).
String shortName(String fullName) {
  final parts = fullName.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.length < 2) return parts.firstOrNull ?? '';
  return '${parts.first[0].toUpperCase()}. ${parts.skip(1).join(' ')}';
}
