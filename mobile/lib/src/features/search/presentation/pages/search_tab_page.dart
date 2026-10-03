import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/icon_tile.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../trips/presentation/bloc/trips_bloc.dart';
import '../bloc/search/search_bloc.dart';
import '../widgets/dates_pill.dart';
import '../widgets/stay_sheet.dart';

/// A1, "Rechercher": the hero photo of the site (Pexels) under the prune veil, the airport, the
/// single "Vos dates" pill and "Rechercher"; below, the next departure kept on this phone, the three
/// steps and the trust chips (icons of direction H-B: filled, on gradient tiles).
@RoutePage()
class SearchTabPage extends StatelessWidget implements AutoRouteWrapper {
  const SearchTabPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<SearchBloc>()..add(const SearchStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const BrandAppBar(),
      body: BlocListener<SearchBloc, SearchState>(
        listenWhen: (a, b) => a.submitted != b.submitted,
        listener: (context, s) => context.router.push(ResultsRoute(airport: s.airportSlug, arrivee: s.arrivalAt, retour: s.returnAt)),
        child: RefreshIndicator(
          color: AppColors.accent,
          onRefresh: () async => context.read<TripsBloc>().add(const TripsLoaded(quiet: true)),
          child: ListView(padding: EdgeInsets.zero, children: const [_Hero(), _NextDeparture(), _Steps(), _Trust()]),
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchBloc, SearchState>(
      builder: (context, state) {
        final airportName = state.airport?.name ?? 'search.kicker'.tr();
        final canPick = state.airports.length > 1;
        final dateError = state.errors['arrivalAt'] ?? state.errors['returnAt'];
        return Stack(
          children: [
            Positioned.fill(
              child: Image.asset('assets/images/hero-tarmac-800.jpg', fit: BoxFit.cover, alignment: const Alignment(0, 0.2), excludeFromSemantics: true),
            ),
            const Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment(-0.35, -1),
                    end: Alignment(0.35, 1),
                    colors: [Color(0xF04B164C), Color(0xCC722A7E), Color(0x739B3E6B)],
                    stops: [0, 0.55, 1],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 26),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Semantics(
                      button: canPick,
                      label: canPick ? 'search.airport_a11y'.tr(args: [airportName]) : airportName,
                      excludeSemantics: true,
                      child: InkWell(
                        key: const Key('airport-picker'),
                        onTap: canPick ? () => _pickAirport(context, state) : null,
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(minHeight: 32),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.flight_takeoff_rounded, size: 15, color: AppColors.onPruneSoft),
                              const SizedBox(width: 6),
                              Text(airportName.toUpperCase(), style: AppText.label(size: 12, color: AppColors.onPruneSoft)),
                              if (canPick) const Icon(Icons.expand_more_rounded, color: AppColors.onPruneSoft, size: 18),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Semantics(
                    header: true,
                    child: Text('search.title'.tr(), style: AppText.title(size: 29, color: Colors.white).copyWith(height: 1.12)),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [BoxShadow(color: Color(0x73000000), blurRadius: 30, offset: Offset(0, 12), spreadRadius: -12)],
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
            Positioned(
              right: 10,
              bottom: 5,
              child: Text('search.photo_credit'.tr(), style: AppText.body(size: 10.5, color: Colors.white.withValues(alpha: 0.75))),
            ),
          ],
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

/// The three steps, "Comparez · Réservez · Décollez", each on its own gradient tile.
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
                child: Container(
                  padding: const EdgeInsets.fromLTRB(12, 12, 10, 12),
                  decoration: BoxDecoration(color: AppColors.tintSoft, borderRadius: BorderRadius.circular(14)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      IconTile(icon, gradient: gradient),
                      const SizedBox(height: 8),
                      Text('search.steps.$key'.tr(), style: AppText.strong(size: 13)),
                      const SizedBox(height: 2),
                      Text('search.steps.${key}_sub'.tr(), style: AppText.muted(size: 11.5).copyWith(height: 1.3)),
                    ],
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
                  Text('search.$key'.tr(), style: AppText.strong(size: 12.5, color: AppColors.prune)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
