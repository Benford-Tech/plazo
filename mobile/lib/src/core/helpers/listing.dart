import 'package:easy_localization/easy_localization.dart';

/// Labels of a parking, as the site prints them (site/src/lib/listing.ts, fr.ts).

/// 3.5 -> "3,5"
String formatKm(double km) {
  final rounded = (km * 10).round() / 10;
  final text = rounded == rounded.roundToDouble() ? rounded.toStringAsFixed(0) : rounded.toString();
  return text.replaceAll('.', ',');
}

String serviceLabel(String service, {bool short = false}) {
  final key = '${short ? 'services_short' : 'services'}.$service';
  final text = key.tr();
  return text == key ? service : text;
}

/// "Annulation gratuite 24 h avant".
String cancellationLabel(String policy, {bool short = false}) {
  final key = '${short ? 'cancellation_short' : 'cancellation'}.$policy';
  final text = key.tr();
  return text == key ? policy : text;
}

bool isFreeCancellation(String policy) => policy != 'non_refundable';

/// "Navette 8 min · 3,5 km · Clôturé · Vidéosurveillance" (shuttle first, then the other services).
String listingFacts({int? shuttleMinutes, double? distanceKm, required List<String> services}) {
  final parts = <String>[
    if (shuttleMinutes != null && shuttleMinutes > 0) 'parking.shuttle_min'.tr(args: ['$shuttleMinutes']),
    if (distanceKm != null) 'parking.km'.tr(args: [formatKm(distanceKm)]),
    for (final s in services)
      if (s != 'shuttle') serviceLabel(s, short: true),
  ];
  return parts.join(' · ');
}
