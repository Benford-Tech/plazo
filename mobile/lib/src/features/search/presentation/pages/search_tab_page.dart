import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_logo.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/icon_tile.dart';
import '../../../../shared/widgets/live_dot.dart';
import '../../../trips/presentation/bloc/trips_bloc.dart';
import '../bloc/search/search_bloc.dart';
import '../../../../core/helpers/highlights.dart';
import '../widgets/dates_pill.dart';
import '../widgets/result_card.dart';
import '../widgets/stay_sheet.dart';
import '../../../../shared/tutorials/tutorial_catalog.dart';
import '../../../../shared/tutorials/tutorial_spot.dart';

/// "Rechercher", A + C (05/11/2026, « Il y a mieux à faire », maquettes
/// https://claude.ai/artifact/U2XFGECBeM3epFB8Dz41mM): the next departure kept on this phone first, as the one orange
/// card (A); then the dates and the parkings of the stay straight away, with their total price and shuttle (C); the
/// map is one tap away (« Voir sur la carte », the results on their map); then the three steps and the trust chips.
@RoutePage()
class SearchTabPage extends StatelessWidget implements AutoRouteWrapper {
  const SearchTabPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<SearchBloc>()..add(const SearchStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return TutorialSpot(tutorial: Tutorials.search, child: _page(context));
  }

  Widget _page(BuildContext context) {
    return Scaffold(
      body: BlocListener<SearchBloc, SearchState>(
        listenWhen: (a, b) => a.submitted != b.submitted,
        listener: (context, s) => context.router.push(ResultsRoute(airport: s.airportSlug, arrivee: s.arrivalAt, retour: s.returnAt)),
        child: RefreshIndicator(
          color: AppColors.accent,
          // Edge-to-edge: no app bar here, so the spinner starts below the status bar, not under it.
          edgeOffset: MediaQuery.paddingOf(context).top,
          onRefresh: () async {
            context.read<TripsBloc>().add(const TripsLoaded(quiet: true));
            context.read<SearchBloc>().add(const SearchPreviewRequested());
          },
          child: ListView(padding: EdgeInsets.zero, children: const [_Header(), _NextTripHero(), _Home(), _Parkings(), _Steps(), _Trust()]),
        ),
      ),
    );
  }
}

/// The logo and the airport (a tap changes it when there are several).
class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchBloc, SearchState>(
      builder: (context, state) {
        final airportName = state.airport?.name ?? 'search.kicker'.tr();
        final canPick = state.airports.length > 1;
        return SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: Row(
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
          ),
        );
      },
    );
  }

  Future<void> _pickAirport(BuildContext context, SearchState state) => pickAirport(context, state);
}

