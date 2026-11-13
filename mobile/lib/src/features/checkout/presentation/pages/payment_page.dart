import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../services/payment_sheet_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../trips/presentation/bloc/trips_bloc.dart';
import '../bloc/payment_bloc.dart';
import '../widgets/booking_steps.dart';
import '../widgets/night_fee_lines.dart';

/// "29:41"
String formatCountdown(int seconds) {
  final s = seconds < 0 ? 0 : seconds;
  return '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';
}

/// A4, step 2 "Paiement" (the site's /ma-reservation/:reference/paiement): the recap, the time left
/// on the place's hold, and "Payer", which opens Stripe's native payment sheet (Apple Pay / Google
/// Pay) — or Stripe Checkout on web builds.
@RoutePage()
class PaymentPage extends StatelessWidget implements AutoRouteWrapper {
  const PaymentPage({super.key, @PathParam('reference') required this.reference});

  final String reference;

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(
    create: (_) => locator<PaymentBloc>(param1: reference)..add(const PaymentStarted()),
    child: this,
  );

  @override
  Widget build(BuildContext context) => const PaymentView();
}

class PaymentView extends StatelessWidget {
  const PaymentView({super.key});

  void _onState(BuildContext context, PaymentState state) {
    if (state.status == PaymentStatus.paid) {
      locator<TripsBloc>().add(const TripsLoaded(quiet: true));
      context.router.replace(MyBookingRoute(reference: state.reference, confirmee: '1'));
    } else if (state.status == PaymentStatus.released) {
      final b = state.booking!;
      final airport = b.parking.airport?.slug;
      final parking = b.parking.slug;
      if (airport == null || parking == null) {
        context.router.maybePop();
        return;
      }
      context.router.replace(BookingFormRoute(airport: airport, parking: parking, arrivee: b.arrivalAt, retour: b.returnAt));
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<PaymentBloc, PaymentState>(
      listenWhen: (a, b) => a.status != b.status,
      listener: _onState,
      builder: (context, state) => Scaffold(
        appBar: AppBar(
          titleSpacing: NavigationToolbar.kMiddleSpacing,
          title: Text('book.title'.tr(), style: AppText.strong(size: 16, color: AppColors.brownOrInk)),
        ),
        body: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
            children: [
              const BookingSteps(current: 2),
              const SizedBox(height: 14),
              Semantics(header: true, child: Text('pay.title'.tr(), style: AppText.title(size: 28))),
              const SizedBox(height: 12),
              ..._body(context, state),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _body(BuildContext context, PaymentState state) {
    final bloc = context.read<PaymentBloc>();
    switch (state.status) {
      case PaymentStatus.loading:
      case PaymentStatus.paid:
      case PaymentStatus.released:
        return const [
          Padding(
            padding: EdgeInsets.all(40),
            child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
          ),
        ];
      case PaymentStatus.error:
        return [
          Text(state.message ?? 'errors.generic'.tr(), style: AppText.body()),
          const SizedBox(height: 12),
          OutlineAction(label: 'common.retry'.tr(), onPressed: () => bloc.add(const PaymentStarted())),
        ];
      case PaymentStatus.expired:
        return [
          Semantics(
            liveRegion: true,
            container: true,
            child: Container(
              key: const Key('payment-expired'),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFCE8E6),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFF2B8B5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('pay.expired_title'.tr(), style: AppText.strong(size: 17, color: AppColors.danger)),
                  const SizedBox(height: 6),
                  Text('pay.expired_text'.tr(), style: AppText.body(size: 14.5, height: 1.45)),
                  const SizedBox(height: 14),
                  GradientButton(
                    key: const Key('payment-restart'),
                    label: 'pay.restart'.tr(),
                    busy: state.busy,
                    onPressed: () => bloc.add(const PaymentEditPressed()),
                  ),
                ],
              ),
            ),
          ),
        ];
      case PaymentStatus.verifying:
        return [
          Semantics(
            liveRegion: true,
            container: true,
            child: AppCard(
              key: const Key('payment-verifying'),
              color: AppColors.canvas,
              borderColor: AppColors.canvas,
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(width: 30, height: 30, child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.accent)),
                  const SizedBox(height: 12),
                  Text('pay.verifying_title'.tr(), style: AppText.title(size: 22)),
                  const SizedBox(height: 4),
                  Text('pay.verifying_text'.tr(), style: AppText.muted()),
                  const SizedBox(height: 12),
                  OutlineAction(label: 'pay.refresh'.tr(), onPressed: () => bloc.add(const PaymentRefreshRequested())),
                ],
              ),
            ),
          ),
        ];
      case PaymentStatus.ready:
      case PaymentStatus.presenting:
      case PaymentStatus.redirecting:
        final b = state.booking!;
        // 21/10/2026: the services asked with the booking are paid with it.
        final total = b.priceCents == null ? '' : formatEuros(b.priceCents! + b.extrasCents);
        final sheet = state.sheetAvailable(locator<PaymentSheetService>());
        final notice = switch (state.notice) {
          PaymentNotice.canceled => 'pay.canceled'.tr(),
          PaymentNotice.failed => state.message != null ? 'pay.failed'.tr(args: [state.message!]) : 'pay.failed_generic'.tr(),
          null => state.message == null ? null : (state.message == 'link_failed' ? translateErrorCode('link_failed') : state.message),
        };
        // 13/11/2026 (« B avec plus de couleur »): everything on Plazo's page. The recap as the brown ticket of the app,
        // then Google Pay / Apple Pay and Stripe's secure card field, then the orange button.
        const light = Color(0xFFFFFFFF);
        return [
          Container(
            key: const Key('payment-recap'),
            clipBehavior: Clip.antiAlias,
            decoration: const BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppRadius.card,
              boxShadow: [BoxShadow(color: Color(0x142C1A0E), blurRadius: 30, offset: Offset(0, 10))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  color: AppColors.dark,
                  padding: const EdgeInsets.fromLTRB(16, 6, 6, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text('pay.recap'.tr().toUpperCase(), style: AppText.label(size: 11.5, color: AppColors.accentLight)),
                          ),
                          TextButton(
                            key: const Key('payment-modify'),
                            style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
                            onPressed: state.busy ? null : () => bloc.add(const PaymentEditPressed()),
                            child: Text('common.modify'.tr(), style: AppText.strong(size: 14, color: light)),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(b.parking.title, style: AppText.strong(size: 17, color: light)),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: const BoxDecoration(color: AppColors.accent, borderRadius: AppRadius.pill),
                              child: Text(daysLabel(b.days ?? 1), style: AppText.strong(size: 13, color: light)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      // 12/10/2026: both hours, which the night fee line below refers to.
                      Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _StayTile(key: const Key('payment-drop-off'), label: 'manage.drop_off'.tr(), local: b.arrivalAt),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _StayTile(key: const Key('payment-pick-up'), label: 'manage.pick_up'.tr(), local: b.returnAt),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      RecapRow(
                        left: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(b.customerName, style: AppText.strong(size: 14.5)),
                            Text(formatPhone(b.customerPhone), style: AppText.tabular(size: 14, weight: 500, color: AppColors.muted)),
                          ],
                        ),
                        right: FrenchPlate(b.plate, size: 12),
                      ),
                      const Divider(height: 18, color: AppColors.line),
                      // Direction B: « Forfait 8 jours » and « Frais de nuit · dépôt à 23:30 » before the total when the stay pays one.
                      if (b.priceCents != null && NightFeeLines.shows(b.nightFee)) ...[
                        NightFeeLines(
                          days: b.days ?? 1,
                          priceCents: b.priceCents!,
                          basePriceCents: b.basePriceCents,
                          nightFee: b.nightFee,
                          arrivalAt: b.arrivalAt,
                          returnAt: b.returnAt,
                        ),
                        const Divider(height: 14, color: AppColors.line),
                      ],
                      RecapRow(
                        key: const Key('payment-total'),
                        left: Text('pay.total'.tr(), style: AppText.strong(size: 17)),
                        right: Text(total, style: AppText.big(size: 22, color: AppColors.accentDeep)),
                      ),
                      if (b.extrasCents > 0) ...[
                        const SizedBox(height: 4),
                        Text(
                          'extras.of_which'.tr(args: [formatEuros(b.extrasCents)]),
                          key: const Key('payment-extras'),
                          style: AppText.muted(size: 13),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (state.secondsLeft != null)
            Center(
              child: Semantics(
                label: 'pay.hold_left'.tr(args: [formatCountdown(state.secondsLeft!)]),
                excludeSemantics: true,
                child: Container(
                  key: const Key('payment-countdown'),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: const BoxDecoration(color: AppStatus.warnSoft, borderRadius: AppRadius.pill),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.timer_outlined, size: 17, color: AppStatus.warnText),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text.rich(
                          TextSpan(
                            style: AppText.body(size: 13.5, weight: 600, color: AppStatus.warnText),
                            children: [
                              TextSpan(text: 'pay.hold_left'.tr(args: [''])),
                              TextSpan(
                                text: formatCountdown(state.secondsLeft!),
                                style: AppText.tabular(size: 13.5, color: AppStatus.warnText),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          if (sheet) ...[
            const SizedBox(height: 16),
            Text('pay.how'.tr().toUpperCase(), style: AppText.label(size: 11.5)),
            const SizedBox(height: 8),
            if (state.walletAvailable) ...[
              Stack(
                alignment: Alignment.center,
                children: [
                  IgnorePointer(
                    ignoring: state.busy,
                    child: Opacity(
                      opacity: state.busy && state.payingWith != PaymentMethodChoice.wallet ? 0.5 : 1,
                      child: locator<PaymentSheetService>().walletButton(onPressed: () => bloc.add(const PaymentWalletPressed())),
                    ),
                  ),
                  if (state.payingWith == PaymentMethodChoice.wallet)
                    const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Expanded(child: Divider(color: AppColors.line)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Text('pay.or_card'.tr(), style: AppText.muted(size: 13)),
                  ),
                  const Expanded(child: Divider(color: AppColors.line)),
                ],
              ),
              const SizedBox(height: 12),
            ],
            Container(
              key: const Key('payment-card'),
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: AppRadius.card,
                border: Border.all(color: state.cardComplete ? AppStatus.ok : AppColors.accentLight, width: 1.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.credit_card_rounded, size: 20, color: AppColors.accentDeep),
                      const SizedBox(width: 8),
                      Expanded(child: Text('pay.card'.tr(), style: AppText.strong(size: 15))),
                      if (state.cardComplete)
                        const Icon(Icons.check_circle_rounded, size: 20, color: AppStatus.ok, semanticLabel: 'OK')
                      else
                        const _CardBrands(),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    decoration: const BoxDecoration(color: AppColors.canvas, borderRadius: AppRadius.field),
                    child: locator<PaymentSheetService>().cardField(
                      enabled: !state.busy,
                      onComplete: (complete) => bloc.add(PaymentCardChanged(complete)),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (notice != null) ...[
            const SizedBox(height: 10),
            Semantics(
              liveRegion: true,
              child: Container(
                key: const Key('payment-notice'),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: state.notice == PaymentNotice.canceled ? AppColors.canvas : const Color(0xFFFCE8E6),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  notice,
                  style: AppText.body(size: 14, weight: 600, color: state.notice == PaymentNotice.canceled ? AppColors.ink : AppColors.danger),
                ),
              ),
            ),
          ],
          const SizedBox(height: 14),
          GradientButton(
            key: const Key('payment-pay'),
            label: 'pay.button'.tr(args: [total]),
            icon: Icons.lock_rounded,
            busy: state.busy && (state.payingWith == PaymentMethodChoice.card || !sheet),
            // The card's button waits for a complete card (greyed until then); web builds go to Stripe Checkout.
            onPressed: sheet && (!state.cardComplete || state.busy) ? null : () => bloc.add(const PaymentPayPressed()),
          ),
          const SizedBox(height: 10),
          Text.rich(
            TextSpan(
              children: [
                const WidgetSpan(
                  alignment: PlaceholderAlignment.middle,
                  child: Padding(
                    padding: EdgeInsets.only(right: 6),
                    child: Icon(Icons.verified_user_rounded, size: 16, color: AppStatus.ok),
                  ),
                ),
                TextSpan(text: sheet ? 'pay.secure'.tr() : 'pay.secure_web'.tr()),
              ],
            ),
            textAlign: TextAlign.center,
            style: AppText.muted(size: 13),
          ),
        ];
    }
  }
}

/// « DÉPÔT / sam. 13 oct. 23:30 » in the payment recap (12/10/2026): the hour goes under the day on a narrow phone.
class _StayTile extends StatelessWidget {
  const _StayTile({super.key, required this.label, required this.local});

  final String label;

  /// Parking-local date-time "YYYY-MM-DDTHH:mm".
  final String local;

  @override
  Widget build(BuildContext context) {
    final p = parseLocal(local);
    return MergeSemantics(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: const BoxDecoration(color: Color(0x1FFFFFFF), borderRadius: AppRadius.field),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label.toUpperCase(), style: AppText.label(size: 11, color: AppColors.accentLight)),
            const SizedBox(height: 2),
            if (p == null)
              Text(local, style: AppText.strong(size: 14, color: Colors.white))
            else
              Wrap(
                spacing: 6,
                children: [
                  Text(formatDay(p.date), style: AppText.strong(size: 14, color: Colors.white)),
                  Text(p.time, style: AppText.tabular(size: 14, color: Colors.white)),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

/// « CB · VISA · MC » in their own colours, next to « Carte bancaire ».
class _CardBrands extends StatelessWidget {
  const _CardBrands();

  @override
  Widget build(BuildContext context) {
    Widget chip(String text, Color bg, Color fg) => Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(5)),
      child: Text(text, style: AppText.strong(size: 10, color: fg)),
    );
    return ExcludeSemantics(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          chip('CB', const Color(0xFF1C4E9C), Colors.white),
          chip('VISA', const Color(0xFF1A1F71), Colors.white),
          chip('MC', const Color(0xFFEB001B), Colors.white),
        ],
      ),
    );
  }
}
