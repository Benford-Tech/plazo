import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_logo.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/icon_tile.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../trips/presentation/bloc/trips_bloc.dart';
import '../../data/models/public_models.dart';
import '../bloc/search/search_bloc.dart';
import '../widgets/dates_pill.dart';
import '../widgets/stay_sheet.dart';

/// "Rechercher" in the mockup's composition (T-A, 05/10/2026): a greeting, the title in Playfair, the
/// dates and "Rechercher" in a white card, then the map of the chosen stay with its floating pills
/// (how many parkings, how far) and the best offer as the one orange card; below, the next
/// departure kept on this phone, the three steps and the trust chips.
@RoutePage()
class SearchTabPage extends StatelessWidget implements AutoRouteWrapper {
  const SearchTabPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<SearchBloc>()..add(const SearchStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<SearchBloc, SearchState>(
        listenWhen: (a, b) => a.submitted != b.submitted,
        listener: (context, s) => context.router.push(ResultsRoute(airport: s.airportSlug, arrivee: s.arrivalAt, retour: s.returnAt)),
        child: RefreshIndicator(
          color: AppColors.accent,
          onRefresh: () async {
            context.read<TripsBloc>().add(const TripsLoaded(quiet: true));
            context.read<SearchBloc>().add(const SearchPreviewRequested());
          },
          child: ListView(padding: EdgeInsets.zero, children: const [_Home(), _MapHero(), _NextDeparture(), _Steps(), _Trust()]),
        ),
      ),
    );
  }
}

/// The greeting row, the title and the search card.
class _Home extends StatelessWidget {
  const _Home();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchBloc, SearchState>(
      builder: (context, state) {
        final airportName = state.airport?.name ?? 'search.kicker'.tr();
        final canPick = state.airports.length > 1;
        final dateError = state.errors['arrivalAt'] ?? state.errors['returnAt'];
        return SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const BrandLogo(height: 28),
                    const Spacer(),
                    Semantics(
                      button: canPick,
                      label: canPick ? 'search.airport_a11y'.tr(args: [airportName]) : airportName,
                      excludeSemantics: true,
                      child: Material(
                        color: Colors.white,
                        shape: const StadiumBorder(),
                        child: InkWell(
                          key: const Key('airport-picker'),
                          customBorder: const StadiumBorder(),
                          onTap: canPick ? () => _pickAirport(context, state) : null,
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(12, 8, 10, 8),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.flight_takeoff_rounded, size: 15, color: AppColors.accent),
                                const SizedBox(width: 6),
                                Text(state.airport?.code ?? 'LYS', style: AppText.strong(size: 12.5)),
                                if (canPick) const Icon(Icons.expand_more_rounded, color: AppColors.muted, size: 18),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text('search.greeting_sub'.tr(), style: AppText.label(size: 12)),
                const SizedBox(height: 2),
                Semantics(
                  header: true,
                  child: Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: '${'search.title_find'.tr()} ',
                          style: AppText.title(size: 24, color: AppColors.muted),
                        ),
                        TextSpan(
                          text: 'search.title_near'.tr(args: [airportName]),
                          style: AppText.title(size: 24, color: AppColors.brownOrInk).copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    style: const TextStyle(height: 1.12),
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: AppRadius.card,
                    boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 24, offset: Offset(0, 10))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      DatesPill(
                        arrivalAt: state.arrivalAt,
                        returnAt: state.returnAt,
                        errorText: dateError == null ? null : translateErrorCode(dateError),
                        onTap: () async {
                          final bloc = context.read<SearchBloc>();
                          final stay = await showStaySheet(context, arrivalAt: state.arrivalAt, returnAt: state.returnAt);
                          if (stay != null) bloc.add(SearchStayChanged(arrivalAt: stay.arrivalAt, returnAt: stay.returnAt));
                        },
                      ),
                      const SizedBox(height: 10),
                      GradientButton(
                        key: const Key('search-submit'),
                        label: 'search.submit'.tr(),
                        onPressed: () => context.read<SearchBloc>().add(const SearchSubmitted()),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _pickAirport(BuildContext context, SearchState state) async {
    final bloc = context.read<SearchBloc>();
    final slug = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text('search.airport'.tr(), style: AppText.title(size: 22)),
            ),
            for (final a in state.airports)
              ListTile(
                minTileHeight: 52,
                leading: const Icon(Icons.flight_takeoff_rounded, color: AppColors.accent),
                title: Text(a.name, style: AppText.strong()),
                subtitle: a.city == null ? null : Text(a.city!, style: AppText.muted()),
                selected: a.slug == state.airportSlug,
                onTap: () => Navigator.of(context).pop(a.slug),
              ),
          ],
        ),
      ),
    );
    if (slug != null) bloc.add(SearchAirportChanged(slug));
  }
}

