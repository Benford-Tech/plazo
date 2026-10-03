import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/listing.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/demo_tag.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/segmented.dart';
import '../../../../shared/widgets/striped_placeholder.dart';
import '../../data/models/public_models.dart';
import '../../domain/usecases/public_use_cases.dart';
import '../bloc/parking/parking_bloc.dart';
import '../widgets/stay_sheet.dart';

/// A3, a parking's page (the site's /:airport/:parking): photos, facts, À l'aller / Au retour /
/// Tarifs / Accès, and the booking bar with the total for the dates (computed by the API).
@RoutePage()
class ParkingPage extends StatelessWidget implements AutoRouteWrapper {
  const ParkingPage({
    super.key,
    @PathParam('airport') required this.airport,
    @PathParam('parking') required this.parking,
    @QueryParam('arrivee') this.arrivee,
    @QueryParam('retour') this.retour,
  });

  final String airport;
  final String parking;
  final String? arrivee;
  final String? retour;

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(
    create: (_) =>
        locator<ParkingBloc>(param1: StayParams(airport: airport, parking: parking, arrivalAt: arrivee, returnAt: retour))
          ..add(const ParkingRequested()),
    child: this,
  );

  @override
  Widget build(BuildContext context) => const _ParkingView();
}

class _ParkingView extends StatefulWidget {
  const _ParkingView();

  @override
  State<_ParkingView> createState() => _ParkingViewState();
}

class _ParkingViewState extends State<_ParkingView> {
  final _sections = {for (final k in ['outbound', 'inbound', 'prices', 'access']) k: GlobalKey()};

