/// What reassures a traveller at a glance: the price per day, the badges of the results ("Le moins
/// cher", "Navette la plus rapide"), the fact chips of a card and the trust tiles of a parking
/// page. Same rules as the site (site/src/lib/highlights.ts).
library;

import 'package:easy_localization/easy_localization.dart';

import '../../features/search/data/models/public_models.dart';
import 'listing.dart';
import 'money.dart';

/// Total ÷ billable days, rounded to the cent: 4500 for 8 days -> 563.
int pricePerDayCents(int totalCents, int days) => days <= 0 ? totalCents : (totalCents / days).round();

/// "5,63 €/jour"
String perDayLabel(int totalCents, int days) => 'highlights.per_day'.tr(args: [formatEuros(pricePerDayCents(totalCents, days))]);

enum ResultBadge { cheapest, fastestShuttle }

/// Badges of the displayed results, by slug: the lowest total (ties: first) and the shortest
/// shuttle ride (ties: first), among the bookable results. Nothing when there is only one to compare.
Map<String, List<ResultBadge>> resultBadges(List<SearchResultModel> results) {
  final badges = <String, List<ResultBadge>>{};
  final bookable = results.where((r) => r.bookable).toList();
  if (bookable.length < 2) return badges;
  void add(String slug, ResultBadge badge) => (badges[slug] ??= []).add(badge);
  add(bookable.reduce((a, b) => b.priceCents! < a.priceCents! ? b : a).slug, ResultBadge.cheapest);
  final withShuttle = bookable.where((r) => r.services.contains('shuttle') && (r.shuttleMinutes ?? 0) > 0).toList();
  if (withShuttle.isNotEmpty) {
    add(withShuttle.reduce((a, b) => b.shuttleMinutes! < a.shuttleMinutes! ? b : a).slug, ResultBadge.fastestShuttle);
  }
  for (final list in badges.values) {
    list.sort((a, b) => a.index.compareTo(b.index));
  }
  return badges;
}

String badgeLabel(ResultBadge badge) => switch (badge) {
  ResultBadge.cheapest => 'results.cheapest'.tr(),
  ResultBadge.fastestShuttle => 'results.fastest_shuttle'.tr(),
};

enum ChipIcon { shuttle, fenced, covered, ev, valet, cancel, warning }

class FactChip {
  const FactChip(this.icon, this.label, {this.title});

  final ChipIcon icon;
  final String label;

  /// Longer wording for assistive technology, when the label is terse.
  final String? title;

  @override
  bool operator ==(Object other) => other is FactChip && other.icon == icon && other.label == label && other.title == title;

  @override
  int get hashCode => Object.hash(icon, label, title);

  @override
  String toString() => '$icon:$label';
}

/// Chips of a result card: shuttle minutes, fenced, covered, EV charging, valet, then cancellation.
List<FactChip> factChips({required List<String> services, required int? shuttleMinutes, required String cancellationPolicy}) {
  bool has(String s) => services.contains(s);
  final chips = <FactChip>[];
  if (has('shuttle') && shuttleMinutes != null && shuttleMinutes > 0) {
    chips.add(FactChip(ChipIcon.shuttle, 'highlights.shuttle_chip'.tr(args: ['$shuttleMinutes']), title: 'parking.shuttle_min'.tr(args: ['$shuttleMinutes'])));
  }
  if (has('fenced')) chips.add(FactChip(ChipIcon.fenced, serviceLabel('fenced', short: true)));
  if (has('covered')) chips.add(FactChip(ChipIcon.covered, serviceLabel('covered', short: true)));
  if (has('ev_charging')) chips.add(FactChip(ChipIcon.ev, 'highlights.ev_chip'.tr(), title: serviceLabel('ev_charging')));
  if (has('valet')) chips.add(FactChip(ChipIcon.valet, serviceLabel('valet', short: true)));
  final key = 'highlights.cancel_chip.$cancellationPolicy';
  final label = key.tr();
  if (label != key) {
    chips.add(FactChip(cancellationPolicy == 'non_refundable' ? ChipIcon.warning : ChipIcon.cancel, label, title: cancellationLabel(cancellationPolicy)));
  }
  return chips;
}

enum TileKind { shuttle, security, cancellation, keys }

class TrustTile {
  const TrustTile(this.kind, this.title, this.text);

  final TileKind kind;
  final String title;
  final String text;

  @override
  bool operator ==(Object other) => other is TrustTile && other.kind == kind && other.title == title && other.text == text;

  @override
  int get hashCode => Object.hash(kind, title, text);

  @override
  String toString() => '$kind:$title:$text';
}

/// The trust band of a parking page, in this order: shuttle, security, cancellation, keys. A tile
/// without data (no shuttle time, no security service) is left out.
List<TrustTile> trustTiles({
  required List<String> services,
  required int? shuttleMinutes,
  required String? openingHours,
  required String cancellationPolicy,
}) {
  bool has(String s) => services.contains(s);
  String t(String key, {List<String>? args}) => 'highlights.tiles.$key'.tr(args: args);
  final tiles = <TrustTile>[];
  if (has('shuttle') && shuttleMinutes != null && shuttleMinutes > 0) {
    final hours = openingHours ?? (has('open_24h') ? serviceLabel('open_24h', short: true) : null);
    tiles.add(TrustTile(TileKind.shuttle, t('shuttle', args: ['$shuttleMinutes']), hours != null ? t('shuttle_hours', args: [hours]) : t('shuttle_free')));
  }
  final security = [if (has('fenced')) t('fenced'), if (has('cctv')) t('cctv')];
  if (security.isNotEmpty) tiles.add(TrustTile(TileKind.security, t('secured'), security.join(', ')));
  if (cancellationPolicy == 'non_refundable') {
    tiles.add(TrustTile(TileKind.cancellation, t('non_refundable'), t('non_refundable_text')));
  } else {
    final key = 'highlights.tiles.cancellation_text.$cancellationPolicy';
    final text = key.tr();
    if (text != key) tiles.add(TrustTile(TileKind.cancellation, t('free_cancellation'), text));
  }
  tiles.add(has('valet') ? TrustTile(TileKind.keys, t('valet'), t('valet_text')) : TrustTile(TileKind.keys, t('self_park'), t('self_park_text')));
  return tiles.take(4).toList();
}

/// "À 4,2 km des terminaux · Extérieur · Recharge électrique"
String factsLine({required List<String> services, required double? distanceKm}) {
  bool has(String s) => services.contains(s);
  return [
    if (distanceKm != null) 'highlights.km_from_terminals'.tr(args: [formatKm(distanceKm)]),
    has('covered') ? serviceLabel('covered', short: true) : 'highlights.outdoor'.tr(),
    if (has('ev_charging')) serviceLabel('ev_charging'),
  ].join(' · ');
}