/// The map of the stay: the terminals, the parkings as dots, a dashed line from the best offer to the
/// terminal, the pills "N parkings disponibles" and "x km · navette n min", and the orange card.
class _MapHero extends StatelessWidget {
  const _MapHero();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchBloc, SearchState>(
      builder: (context, state) {
        final airport = state.preview?.airport ?? state.airport;
        final terminals = airport?.location == null ? null : LatLng(airport!.location!.lat, airport.location!.lng);
        final featured = state.featured;
        final located = state.bookable.where((r) => r.location != null).toList();
        final featuredPoint = featured?.location == null ? null : LatLng(featured!.location!.lat, featured.location!.lng);
        final points = [?terminals, for (final r in located) LatLng(r.location!.lat, r.location!.lng)];
        final center = featuredPoint ?? terminals ?? const LatLng(45.7256, 5.0811);
        final count = state.bookable.length;
        final countLabel = state.previewState.isProcessing && state.preview == null
            ? 'search.preview_loading'.tr()
            : count == 0
            ? 'results.available_none'.tr()
            : count == 1
            ? 'results.available_one'.tr()
            : 'results.available_many'.tr(args: ['$count']);
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: ClipRRect(
            borderRadius: AppRadius.card,
            child: SizedBox(
              key: const Key('search-map'),
              height: 340,
              child: Stack(
                children: [
                  Positioned.fill(child: Container(color: const Color(0xFFE6E6E9))),
                  FlutterMap(
                    key: ValueKey('${state.airportSlug}-${points.length}'),
                    options: MapOptions(
                      initialCenter: center,
                      initialZoom: 12.5,
                      initialCameraFit: points.length > 1
                          ? CameraFit.bounds(bounds: LatLngBounds.fromPoints(points), padding: const EdgeInsets.fromLTRB(50, 96, 50, 170), maxZoom: 14)
                          : null,
                      interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                    ),
                    children: [
                      if (IgnMap.tilesEnabled)
                        TileLayer(urlTemplate: AppConstants.ignPlanTilesUrl, userAgentPackageName: 'com.benfordtech.parking_app', maxNativeZoom: 19),
                      if (featuredPoint != null && terminals != null)
                        PolylineLayer(
                          polylines: [
                            Polyline(
                              points: [featuredPoint, terminals],
                              color: AppColors.brownOrInk,
                              strokeWidth: 3,
                              pattern: StrokePattern.dashed(segments: const [9, 7]),
                            ),
                          ],
                        ),
                      MarkerLayer(
                        markers: [
                          for (final r in located)
                            Marker(
                              point: LatLng(r.location!.lat, r.location!.lng),
                              width: 18,
                              height: 18,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: r.slug == featured?.slug ? AppColors.accent : Colors.white,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: r.slug == featured?.slug ? Colors.white : AppColors.brownOrInk, width: 2.5),
                                ),
                              ),
                            ),
                          if (terminals != null)
                            Marker(
                              point: terminals,
                              width: 160,
                              height: 34,
                              child: Center(child: _FloatingPill(text: 'search.map_airport'.tr(), dark: true)),
                            ),
                        ],
                      ),
                    ],
                  ),
                  Positioned(
                    left: 12,
                    top: 12,
                    child: _FloatingPill(key: const Key('search-count'), text: countLabel, count: count > 0 ? '$count' : null),
                  ),
                  if (featured != null && (featured.distanceKm != null || featured.shuttleMinutes != null))
                    Positioned(
                      right: 12,
                      top: 12,
                      child: _FloatingPill(
                        key: const Key('search-distance'),
                        text: featured.distanceKm != null && featured.shuttleMinutes != null
                            ? 'search.km_shuttle'.tr(args: [_km(featured.distanceKm!), '${featured.shuttleMinutes}'])
                            : featured.distanceKm != null
                            ? 'search.km'.tr(args: [_km(featured.distanceKm!)])
                            : 'highlights.shuttle_min'.tr(args: ['${featured.shuttleMinutes}']),
                      ),
                    ),
                  Positioned(
                    right: 6,
                    bottom: featured == null ? 6 : 118,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      color: Colors.white.withValues(alpha: 0.8),
                      child: Text(AppConstants.ignAttribution, style: AppText.body(size: 10, color: AppColors.muted)),
                    ),
                  ),
                  if (featured != null)
                    Positioned(
                      left: 12,
                      right: 12,
                      bottom: 12,
                      child: _FeaturedCard(result: featured, state: state),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  static String _km(double km) => km < 10 ? km.toStringAsFixed(1).replaceAll('.', ',') : km.round().toString();
}

class _FloatingPill extends StatelessWidget {
  const _FloatingPill({super.key, required this.text, this.count, this.dark = false});
  final String text;
  final String? count;
  final bool dark;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(count == null ? 12 : 6, 6, 12, 6),
    decoration: BoxDecoration(
      color: dark ? AppColors.brownOrInk : Colors.white,
      borderRadius: AppRadius.pill,
      boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 16, offset: Offset(0, 6))],
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (count != null) ...[
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(color: AppColors.background, shape: BoxShape.circle),
            child: Center(child: Text(count!, style: AppText.strong(size: 12))),
          ),
          const SizedBox(width: 7),
        ],
        Text(text, style: AppText.strong(size: 12, color: dark ? Colors.white : AppColors.ink)),
      ],
    ),
  );
}

