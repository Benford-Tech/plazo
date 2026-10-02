import '../../data/models/public_models.dart';

/// Filters and sort of the results, the same as the site's (site/src/lib/filters.ts). They only
/// narrow and order what the API returned: no price is computed here.

/// Order of the services in the filters sheet.
const filterServices = ['shuttle', 'valet', 'covered', 'ev_charging', 'open_24h', 'fenced', 'cctv'];

/// Shuttle limits offered ("10 min max", "15 min max"; null: "Peu importe").
const shuttleLimits = [10, 15];

enum SortKey { price, shuttle, distance }

class Filters {
  const Filters({this.services = const [], this.freeCancellation = false, this.maxShuttle, this.maxPriceCents, this.sort = SortKey.price});

  final List<String> services;
  final bool freeCancellation;
  final int? maxShuttle;

  /// Maximum total price, in cents; null = no limit.
  final int? maxPriceCents;
  final SortKey sort;

  /// At least one filter (not the sort) narrows the results.
  bool get active => services.isNotEmpty || freeCancellation || maxShuttle != null || maxPriceCents != null;

  int get activeCount => services.length + (freeCancellation ? 1 : 0) + (maxShuttle != null ? 1 : 0) + (maxPriceCents != null ? 1 : 0);

  Filters copyWith({List<String>? services, bool? freeCancellation, int? Function()? maxShuttle, int? Function()? maxPriceCents, SortKey? sort}) =>
      Filters(
        services: services ?? this.services,
        freeCancellation: freeCancellation ?? this.freeCancellation,
        maxShuttle: maxShuttle != null ? maxShuttle() : this.maxShuttle,
        maxPriceCents: maxPriceCents != null ? maxPriceCents() : this.maxPriceCents,
        sort: sort ?? this.sort,
      );

  /// Same sort, no filter.
  Filters cleared() => Filters(sort: sort);

  @override
  bool operator ==(Object other) =>
      other is Filters &&
      other.services.join(',') == services.join(',') &&
      other.freeCancellation == freeCancellation &&
      other.maxShuttle == maxShuttle &&
      other.maxPriceCents == maxPriceCents &&
      other.sort == sort;

  @override
  int get hashCode => Object.hash(services.join(','), freeCancellation, maxShuttle, maxPriceCents, sort);
}

int _byNullable(num? a, num? b) => (a ?? double.infinity).compareTo(b ?? double.infinity);

/// Results matching the filters, available first, then in the chosen order.
List<SearchResultModel> applyFilters(List<SearchResultModel> results, Filters f) {
  final kept = results.where((r) {
    if (f.services.any((s) => !r.services.contains(s))) return false;
    if (f.freeCancellation && r.cancellationPolicy == 'non_refundable') return false;
    if (f.maxShuttle != null && (r.shuttleMinutes == null || r.shuttleMinutes! > f.maxShuttle!)) return false;
    if (f.maxPriceCents != null && (r.priceCents == null || r.priceCents! > f.maxPriceCents!)) return false;
    return true;
  }).toList();
  int order(SearchResultModel a, SearchResultModel b) {
    int then(int first) => first != 0 ? first : _byNullable(a.priceCents, b.priceCents);
    return switch (f.sort) {
      SortKey.shuttle => then(_byNullable(a.shuttleMinutes, b.shuttleMinutes)),
      SortKey.distance => then(_byNullable(a.distanceKm, b.distanceKm)),
      SortKey.price => _byNullable(a.priceCents, b.priceCents),
    };
  }

  // A stable sort (List.sort is not): index as the last key.
  final indexed = kept.asMap().entries.toList()
    ..sort((x, y) {
      final a = x.value, b = y.value;
      final byAvailable = (b.available ? 1 : 0) - (a.available ? 1 : 0);
      if (byAvailable != 0) return byAvailable;
      final o = order(a, b);
      return o != 0 ? o : x.key - y.key;
    });
  return indexed.map((e) => e.value).toList();
}

/// Number of results offering each service (over all results, so counts do not jump while filtering).
Map<String, int> serviceCounts(List<SearchResultModel> results) {
  final counts = {for (final s in filterServices) s: 0};
  for (final r in results) {
    for (final s in r.services) {
      if (counts.containsKey(s)) counts[s] = counts[s]! + 1;
    }
  }
  return counts;
}

/// Upper bound of the price slider: highest price, rounded up to 10 €.
int priceCeilingCents(List<SearchResultModel> results) {
  final prices = results.map((r) => r.priceCents).whereType<int>();
  if (prices.isEmpty) return 0;
  final max = prices.reduce((a, b) => a > b ? a : b);
  return (max / 1000).ceil() * 1000;
}

/// The cheapest available result, when there is something to compare (2 or more available).
String? cheapestSlug(List<SearchResultModel> results) {
  final available = results.where((r) => r.bookable).toList();
  if (available.length < 2) return null;
  return available.reduce((a, b) => b.priceCents! < a.priceCents! ? b : a).slug;
}
