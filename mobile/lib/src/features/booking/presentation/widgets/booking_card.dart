import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/formatters.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../data/models/public_booking_model.dart';

/// "Parking Démo LYS · 08:00" and its address, as in the approved frame 1.
class BookingCard extends StatelessWidget {
  const BookingCard({super.key, required this.booking, required this.returnDay});

  final PublicBookingModel booking;

  /// The return is what matters today: its time goes in the title.
  final bool returnDay;

  @override
  Widget build(BuildContext context) {
    final time = localTime(returnDay ? booking.returnAt : booking.arrivalAt);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('booking.parking_at'.tr(args: [booking.parking.title, time]), style: AppText.strong()),
          if (booking.parking.address != null) ...[
            const SizedBox(height: 4),
            Text(booking.parking.address!, style: AppText.muted()),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              FrenchPlate(booking.plate),
              Text('booking.pax'.tr(args: ['${booking.passengers}']), style: AppText.muted()),
              if (booking.returnFlight != null) Text('booking.flight'.tr(args: [booking.returnFlight!]), style: AppText.muted()),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${'booking.drop'.tr()} ${'booking.date_at'.tr(args: [localDay(booking.arrivalAt), localTime(booking.arrivalAt)])} · '
            '${'booking.return'.tr()} ${'booking.date_at'.tr(args: [localDay(booking.returnAt), localTime(booking.returnAt)])}',
            style: AppText.muted(size: 12.5),
          ),
          Text('booking.reference'.tr(args: [booking.reference]), style: AppText.muted(size: 12.5)),
        ],
      ),
    );
  }
}
