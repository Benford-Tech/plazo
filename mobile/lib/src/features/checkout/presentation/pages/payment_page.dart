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
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<PaymentBloc>(param1: reference)..add(const PaymentStarted()), child: this);

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
        appBar: AppBar(titleSpacing: NavigationToolbar.kMiddleSpacing, title: Text('book.title'.tr(), style: AppText.strong(size: 16, color: AppColors.brownOrInk))),
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
        return const [Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator(color: AppColors.accent)))];
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
        final total = b.priceCents == null ? '' : formatEuros(b.priceCents!);
        final sheet = state.sheetAvailable(locator<PaymentSheetService>());
        final notice = switch (state.notice) {
          PaymentNotice.canceled => 'pay.canceled'.tr(),
          PaymentNotice.failed => state.message != null ? 'pay.failed'.tr(args: [state.message!]) : 'pay.failed_generic'.tr(),
          null => state.message == null ? null : (state.message == 'link_failed' ? translateErrorCode('link_failed') : state.message),
        };
        return [
          AppCard(
            key: const Key('payment-recap'),
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(child: Text('pay.recap'.tr(), style: AppText.title(size: 20))),
                    TextButton(
                      key: const Key('payment-modify'),
                      style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
                      onPressed: state.busy ? null : () => bloc.add(const PaymentEditPressed()),
                      child: Text('common.modify'.tr(), style: AppText.strong(size: 14, color: AppColors.accent)),
                    ),
                  ],
                ),
                RecapRow(left: Text(b.parking.title, style: AppText.muted(size: 14.5)), right: Text(daysLabel(b.days ?? 1), style: AppText.strong())),
                // 12/10/2026: both hours, which the night fee line below refers to.
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: _StayTile(key: const Key('payment-drop-off'), label: 'manage.drop_off'.tr(), local: b.arrivalAt)),
                      const SizedBox(width: 8),
                      Expanded(child: _StayTile(key: const Key('payment-pick-up'), label: 'manage.pick_up'.tr(), local: b.returnAt)),
                    ],
                  ),
                ),
                RecapRow(
                  left: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(b.customerName, style: AppText.muted(size: 14.5)),
                      Text(formatPhone(b.customerPhone), style: AppText.tabular(size: 14)),
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
                  right: Text(total, style: AppText.strong(size: 17)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (state.secondsLeft != null)
            Semantics(
              label: 'pay.hold_left'.tr(args: [formatCountdown(state.secondsLeft!)]),
              excludeSemantics: true,
              child: Text.rich(
                key: const Key('payment-countdown'),
                TextSpan(
                  style: AppText.muted(size: 14.5),
                  children: [
                    TextSpan(text: 'pay.hold_left'.tr(args: [''])),
                    TextSpan(text: formatCountdown(state.secondsLeft!), style: AppText.tabular(size: 14.5)),
                  ],
                ),
              ),
            ),
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
            busy: state.busy,
            onPressed: () => bloc.add(const PaymentPayPressed()),
          ),
          const SizedBox(height: 8),
          Text(sheet ? 'pay.secure'.tr() : 'pay.secure_web'.tr(), textAlign: TextAlign.center, style: AppText.muted(size: 13)),
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
        decoration: const BoxDecoration(color: AppColors.canvas, borderRadius: AppRadius.field),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label.toUpperCase(), style: AppText.label(size: 11)),
            const SizedBox(height: 2),
            if (p == null)
              Text(local, style: AppText.strong(size: 14))
            else
              Wrap(
                spacing: 6,
                children: [
                  Text(formatDay(p.date), style: AppText.strong(size: 14)),
                  Text(p.time, style: AppText.tabular(size: 14)),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
