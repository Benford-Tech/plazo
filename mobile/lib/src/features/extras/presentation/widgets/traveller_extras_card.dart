import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/helpers/money.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/models/extras_models.dart';
import '../bloc/traveller_extras_bloc.dart';
import 'extra_widgets.dart';

/// The booking statuses where the traveller may see their services (ordered or to order).
bool travellerExtrasRelevant(String status) =>
    const ['upcoming', 'arrived', 'shuttled_out', 'return_requested', 'back_at_parking', 'returned'].contains(status);

/// Plazo, « Ma réservation »: « Services additionnels » (21/10/2026, direction A). Hidden when the parking offers
/// nothing and nothing was ordered.
class TravellerExtrasCard extends StatelessWidget {
  const TravellerExtrasCard({super.key, required this.reference});
  final String reference;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(create: (_) => locator<TravellerExtrasBloc>()..add(TravellerExtrasStarted(reference)), child: const TravellerExtrasView());
  }
}

class TravellerExtrasView extends StatelessWidget {
  const TravellerExtrasView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<TravellerExtrasBloc, TravellerExtrasState>(
      listenWhen: (a, b) => (b.notice != null && a.notice != b.notice) || (b.errorCode != null && a.errorCode != b.errorCode),
      listener: (context, state) {
        final text = state.errorCode != null
            ? 'extras.errors.${state.errorCode}'.tr() == 'extras.errors.${state.errorCode}'
                  ? translateErrorCode(state.errorCode)
                  : 'extras.errors.${state.errorCode}'.tr()
            : state.notice == 'failed' && state.message != null
            ? state.message!
            : 'extras.notice.${state.notice}'.tr();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
        context.read<TravellerExtrasBloc>().add(const TravellerExtrasNoticeShown());
      },
      builder: (context, state) {
        final data = state.data;
        if (data == null || data.empty) return const SizedBox.shrink();
        final shownOffers = data.offers.where((o) => data.activeOrder(o.kind) == null).toList();
        final standing = data.orders.where((o) => o.status != 'expired').toList();
        return Padding(
          padding: const EdgeInsets.only(top: 12),
          child: AppCard(
            key: const Key('traveller-extras'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('extras.title'.tr(), style: AppText.strong(size: 16)),
                const SizedBox(height: 2),
                Text('extras.intro'.tr(), style: AppText.muted(size: 12.5)),
                for (final order in standing) ...[const SizedBox(height: 12), _OrderRow(order: order)],
                for (final offer in shownOffers) ...[
                  const SizedBox(height: 12),
                  _OfferRow(offer: offer, busy: state.busyKind == offer.kind, disabled: state.busy),
                ],
                if (data.canOrder && data.orderUntil != null) ...[
                  const SizedBox(height: 12),
                  Text('extras.order_until'.tr(args: [extraWhen(data.orderUntil!)]), style: AppText.muted(size: 12)),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _OrderRow extends StatelessWidget {
  const _OrderRow({required this.order});
  final ExtraOrderModel order;

  @override
  Widget build(BuildContext context) {
    final detail = switch (order.status) {
      'done' when order.doneAt != null => 'extras.done_at'.tr(args: [extraWhen(order.doneAt!)]),
      'refused' || 'refunded' => 'extras.refunded_line'.tr(args: [formatEuros(order.priceCents)]),
      _ =>
        order.withBooking
            ? 'extras.paid_with_booking'.tr(args: [formatEuros(order.priceCents)])
            : 'extras.paid'.tr(args: [formatEuros(order.priceCents)]),
    };
    return Row(
      key: Key('extra-order-${order.kind}'),
      children: [
        ExtraIconTile(order.kind),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(order.label, style: AppText.strong(size: 14)),
              Text(detail, style: AppText.muted(size: 12)),
            ],
          ),
        ),
        const SizedBox(width: 8),
        ExtraStatusPill(order),
      ],
    );
  }
}

class _OfferRow extends StatelessWidget {
  const _OfferRow({required this.offer, required this.busy, required this.disabled});
  final ExtraOfferModel offer;
  final bool busy;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final reason = offer.available ? null : 'extras.reason.${offer.reason ?? 'closed'}'.tr();
    return Row(
      key: Key('extra-offer-${offer.kind}'),
      children: [
        ExtraIconTile(offer.kind),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(offer.label, style: AppText.strong(size: 14)),
              Text(reason ?? offer.description, style: AppText.muted(size: 12)),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(formatEuros(offer.priceCents), style: AppText.strong(size: 14)),
            const SizedBox(height: 4),
            SizedBox(
              height: 32,
              child: OutlinedButton(
                key: Key('extra-add-${offer.kind}'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  side: BorderSide(color: offer.available ? AppColors.brownOrInk : AppColors.line, width: 1.5),
                  shape: const StadiumBorder(),
                ),
                onPressed: !offer.available || disabled ? null : () => _confirm(context, offer),
                child: busy
                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent))
                    : Text('extras.add'.tr(), style: AppText.strong(size: 12.5, color: offer.available ? AppColors.brownOrInk : AppColors.muted)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _confirm(BuildContext context, ExtraOfferModel offer) async {
    final bloc = context.read<TravellerExtrasBloc>();
    final pay = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (sheet) => ExtraRecapSheet(offer: offer),
    );
    if (pay == true) bloc.add(TravellerExtraOrdered(offer.kind));
  }
}

/// The recap before paying: one line, the total, the refund promise, « Payer 50,00 € ».
class ExtraRecapSheet extends StatelessWidget {
  const ExtraRecapSheet({super.key, required this.offer});
  final ExtraOfferModel offer;

  @override
  Widget build(BuildContext context) {
    final price = formatEuros(offer.priceCents);
    return Padding(
      // Edge-to-edge: the button stays above the navigation bar.
      padding: EdgeInsets.fromLTRB(18, 18, 18, 18 + MediaQuery.paddingOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              ExtraIconTile(offer.kind, size: 40),
              const SizedBox(width: 12),
              Expanded(child: Text(offer.label, style: AppText.strong(size: 17))),
            ],
          ),
          const SizedBox(height: 8),
          Text('extras.sheet_intro'.tr(args: [offer.description]), style: AppText.muted(size: 13)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: Text(offer.label, style: AppText.body(size: 14))),
              Text(price, style: AppText.body(size: 14)),
            ],
          ),
          const Divider(height: 20),
          Row(
            children: [
              Expanded(child: Text('extras.pay_now'.tr(), style: AppText.strong(size: 15))),
              Text(price, style: AppText.strong(size: 15)),
            ],
          ),
          const SizedBox(height: 10),
          Text('extras.refund_promise'.tr(), style: AppText.muted(size: 12.5)),
          const SizedBox(height: 14),
          GradientButton(
            key: const Key('extra-pay'),
            label: 'extras.pay'.tr(args: [price]),
            onPressed: () => Navigator.of(context).pop(true),
          ),
        ],
      ),
    );
  }
}
