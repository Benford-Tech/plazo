import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../../arrival/presentation/bloc/arrival_bloc.dart';
import '../../../arrival/presentation/widgets/arrival_block.dart';
import '../../../return_day/presentation/bloc/return_bloc.dart';
import '../../../return_day/presentation/widgets/return_block.dart';
import '../../../trips/presentation/bloc/trips_bloc.dart';
import '../../../trips/presentation/widgets/booking_actions.dart';
import '../../data/models/public_booking_model.dart';
import '../bloc/booking_bloc.dart';
import '../widgets/booking_card.dart';

/// A traveller's booking, opened from "Mes réservations", from the link of the confirmation (deep
/// link /ma-reservation/REF?cle=TOKEN, the same as the site's), or right after booking
/// (?confirmee=1: "C'est réservé !"). The day of the stay, the arrival block ("Je suis en route").
@RoutePage()
class MyBookingPage extends StatelessWidget implements AutoRouteWrapper {
  const MyBookingPage({
    super.key,
    @PathParam('reference') required this.reference,
    @QueryParam('cle') this.token,
    @QueryParam('confirmee') this.confirmee,
  });

  final String reference;

  /// The manage token from the link: saved to the secure storage, then dropped from the address.
  final String? token;

  /// "1" right after booking or paying: the confirmation hero.
  final String? confirmee;

