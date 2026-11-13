import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../shared/theme/theme.dart';
import '../../data/models/public_booking_model.dart';

/// « Ma réservation », mix of A and C (13/11/2026, « Mix A et C »): the booking as a boarding-pass ticket. Parking
/// on top, the drop-off and return times in large type, then a dashed tear line with the plate, the passengers, the
/// flights and the reference.
class BookingCard extends StatelessWidget {
  const BookingCard({super.key, required this.booking, required this.returnDay});

  final PublicBookingModel booking;

  /// The return is what matters today: its side is lit.
  final bool returnDay;

  @override
  Widget build(BuildContext context) {
    final b = booking;
    const light = Color(0xFFFFFFFF);
    final soft = light.withValues(alpha: 0.72);
    final nights = stayDays(b.arrivalAt.substring(0, 16), b.returnAt.substring(0, 16));
    Widget end(String label, String at, {required bool lit, CrossAxisAlignment align = CrossAxisAlignment.start}) => Column(
      crossAxisAlignment: align,
      children: [
        Text(label.toUpperCase(), style: AppText.label(size: 11, color: lit ? AppColors.accentLight : soft)),
        Text(localTime(at), style: AppText.big(size: 30, color: light)),
        Text(localDay(at), style: AppText.body(size: 13, color: soft)),
      ],
    );
    return Container(
      key: const Key('booking-ticket'),
      clipBehavior: Clip.antiAlias,
      decoration: const BoxDecoration(color: AppColors.dark, borderRadius: AppRadius.card),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(b.parking.title, style: AppText.strong(size: 16, color: light)),
                if (b.parking.address != null) Text(b.parking.address!, style: AppText.body(size: 12.5, color: soft)),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(child: end('booking.drop'.tr(), b.arrivalAt, lit: !returnDay)),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 22),
                      child: Text('— ${'booking.days'.plural(nights)} —', style: AppText.body(size: 12, color: soft)),
                    ),
                    Expanded(child: end('booking.return'.tr(), b.returnAt, lit: returnDay, align: CrossAxisAlignment.end)),
                  ],
                ),
              ],
            ),
          ),
          const _TearLine(),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 14),
            child: Wrap(
              spacing: 10,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                if (b.plate.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: const BoxDecoration(color: light, borderRadius: AppRadius.small),
                    child: Text(b.plate, style: AppText.tabular(size: 14, weight: 800, color: AppColors.dark)),
                  ),
                if (b.vehicle?.model != null || b.vehicle?.colour != null)
                  Text([b.vehicle?.model, b.vehicle?.colour].whereType<String>().join(' · '), key: const Key('booking-vehicle'), style: AppText.body(size: 13, color: soft)),
                Text('booking.pax'.tr(args: ['${b.passengers}']), style: AppText.body(size: 13, color: soft)),
                if (b.departureFlight != null)
                  Text(
                    b.outbound?.shuttleAt != null
                        ? 'booking.outbound_shuttle'.tr(args: [b.departureFlight!, b.outbound!.shuttleAt!.substring(11, 16)])
                        : 'booking.outbound'.tr(args: [b.departureFlight!]),
                    style: AppText.body(size: 13, color: soft),
                  ),
                if (b.returnFlight != null) Text('booking.flight'.tr(args: [b.returnFlight!]), style: AppText.body(size: 13, color: soft)),
                Text('booking.reference'.tr(args: [b.reference]), style: AppText.tabular(size: 13, color: light)),
              ],
            ),
          ),
          if (b.customerNote != null && b.customerNote!.trim().isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 14),
              child: Text('${'manage.message'.tr()} : « ${b.customerNote!.trim()} »', key: const Key('booking-message'), style: AppText.body(size: 12.5, color: soft)),
            ),
        ],
      ),
    );
  }
}

/// The dashed tear line of the ticket.
class _TearLine extends StatelessWidget {
  const _TearLine();

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, c) {
      final n = (c.maxWidth / 10).floor();
      return Row(
        children: [
          for (var i = 0; i < n; i++)
            Expanded(child: Container(height: 1.5, margin: const EdgeInsets.symmetric(horizontal: 2.5), color: const Color(0x40FFFFFF))),
        ],
      );
    },
  );
}