/// The one orange card: the best offer of the stay, opening its page.
class _FeaturedCard extends StatelessWidget {
  const _FeaturedCard({required this.result, required this.state});
  final SearchResultModel result;
  final SearchState state;

  @override
  Widget build(BuildContext context) {
    final r = result;
    final valet = r.services.contains('valet') ? 'search.featured_valet'.tr() : 'search.featured_self'.tr();
    final sub = r.shuttleMinutes == null ? 'search.featured_sub_no_shuttle'.tr(args: [valet]) : 'search.featured_sub'.tr(args: [valet, '${r.shuttleMinutes}']);
    return Semantics(
      button: true,
      label: 'search.see_parking'.tr(args: [r.title]),
      excludeSemantics: true,
      child: Material(
        color: AppColors.accent,
        borderRadius: AppRadius.card,
        child: InkWell(
          key: const Key('search-featured'),
          borderRadius: AppRadius.card,
          onTap: () => context.router.push(ParkingRoute(airport: state.airportSlug, parking: r.slug, arrivee: state.arrivalAt, retour: state.returnAt)),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'search.featured_from'.tr(args: [formatShortEuros(r.priceCents!)]),
                        style: AppText.strong(size: 12, color: Colors.white.withValues(alpha: 0.85)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        r.title,
                        style: AppText.strong(size: 17, color: Colors.white),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        sub,
                        style: AppText.body(size: 12, weight: 600, color: Colors.white.withValues(alpha: 0.85)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                  child: const Icon(Icons.north_east_rounded, color: AppColors.accent, size: 20),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NextDeparture extends StatelessWidget {
  const _NextDeparture();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TripsBloc, TripsState>(
      builder: (context, trips) {
        final next = trips.nextDeparture;
        if (next == null) return const SizedBox(height: 16);
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Semantics(header: true, child: Text('search.next_trip'.tr(), style: AppText.title(size: 21))),
              const SizedBox(height: 10),
              AppCard(
                key: const Key('next-departure'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(next.parking.title, style: AppText.strong(size: 14.5))),
                        StatusBadge.status(next.status),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${formatDay(next.arrivalAt.substring(0, 10))} ${next.arrivalAt.substring(11)} → '
                      '${formatDay(next.returnAt.substring(0, 10))} ${next.returnAt.substring(11)}',
                      style: AppText.muted(),
                    ),
                    const SizedBox(height: 10),
                    OutlineAction(
                      label: 'search.see_booking'.tr(),
                      onPressed: () => context.router.push(MyBookingRoute(reference: next.reference)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// The three steps, "Comparez · Réservez · Décollez" (I-A, 03/10/2026): a photo on each tile
/// (Pexels, free licence) with the step's icon as a badge over it.
class _Steps extends StatelessWidget {
  const _Steps();

  @override
  Widget build(BuildContext context) {
    const steps = [
      (Icons.search_rounded, StepGradients.first, 'compare'),
      (Icons.confirmation_number_rounded, StepGradients.second, 'book'),
      (Icons.directions_bus_rounded, StepGradients.third, 'fly'),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final (icon, gradient, key) in steps) ...[
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: ColoredBox(
                    color: AppColors.tintSoft,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Image.asset('assets/images/step-$key.jpg', height: 84, width: double.infinity, fit: BoxFit.cover, excludeFromSemantics: true),
                            Positioned(
                              left: 10,
                              bottom: -17,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: IconTile(icon, size: 34, gradient: gradient),
                              ),
                            ),
                          ],
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(10, 24, 10, 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('search.steps.$key'.tr(), style: AppText.strong(size: 13)),
                              const SizedBox(height: 2),
                              Text('search.steps.${key}_sub'.tr(), style: AppText.muted(size: 11.5).copyWith(height: 1.3)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (key != 'fly') const SizedBox(width: 8),
            ],
          ],
        ),
      ),
    );
  }
}

/// The trust chips, each with its filled violet icon.
class _Trust extends StatelessWidget {
  const _Trust();

  @override
  Widget build(BuildContext context) {
    const chips = [(Icons.euro_rounded, 'trust_price'), (Icons.directions_bus_rounded, 'trust_shuttle'), (Icons.verified_user_rounded, 'trust_cancel')];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final (icon, key) in chips)
            Container(
              padding: const EdgeInsets.fromLTRB(10, 7, 12, 7),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.line),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ExcludeSemantics(child: Icon(icon, size: 15, color: AppColors.accent)),
                  const SizedBox(width: 6),
                  Text('search.$key'.tr(), style: AppText.strong(size: 12.5, color: AppColors.dark)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