  @override
  Widget wrappedRoute(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => locator<BookingBloc>()..add(BookingLinkOpened(reference, token: token))),
        BlocProvider(create: (_) => locator<ArrivalBloc>()),
        BlocProvider(create: (_) => locator<ReturnBloc>()),
      ],
      child: this,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<BookingBloc, BookingState>(
      listenWhen: (a, b) => a.viewState != b.viewState && b.viewState.isSuccess && a.booking == null,
      listener: (context, state) {
        // The token is in the secure storage now: keep it out of the address bar and history.
        if (kIsWeb && token != null) {
          SystemNavigator.routeInformationUpdated(uri: Uri(path: '/ma-reservation/${state.reference}'), replace: true);
        }
        // Opened from a link: the booking joins "Mes réservations".
        if (token != null) locator<TripsBloc>().add(const TripsLoaded(quiet: true));
        if (state.booking?.active ?? false) context.read<ArrivalBloc>().add(ArrivalOpened(state.reference!));
        // The return day (vehicle on site): the flight, the meeting point and the shuttle.
        if (const ['arrived', 'shuttled_out', 'return_requested'].contains(state.booking?.status)) {
          context.read<ReturnBloc>().add(ReturnOpened(state.reference!));
        }
      },
      child: Scaffold(
        appBar: AppBar(
          titleSpacing: NavigationToolbar.kMiddleSpacing,
          title: Text('trips.title'.tr(), style: AppText.strong(size: 16, color: Colors.white)),
          leading: BackButton(
            onPressed: () => context.router.canPop() ? context.router.maybePop() : context.router.replaceAll([const AppShellRoute(children: [TripsTabRoute()])]),
          ),
        ),
        body: SafeArea(
          top: false,
          child: BlocBuilder<BookingBloc, BookingState>(
            builder: (context, booking) {
              if (booking.booking == null) {
                if (booking.viewState.isError) return _Error(message: booking.errorMessage);
                return const Center(child: CircularProgressIndicator(color: AppColors.accent));
              }
              final b = booking.booking!;
              return RefreshIndicator(
                color: AppColors.accent,
                onRefresh: () async {
                  context.read<BookingBloc>().add(const BookingRefreshed());
                  context.read<ArrivalBloc>().add(const ArrivalRefreshRequested());
                  context.read<ReturnBloc>().add(const ReturnRefreshRequested());
                },
                child: BlocBuilder<ArrivalBloc, ArrivalState>(
                  buildWhen: (a, b) => a.openKind != b.openKind,
                  builder: (context, arrival) {
                    final kind = arrival.openKind;
                    final confirmed = confirmee == '1' && b.status == 'upcoming';
                    final title = switch (kind) {
                      ArrivalKind.outbound => 'booking.title_drop_today'.tr(),
                      ArrivalKind.returnTrip => 'booking.title_return_today'.tr(),
                      null => 'booking.title_default'.tr(),
                    };
                    return ListView(
                      padding: EdgeInsets.zero,
                      children: [
                        if (confirmed) _ConfirmedHero(booking: b),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (!confirmed) ...[
                                Row(
                                  children: [
                                    Expanded(child: Semantics(header: true, child: Text(title, style: AppText.title(size: 24)))),
                                    StatusBadge.status(b.status, paid: b.payment?.status == 'paid'),
                                  ],
                                ),
                                const SizedBox(height: 12),
                              ],
                              if (b.status == 'cancelled') ...[_CancelledBanner(booking: b), const SizedBox(height: 12)],
                              BookingCard(booking: b, returnDay: kind == ArrivalKind.returnTrip),
                              const SizedBox(height: 10),
                              _Payment(booking: b),
                              if (b.status == 'pending_payment') ...[
                                const SizedBox(height: 12),
                                GradientButton(
                                  key: const Key('booking-finish-payment'),
                                  label: 'trips.finish_payment'.tr(),
                                  onPressed: () => context.router.push(PaymentRoute(reference: b.reference)),
                                ),
                              ],
                              const SizedBox(height: 12),
                              // The return day has its own block (R1/R3); the drop-off keeps the arrival block.
                              if (kind == ArrivalKind.returnTrip) const ReturnBlock() else const ArrivalBlock(),
                              const SizedBox(height: 4),
                              BookingActions(booking: b, onChanged: (_) => context.read<BookingBloc>().add(const BookingRefreshed())),
                              if (b.parking.phone != null && b.active) ...[
                                const SizedBox(height: 4),
                                OutlineAction(
                                  icon: Icons.call_rounded,
                                  label: '${'manage.call'.tr()} · ${formatPhone(b.parking.phone!)}',
                                  onPressed: () => locator<LinkService>().open(Uri(scheme: 'tel', path: b.parking.phone!.replaceAll(RegExp(r'[^\d+]'), ''))),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// "C'est réservé, Camille !" with the reference, where the confirmation goes, and the note that
/// the booking is kept on this phone.
class _ConfirmedHero extends StatelessWidget {
  const _ConfirmedHero({required this.booking});
  final PublicBookingModel booking;

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final name = firstName(b.customerName);
    final phone = isFrenchMobile(b.customerPhone) ? formatPhone(b.customerPhone) : null;
    final email = b.customerEmail;
    final text = email != null && phone != null
        ? 'confirmed.text_email_phone'.tr(args: [email, phone])
        : email != null
        ? 'confirmed.text_email'.tr(args: [email])
        : phone != null
        ? 'confirmed.text_phone'.tr(args: [phone])
        : 'confirmed.text_none'.tr();
    return Container(
      key: const Key('booking-confirmed'),
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.brand, AppColors.accent, AppColors.peach]),
      ),
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
            child: const Icon(Icons.check_rounded, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 10),
          Semantics(
            header: true,
            liveRegion: true,
            child: Text(
              name.isEmpty ? 'confirmed.title_no_name'.tr() : 'confirmed.title'.tr(args: [name]),
              style: AppText.title(size: 30, color: Colors.white),
            ),
          ),
          const SizedBox(height: 6),
          Text(text, style: AppText.body(size: 14.5, color: const Color(0xFFF1DFF3), height: 1.4)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                Text('confirmed.reference'.tr(), style: AppText.muted(size: 13)),
                const Spacer(),
                Text(b.reference, style: AppText.tabular(size: 22, weight: 800).copyWith(letterSpacing: 2)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text('confirmed.saved'.tr(), style: AppText.body(size: 13, color: const Color(0xFFF1DFF3))),
        ],
      ),
    );
  }
}

/// Total, how it is paid, and the cancellation terms (the site's recap).
class _Payment extends StatelessWidget {
  const _Payment({required this.booking});
  final PublicBookingModel booking;

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final refunded = b.payment?.status == 'refunded';
    final label = b.status == 'cancelled'
        ? (refunded ? 'manage.refunded'.tr() : 'manage.nothing_to_pay'.tr())
        : (b.active || b.payment?.status == 'paid')
        ? (b.online ? 'manage.paid'.tr() : 'manage.to_pay_on_site'.tr())
        : 'manage.stay_price'.tr();
    final until = b.cancellableUntil == null ? null : formatDateTimeAt(b.cancellableUntil!);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (b.priceCents != null && b.status != 'pending_payment')
          Row(
            children: [
              Expanded(child: Text(label, style: AppText.muted(size: 14.5))),
              Text(
                formatEuros(b.priceCents!),
                style: AppText.strong(size: 16).copyWith(decoration: b.status == 'cancelled' && !refunded ? TextDecoration.lineThrough : null),
              ),
            ],
          ),
        if (b.status == 'upcoming') ...[
          const SizedBox(height: 4),
          Text(
            until == null
                ? 'manage.non_refundable'.tr()
                : b.canCancel
                ? 'manage.free_until'.tr(args: [until])
                : 'manage.cancel_closed'.tr(args: [until]),
            style: AppText.body(size: 13, weight: 600, color: until != null && b.canCancel ? const Color(0xFF1F7A3F) : AppColors.muted),
          ),
        ],
      ],
    );
  }
}

class _CancelledBanner extends StatelessWidget {
  const _CancelledBanner({required this.booking});
  final PublicBookingModel booking;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: const Color(0xFFFCE8E6), borderRadius: BorderRadius.circular(16)),
    child: Text(
      booking.payment?.status == 'refunded' ? 'manage.cancelled_refunded'.tr() : 'manage.cancelled'.tr(),
      style: AppText.body(size: 14.5, weight: 600, color: AppColors.danger),
    ),
  );
}

class _Error extends StatelessWidget {
  const _Error({this.message});
  final String? message;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(message ?? 'errors.generic'.tr(), textAlign: TextAlign.center, style: AppText.body()),
        const SizedBox(height: 16),
        GradientButton(label: 'booking.retry'.tr(), onPressed: () => context.read<BookingBloc>().add(const BookingRefreshed())),
      ],
    ),
  );
}