  void _goTo(String key) {
    final ctx = _sections[key]?.currentContext;
    if (ctx != null) Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 300), alignment: 0.02);
  }

  Future<void> _changeDates(BuildContext context, ParkingState state) async {
    final bloc = context.read<ParkingBloc>();
    final stay = await showStaySheet(context, arrivalAt: state.arrivalAt, returnAt: state.returnAt);
    if (stay != null) bloc.add(ParkingStayChanged(arrivalAt: stay.arrivalAt, returnAt: stay.returnAt));
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ParkingBloc, ParkingState>(
      builder: (context, state) {
        final response = state.response;
        return Scaffold(
          appBar: AppBar(
            titleSpacing: NavigationToolbar.kMiddleSpacing,
            title: Text(response?.parking.title ?? '', style: AppText.strong(size: 16, color: Colors.white)),
          ),
          body: response == null
              ? Center(
                  child: state.loadState.isError
                      ? Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(state.errorMessage ?? 'errors.generic'.tr(), textAlign: TextAlign.center, style: AppText.body()),
                              const SizedBox(height: 12),
                              OutlineAction(label: 'common.retry'.tr(), onPressed: () => context.read<ParkingBloc>().add(const ParkingRequested())),
                            ],
                          ),
                        )
                      : const CircularProgressIndicator(color: AppColors.violet),
                )
              : _content(context, response),
          bottomNavigationBar: response == null ? null : _BookingBar(state: state, onChangeDates: () => _changeDates(context, state)),
        );
      },
    );
  }

  Widget _content(BuildContext context, ParkingResponseModel response) {
    final p = response.parking;
    final shuttle = p.services.contains('shuttle') ? p.shuttleMinutes : null;
    final destination = p.address ?? '${p.title}, ${response.airport.name}';
    final facts = [
      if (shuttle != null) 'parking.shuttle_min'.tr(args: ['$shuttle']),
      for (final s in p.services)
        if (s != 'shuttle') serviceLabel(s, short: true),
    ].join(' · ');
    final tiers = p.pricing.tiers;
    final links = locator<LinkService>();
    return ListView(
      key: const Key('parking-scroll'),
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        _Photos(photos: p.photos, title: p.title),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Flexible(child: Semantics(header: true, child: Text(p.title, style: AppText.title(size: 25)))),
                  if (p.isDemo) ...[const SizedBox(width: 10), const DemoTag()],
                ],
              ),
              if (facts.isNotEmpty) ...[const SizedBox(height: 4), Text(facts, style: AppText.muted())],
              if (p.distanceKm != null || p.openingHours != null) ...[
                const SizedBox(height: 2),
                Text(
                  [
                    if (p.distanceKm != null) 'parking.km_from_terminals'.tr(args: [formatKm(p.distanceKm!)]),
                    if (p.openingHours != null) '${'parking.hours'.tr()} : ${p.openingHours}',
                  ].join(' · '),
                  style: AppText.muted(),
                ),
              ],
              const SizedBox(height: 4),
              Text(
                cancellationLabel(p.cancellationPolicy),
                style: AppText.body(
                  size: 13.5,
                  weight: 600,
                  color: isFreeCancellation(p.cancellationPolicy) ? const Color(0xFF1F7A3F) : AppColors.muted,
                ),
              ),
              const SizedBox(height: 12),
              Semantics(
                label: 'parking.anchors'.tr(),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    PillChip(key: const Key('anchor-outbound'), label: 'parking.outbound'.tr(), onTap: () => _goTo('outbound')),
                    PillChip(key: const Key('anchor-inbound'), label: 'parking.inbound'.tr(), onTap: () => _goTo('inbound')),
                    if (tiers.isNotEmpty) PillChip(key: const Key('anchor-prices'), label: 'parking.prices'.tr(), onTap: () => _goTo('prices')),
                    PillChip(key: const Key('anchor-access'), label: 'parking.access'.tr(), onTap: () => _goTo('access')),
                  ],
                ),
              ),
              if (p.description != null && p.description!.trim().isNotEmpty) ...[
                _sectionTitle('parking.presentation'.tr()),
                Text(p.description!, style: AppText.body(height: 1.5)),
              ],
              _sectionTitle('parking.outbound'.tr(), key: _sections['outbound']),
              Text(
                shuttle != null ? 'parking.outbound_text_min'.tr(args: ['$shuttle']) : 'parking.outbound_text'.tr(),
                style: AppText.body(height: 1.5),
              ),
              _sectionTitle('parking.inbound'.tr(), key: _sections['inbound']),
              Text('parking.inbound_text'.tr(), style: AppText.body(height: 1.5)),
              if (tiers.isNotEmpty) ...[
                _sectionTitle('parking.prices'.tr(), key: _sections['prices']),
                Text('parking.prices_note'.tr(), style: AppText.muted()),
                const SizedBox(height: 6),
                for (final t in tiers) _priceRow('parking.tier_up_to'.tr(args: [daysLabel(t.days)]), formatEuros(t.priceCents)),
                if (p.pricing.extraDayPriceCents != null) _priceRow('parking.extra_day'.tr(), formatEuros(p.pricing.extraDayPriceCents!)),
              ],
              _sectionTitle('parking.access'.tr(), key: _sections['access']),
              Text(p.address ?? 'parking.address_unknown'.tr(), style: AppText.body()),
              const SizedBox(height: 10),
              OutlineAction(
                key: const Key('parking-itinerary'),
                icon: Icons.directions_rounded,
                label: 'parking.itinerary'.tr(),
                onPressed: () => links.open(links.directions(destination)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _sectionTitle(String text, {Key? key}) => Padding(
    key: key,
    padding: const EdgeInsets.only(top: 22, bottom: 6),
    child: Semantics(header: true, child: Text(text, style: AppText.title(size: 21))),
  );

  Widget _priceRow(String label, String value) => Container(
    padding: const EdgeInsets.symmetric(vertical: 9),
    decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.line))),
    child: Row(
      children: [
        Expanded(child: Text(label, style: AppText.body())),
        Text(value, style: AppText.strong()),
      ],
    ),
  );
}

class _Photos extends StatefulWidget {
  const _Photos({required this.photos, required this.title});
  final List<String> photos;
  final String title;

  @override
  State<_Photos> createState() => _PhotosState();
}

class _PhotosState extends State<_Photos> {
  int _page = 0;

