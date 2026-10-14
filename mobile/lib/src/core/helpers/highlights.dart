/// What reassures a traveller at a glance: the price per day, the badges of the results ("Le moins
/// cher", "Navette la plus rapide"), the shuttle box and the fact chips of a card and the trust tiles
/// of a parking page. Same rules as the site (site/src/lib/highlights.ts).
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

enum ChipIcon { shuttle, outdoor, covered, keys, open24h, fenced, ev, cancel, warning }

class FactChip {
  const FactChip(this.icon, this.label, {this.short, this.title});

  final ChipIcon icon;
  final String label;

  /// Wording of a narrow card (phones), when the label is long (« Clés à remettre »).
  final String? short;

  /// Longer wording for assistive technology, when the label is terse.
  final String? title;

  @override
  bool operator ==(Object other) => other is FactChip && other.icon == icon && other.label == label && other.short == short && other.title == title;

  @override
  int get hashCode => Object.hash(icon, label, short, title);

  @override
  String toString() => short == null ? '$icon:$label' : '$icon:$label|$short';
}

/// Opening hours that only say « 24h/24 » (or « 24/7 »): the same tag as the service.
final _roundTheClock = RegExp(r'^(ouvert\s+)?24\s*h?\s*/\s*(24|7)\s*h?$', caseSensitive: false);

/// « Ouvert 24h/24 » (service, or hours that say so), else the hours typed (« 6h–23h »); null without either.
({bool open24h, String? hours})? _opening(List<String> services, String? openingHours) {
  final hours = openingHours?.trim();
  final typed = hours == null || hours.isEmpty ? null : hours;
  if (services.contains('open_24h') || (typed != null && _roundTheClock.hasMatch(typed))) return (open24h: true, hours: null);
  if (typed == null) return null;
  // Hours typed as a sentence (« Ouvert de 5h à 23h ») are not prefixed twice.
  return (open24h: false, hours: typed.replaceFirst(RegExp(r'^ouvert\s+', caseSensitive: false), ''));
}

/// Tags of a card (14/10/2026, direction C; the shuttle has its own box, [shuttleBox]): outdoor or covered, the keys
/// (handed to a valet or kept), the opening, then fenced, EV charging and the cancellation terms last.
List<FactChip> factChips({required List<String> services, required String? openingHours, required String cancellationPolicy}) {
  bool has(String s) => services.contains(s);
  String c(String key, {List<String>? args}) => 'highlights.chips.$key'.tr(args: args);
  final chips = <FactChip>[
    has('covered') ? FactChip(ChipIcon.covered, c('covered')) : FactChip(ChipIcon.outdoor, c('outdoor')),
    has('valet')
        ? FactChip(ChipIcon.keys, c('keys_valet'), short: c('keys_valet_short'))
        : FactChip(ChipIcon.keys, c('keys_self'), short: c('keys_self_short')),
  ];
  final open = _opening(services, openingHours);
  if (open != null && open.open24h) chips.add(FactChip(ChipIcon.open24h, c('open_24h'), short: c('open_24h_short')));
  if (open != null && open.hours != null) chips.add(FactChip(ChipIcon.open24h, c('open_hours', args: [open.hours!])));
  if (has('fenced')) chips.add(FactChip(ChipIcon.fenced, serviceLabel('fenced', short: true)));
  if (has('ev_charging')) chips.add(FactChip(ChipIcon.ev, 'highlights.ev_chip'.tr(), title: serviceLabel('ev_charging')));
  final key = 'highlights.cancel_chip.$cancellationPolicy';
  final label = key.tr();
  if (label != key) {
    chips.add(FactChip(cancellationPolicy == 'non_refundable' ? ChipIcon.warning : ChipIcon.cancel, label, title: cancellationLabel(cancellationPolicy)));
  }
  return chips;
}

/// The shuttle box of a card (« encart navette », direction C, 14/10/2026).
class ShuttleFacts {
  const ShuttleFacts({this.rideMinutes, this.waitMinutes, this.live = false});

  /// Ride to the terminal, in minutes; null when unknown (the figure is left out).
  final int? rideMinutes;

  /// Average wait the operator declares; null when not declared (the figure is left out).
  final int? waitMinutes;

  /// The parking shows its shuttles to the travellers (R-B + I-C): the box carries the live rail (L3).
  final bool live;

  @override
  bool operator ==(Object other) =>
      other is ShuttleFacts && other.rideMinutes == rideMinutes && other.waitMinutes == waitMinutes && other.live == live;

  @override
  int get hashCode => Object.hash(rideMinutes, waitMinutes, live);

  @override
  String toString() => 'ShuttleFacts(ride: $rideMinutes, wait: $waitMinutes, live: $live)';
}

