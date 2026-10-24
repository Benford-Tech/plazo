import 'package:easy_localization/easy_localization.dart';

/// The age groups of the child car seats (24/10/2026, direction B « par âge »).
enum ChildSeatKind { infant, toddler, booster }

/// Child car seats for the shuttle (24/10/2026): the traveller says how many children of each age group ride along,
/// the parking installs the matching seats in the shuttle, both ways, for free. Children count in the booking's
/// passengers, so a booking always has one adult at least: seats < passengers.
///
/// A plain class (not freezed): the models that carry it hold it with `@Default(ChildSeats.none)`, so an older API
/// that does not send it reads as « no seat ».
class ChildSeats {
  const ChildSeats({this.infant = 0, this.toddler = 0, this.booster = 0});

  factory ChildSeats.fromJson(Map<String, dynamic> json) => ChildSeats(
    infant: _count(json['infant']),
    toddler: _count(json['toddler']),
    booster: _count(json['booster']),
  );

  static int _count(Object? value) => value is num && value > 0 ? value.toInt() : 0;

  /// No seat asked (the default of every model).
  static const none = ChildSeats();

  /// The most of one kind a booking may ask for (the API's CHECK says the same).
  static const maxPerKind = 4;

  /// Up to 12 months: rear-facing seat.
  final int infant;

  /// 1 to 4 years: child seat.
  final int toddler;

  /// 4 to 10 years: booster.
  final int booster;

  Map<String, dynamic> toJson() => {'infant': infant, 'toddler': toddler, 'booster': booster};

  int get total => infant + toddler + booster;

  /// At least one seat asked.
  bool get any => total > 0;

  int of(ChildSeatKind kind) => switch (kind) {
    ChildSeatKind.infant => infant,
    ChildSeatKind.toddler => toddler,
    ChildSeatKind.booster => booster,
  };

  /// The same seats with one kind set to [count].
  ChildSeats withKind(ChildSeatKind kind, int count) => switch (kind) {
    ChildSeatKind.infant => ChildSeats(infant: count, toddler: toddler, booster: booster),
    ChildSeatKind.toddler => ChildSeats(infant: infant, toddler: count, booster: booster),
    ChildSeatKind.booster => ChildSeats(infant: infant, toddler: toddler, booster: count),
  };

  ChildSeats copyWith({int? infant, int? toddler, int? booster}) =>
      ChildSeats(infant: infant ?? this.infant, toddler: toddler ?? this.toddler, booster: booster ?? this.booster);

  /// The seats to load for several bookings at once (the driver's « À charger avant de partir »).
  static ChildSeats sum(Iterable<ChildSeats> all) {
    var infant = 0, toddler = 0, booster = 0;
    for (final s in all) {
      infant += s.infant;
      toddler += s.toddler;
      booster += s.booster;
    }
    return ChildSeats(infant: infant, toddler: toddler, booster: booster);
  }

  /// Why a request is refused, or null: each count from 0 to 4, and fewer seats than passengers (one adult at least).
  /// The same codes as the API's.
  String? refusal(int passengers) {
    for (final kind in ChildSeatKind.values) {
      final n = of(kind);
      if (n < 0 || n > maxPerKind) return 'child_seats_range';
    }
    if (any && total >= passengers) return 'child_seats_exceed_passengers';
    return null;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is ChildSeats && other.infant == infant && other.toddler == toddler && other.booster == booster;

  @override
  int get hashCode => Object.hash(infant, toddler, booster);

  @override
  String toString() => 'ChildSeats(infant: $infant, toddler: $toddler, booster: $booster)';
}

/// « siège bébé » / « sièges bébé » (the l10n texts `child_seats.<kind>_one|many`).
String childSeatLabel(ChildSeatKind kind, int count) => 'child_seats.${kind.name}_${count > 1 ? 'many' : 'one'}'.tr();

/// « Siège bébé », « Siège 1 à 4 ans », « Réhausseur »: the pill of one kind (« 2 réhausseurs » when more than one).
String childSeatBadge(ChildSeatKind kind, int count) => count > 1 ? '$count ${childSeatLabel(kind, count)}' : 'child_seats.${kind.name}_badge'.tr();

/// « 1 siège bébé · 2 réhausseurs », or '' without any seat.
String childSeatsSummary(ChildSeats seats, {String separator = ' · '}) => [
  for (final kind in ChildSeatKind.values)
    if (seats.of(kind) > 0) '${seats.of(kind)} ${childSeatLabel(kind, seats.of(kind))}',
].join(separator);

/// « 1 siège bébé (dos à la route) · 1 siège 1 à 4 ans · 1 réhausseur »: what the driver loads before leaving.
String childSeatsLoadingLine(ChildSeats seats) => [
  for (final kind in ChildSeatKind.values)
    if (seats.of(kind) > 0)
      kind == ChildSeatKind.infant
          ? '${seats.infant} ${childSeatLabel(kind, seats.infant)} ${'child_seats.infant_loading'.tr()}'
          : '${seats.of(kind)} ${childSeatLabel(kind, seats.of(kind))}',
].join(' · ');

/// « dont 1 enfant » / « dont 3 enfants », or '' without any seat.
String childSeatsChildren(ChildSeats seats) =>
    !seats.any ? '' : (seats.total == 1 ? 'child_seats.children_one'.tr() : 'child_seats.children_many'.tr(args: ['${seats.total}']));