/// The search card: the title (or « Un autre séjour ? » under a coming trip), the dates and the button to all the results.
class _Home extends StatelessWidget {
  const _Home();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TripsBloc, TripsState>(
      builder: (context, trips) => BlocBuilder<SearchBloc, SearchState>(
        builder: (context, state) {
          final airportName = state.airport?.name ?? 'search.kicker'.tr();
          final dateError = state.errors['arrivalAt'] ?? state.errors['returnAt'];
          final hasTrip = trips.nextDeparture != null;
          final count = state.bookable.length;
          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (hasTrip)
                  Text('search.another_stay'.tr().toUpperCase(), style: AppText.label(size: 11.5))
                else ...[
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
                ],
                const SizedBox(height: 10),
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
                        key: const Key('search-dates'),
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
                        label: count > 1
                            ? 'search.see_all_many'.tr(args: ['$count'])
                            : count == 1
                            ? 'search.see_all_one'.tr()
                            : 'search.submit'.tr(),
                        onPressed: () => context.read<SearchBloc>().add(const SearchSubmitted()),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// The airport picker of the header.
Future<void> pickAirport(BuildContext context, SearchState state) async {
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

/// A, the coming trip first (05/11/2026): the next departure kept on this phone as the one orange card, with how soon
/// it is, the parking, the dates and « Voir ma réservation ».
class _NextTripHero extends StatelessWidget {
  const _NextTripHero();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TripsBloc, TripsState>(
      builder: (context, trips) {
        final next = trips.nextDeparture;
        if (next == null) return const SizedBox.shrink();
        final today = DateTime.utc(trips.now.toLocal().year, trips.now.toLocal().month, trips.now.toLocal().day);
        final arrival = DateTime.parse('${next.arrivalAt.substring(0, 10)}T00:00:00Z');
        final daysLeft = arrival.difference(today).inDays;
        final when = daysLeft < 0
            ? 'search.trip_ongoing'.tr()
            : daysLeft == 0
            ? 'search.trip_today'.tr()
            : daysLeft == 1
            ? 'search.trip_tomorrow'.tr()
            : 'search.trip_in_days'.tr(args: ['$daysLeft']);
        final white85 = Colors.white.withValues(alpha: 0.85);
        Widget chip(String text) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(999)),
          child: Text(text, style: AppText.strong(size: 12.5, color: Colors.white)),
        );
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Container(
            key: const Key('next-departure'),
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            decoration: const BoxDecoration(color: AppColors.accent, borderRadius: AppRadius.card),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('search.next_trip'.tr().toUpperCase(), style: AppText.strong(size: 11.5, color: white85).copyWith(letterSpacing: 1)),
                const SizedBox(height: 4),
                Semantics(
                  header: true,
                  child: Text(
                    when,
                    key: const Key('next-departure-when'),
                    style: AppText.strong(size: 24, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  next.parking.title,
                  style: AppText.strong(size: 15, color: Colors.white),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    chip('${formatDay(next.arrivalAt.substring(0, 10))} ${next.arrivalAt.substring(11)}'),
                    chip('→ ${formatDay(next.returnAt.substring(0, 10))} ${next.returnAt.substring(11)}'),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    key: const Key('next-departure-open'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.accentDeep,
                      minimumSize: const Size.fromHeight(46),
                      shape: const StadiumBorder(),
                    ),
                    onPressed: () => context.router.push(MyBookingRoute(reference: next.reference)),
                    child: Text('search.see_booking'.tr(), style: AppText.strong(size: 15, color: AppColors.accentDeep)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// C, the parkings straight away (05/11/2026): how many are free for the dates, « Voir sur la carte » (the results on
/// their map), the shuttles on the road, then the first three cards (the cheapest first, full ones last).
class _Parkings extends StatelessWidget {
  const _Parkings();

  static const shown = 3;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchBloc, SearchState>(
      builder: (context, state) {
        final results = [...?state.preview?.results]
          ..sort((a, b) {
            if (a.bookable != b.bookable) return a.bookable ? -1 : 1;
            return (a.priceCents ?? 1 << 30).compareTo(b.priceCents ?? 1 << 30);
          });
        final badges = resultBadges(results);
        final count = state.bookable.length;
        final loading = state.previewState.isProcessing && state.preview == null;
        final countLabel = loading
            ? 'search.preview_loading'.tr()
            : count == 0
            ? 'results.available_none'.tr()
            : count == 1
            ? 'search.for_dates_one'.tr()
            : 'search.for_dates_many'.tr(args: ['$count']);
        final shuttleCount = state.live?.shuttles.length ?? 0;
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(countLabel.toUpperCase(), key: const Key('search-count'), style: AppText.label(size: 11.5)),
                  ),
                  TextButton.icon(
                    key: const Key('search-map-open'),
                    onPressed: () =>
                        context.router.push(ResultsRoute(airport: state.airportSlug, arrivee: state.arrivalAt, retour: state.returnAt, vue: 'carte')),
                    icon: const Icon(Icons.map_outlined, size: 18, color: AppColors.accentDeep),
                    label: Text('search.see_map'.tr(), style: AppText.strong(size: 13.5, color: AppColors.accentDeep)),
                  ),
                ],
              ),
              if (shuttleCount > 0) ...[
                Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    key: const Key('search-shuttles'),
                    padding: const EdgeInsets.fromLTRB(8, 5, 12, 5),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const LiveDot(animate: false),
                        const SizedBox(width: 6),
                        Text(
                          shuttleCount == 1 ? 'search.shuttles_one'.tr() : 'search.shuttles_many'.tr(args: ['$shuttleCount']),
                          style: AppText.strong(size: 12.5),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ] else
                const SizedBox(height: 4),
              for (final r in results.take(shown))
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: ResultCard(
                    key: Key('search-result-${r.slug}'),
                    result: r,
                    highlighted: r.slug == state.featured?.slug,
                    badges: badges[r.slug] ?? const [],
                    airportCode: state.airport?.code,
                    onTap: () => context.router.push(
                      ParkingRoute(airport: state.airportSlug, parking: r.slug, arrivee: state.arrivalAt, retour: state.returnAt),
                    ),
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
                            Image.asset(
                              'assets/images/step-$key.jpg',
                              height: 84,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              excludeFromSemantics: true,
                            ),
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
    const chips = [
      (Icons.euro_rounded, 'trust_price'),
      (Icons.directions_bus_rounded, 'trust_shuttle'),
      (Icons.verified_user_rounded, 'trust_cancel'),
    ];
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