/// Only for a parking that offers the shuttle: a parking without one has no box.
ShuttleFacts? shuttleBox({
  required List<String> services,
  required int? shuttleMinutes,
  required int? shuttleWaitMinutes,
  required bool liveShuttle,
}) {
  if (!services.contains('shuttle')) return null;
  return ShuttleFacts(
    rideMinutes: shuttleMinutes != null && shuttleMinutes > 0 ? shuttleMinutes : null,
    waitMinutes: shuttleWaitMinutes != null && shuttleWaitMinutes >= 0 ? shuttleWaitMinutes : null,
    live: liveShuttle,
  );
}

enum TileKind { shuttle, outdoor, covered, keys, opening, cancellation }

class TrustTile {
  const TrustTile(this.kind, this.title, this.text, {this.live = false});

  final TileKind kind;
  final String title;
  final String text;

  /// The shuttle is shown live: the title carries the breathing dot.
  final bool live;

  @override
  bool operator ==(Object other) => other is TrustTile && other.kind == kind && other.title == title && other.text == text && other.live == live;

  @override
  int get hashCode => Object.hash(kind, title, text, live);

  @override
  String toString() => '$kind:$title:$text${live ? ':live' : ''}';
}

String _capitalised(String text) => text.isEmpty ? text : text[0].toUpperCase() + text.substring(1);

/// The trust band of a parking page (« L'essentiel », 14/10/2026), in this order: shuttle, outdoor or covered, keys,
/// opening, cancellation. A tile without data (no shuttle, no hours) is left out; up to five.
List<TrustTile> trustTiles({
  required List<String> services,
  required int? shuttleMinutes,
  int? shuttleWaitMinutes,
  bool liveShuttle = false,
  required String? openingHours,
  required String cancellationPolicy,
}) {
  bool has(String s) => services.contains(s);
  String t(String key, {List<String>? args}) => 'highlights.tiles.$key'.tr(args: args);
  final tiles = <TrustTile>[];
  final shuttle = shuttleBox(services: services, shuttleMinutes: shuttleMinutes, shuttleWaitMinutes: shuttleWaitMinutes, liveShuttle: liveShuttle);
  if (shuttle != null) {
    final parts = [
      if (shuttle.live) t('free'),
      if (shuttle.rideMinutes != null) t('ride', args: ['${shuttle.rideMinutes}']),
      if (shuttle.waitMinutes != null) t('wait', args: ['${shuttle.waitMinutes}']),
      if (shuttle.live) t('follow_live'),
    ];
    final text = parts.isEmpty ? t('to_terminals') : parts.join(' · ');
    tiles.add(TrustTile(TileKind.shuttle, shuttle.live ? t('shuttle_live') : t('shuttle_free'), _capitalised(text), live: shuttle.live));
  }
  final security = [if (has('fenced')) t('fenced'), if (has('cctv')) t('cctv')].join(', ');
  tiles.add(
    has('covered')
        ? TrustTile(TileKind.covered, t('covered'), security.isNotEmpty ? security : t('covered_text'))
        : TrustTile(TileKind.outdoor, t('outdoor'), security.isNotEmpty ? security : t('outdoor_text')),
  );
  tiles.add(
    has('valet') ? TrustTile(TileKind.keys, t('keys_valet'), t('keys_valet_text')) : TrustTile(TileKind.keys, t('keys_self'), t('keys_self_text')),
  );
  final open = _opening(services, openingHours);
  if (open != null && open.open24h) tiles.add(TrustTile(TileKind.opening, t('open_24h'), t('open_24h_text')));
  if (open != null && open.hours != null) tiles.add(TrustTile(TileKind.opening, t('open_hours', args: [open.hours!]), t('open_hours_text')));
  if (cancellationPolicy == 'non_refundable') {
    tiles.add(TrustTile(TileKind.cancellation, t('non_refundable'), t('non_refundable_text')));
  } else {
    final key = 'highlights.tiles.cancellation_text.$cancellationPolicy';
    final text = key.tr();
    if (text != key) tiles.add(TrustTile(TileKind.cancellation, t('free_cancellation'), text));
  }
  return tiles.take(5).toList();
}

/// "À 4,2 km des terminaux · Recharge électrique" (outdoor or covered is a tile of the band since 14/10/2026).
String factsLine({required List<String> services, required double? distanceKm}) {
  bool has(String s) => services.contains(s);
  return [
    if (distanceKm != null) 'highlights.km_from_terminals'.tr(args: [formatKm(distanceKm)]),
    if (has('ev_charging')) serviceLabel('ev_charging'),
  ].join(' · ');
}