  @override
  Widget build(BuildContext context) {
    final photos = widget.photos;
    if (photos.isEmpty) return StripedPlaceholder(height: 160, label: 'parking.photo_placeholder'.tr());
    return SizedBox(
      height: 210,
      child: Stack(
        children: [
          PageView.builder(
            itemCount: photos.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (_, i) => ParkingPhoto(
              url: photos[i],
              height: 210,
              label: 'parking.photo_of'.tr(args: [widget.title, '${i + 1}', '${photos.length}']),
            ),
          ),
          if (photos.length > 1)
            Positioned(
              bottom: 8,
              left: 0,
              right: 0,
              child: ExcludeSemantics(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var i = 0; i < photos.length; i++)
                      Container(
                        width: 7,
                        height: 7,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(shape: BoxShape.circle, color: i == _page ? Colors.white : Colors.white54),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// The sticky bar: total for the dates and "Réserver"; "Réservation en ligne bientôt disponible"
/// when the parking cannot be booked in the app yet; "Complet" / "Pas de tarif" otherwise.
class _BookingBar extends StatelessWidget {
  const _BookingBar({required this.state, required this.onChangeDates});

  final ParkingState state;
  final VoidCallback onChangeDates;

  @override
  Widget build(BuildContext context) {
    final offer = state.offer;
    final a = parseLocal(state.arrivalAt), r = parseLocal(state.returnAt);
    final hasDates = offer != null && a != null && r != null;
    final tiers = state.response?.parking.pricing.tiers ?? const [];
    final cheapest = tiers.isEmpty ? null : (List.of(tiers)..sort((x, y) => x.priceCents.compareTo(y.priceCents))).first;
    final datesLine = hasDates ? '${shortRange(a.date, r.date)} · ${daysLabel(offer.days)}' : null;

    Widget left;
    Widget right;
    if (!hasDates) {
      left = Text(cheapest == null ? '' : 'parking.from'.tr(args: [formatEuros(cheapest.priceCents)]), style: AppText.strong(size: 18));
      right = GradientButton(key: const Key('parking-choose-dates'), label: 'parking.choose_dates'.tr(), onPressed: onChangeDates);
    } else if (!offer.bookable) {
      left = _priceAndDates(
        offer.priceCents == null ? 'parking.no_price'.tr() : 'parking.full'.tr(),
        datesLine!,
        onChangeDates,
        muted: true,
      );
      right = OutlinedButton(
        key: const Key('parking-other'),
        onPressed: () => context.router.maybePop(),
        style: OutlinedButton.styleFrom(minimumSize: const Size(48, 48), shape: const StadiumBorder(), side: const BorderSide(color: AppColors.line)),
        child: Text('parking.other_parkings'.tr(), textAlign: TextAlign.center, style: AppText.strong(size: 13.5)),
      );
    } else {
      left = _priceAndDates(formatEuros(offer.priceCents!), datesLine!, onChangeDates);
      right = state.payment == 'unavailable'
          ? Container(
              key: const Key('parking-online-soon'),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(color: const Color(0xFFF6EAF9), borderRadius: BorderRadius.circular(14)),
              child: Text('parking.online_soon'.tr(), textAlign: TextAlign.center, style: AppText.strong(size: 13, color: const Color(0xFF7B1D93))),
            )
          : GradientButton(
              key: const Key('parking-book'),
              label: 'parking.book'.tr(),
              onPressed: () => context.router.push(
                BookingFormRoute(airport: state.airport, parking: state.slug, arrivee: state.arrivalAt!, retour: state.returnAt!),
              ),
            );
    }
    return Material(
      color: Colors.white,
      child: SafeArea(
        top: false,
        child: Container(
          decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.line))),
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: Row(children: [Expanded(flex: 5, child: left), const SizedBox(width: 10), Flexible(flex: 4, child: right)]),
        ),
      ),
    );
  }

  Widget _priceAndDates(String main, String dates, VoidCallback onTap, {bool muted = false}) => Semantics(
    button: true,
    label: '$main. $dates. ${'parking.change_dates'.tr()}',
    excludeSemantics: true,
    child: InkWell(
      key: const Key('parking-dates'),
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(main, style: AppText.strong(size: muted ? 15 : 20, color: muted ? AppColors.muted : AppColors.ink)),
            Text(dates, style: AppText.muted(size: 12.5).copyWith(decoration: TextDecoration.underline, decorationColor: AppColors.line)),
          ],
        ),
      ),
    ),
  );
}
