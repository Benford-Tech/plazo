import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../booking/data/models/public_booking_model.dart';
import 'booking_actions.dart';

/// Which day of the stay it is today, at the parking.
enum TripDay { dropOff, returnDay, other }

TripDay tripDay(PublicBookingModel b, DateTime now) {
  final today = todayLocal(now);
  if (b.status == 'upcoming' && b.arrivalAt.startsWith(today)) return TripDay.dropOff;
  if (b.returnAt.startsWith(today) && const ['arrived', 'shuttled_out', 'return_requested', 'back_at_parking'].contains(b.status)) return TripDay.returnDay;
  return TripDay.other;
}

/// "Dans 3 semaines", "Dans 5 jours", "Demain" (peach badge of a booking to come).
String? relativeBadge(PublicBookingModel b, DateTime now) {
  if (b.status != 'upcoming') return null;
  final today = todayLocal(now);
  final arrival = b.arrivalAt.substring(0, 10);
  if (arrival.compareTo(today) <= 0) return null;
  final days = stayDays('${today}T00:00', '${arrival}T00:00') - 1;
  if (days == 1) return 'trips.tomorrow'.tr();
  if (days >= 14) return 'trips.in_weeks'.tr(args: ['${days ~/ 7}']);
  return 'trips.in_days'.tr(args: ['$days']);
}

/// One booking of "Mes réservations" (mockup A5): parking, status, dates, plate; on the day,
/// "Je suis en route" (the arrival block, already built, on the booking's page); then the actions.
class TripCard extends StatelessWidget {
  const TripCard({super.key, required this.booking, required this.now});

  final PublicBookingModel booking;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final day = tripDay(b, now);
    final relative = relativeBadge(b, now);
    final a = parseLocal(b.arrivalAt)!, r = parseLocal(b.returnAt)!;
    final dates = day == TripDay.dropOff
        ? '${'trips.drop_today'.tr(args: [a.time])} · ${'booking.return'.tr()} ${formatDay(r.date)} ${r.time}'
        : 'trips.dates'.tr(args: ['${formatDay(a.date)} ${a.time}', '${formatDay(r.date)} ${r.time}']);
    final highlighted = day != TripDay.other;
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: highlighted ? AppColors.accent : AppColors.line, width: highlighted ? 2 : 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        key: Key('trip-${b.reference}'),
        onTap: () => context.router.push(MyBookingRoute(reference: b.reference)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(child: Text(b.parking.title, style: AppText.strong(size: 15))),
                  const SizedBox(width: 8),
                  if (relative != null)
                    StatusBadge(text: relative, tone: BadgeTone.peach)
                  else
                    StatusBadge.status(b.status, paid: b.payment?.status == 'paid'),
                ],
              ),
              const SizedBox(height: 4),
              Text(dates, style: AppText.muted()),
              const SizedBox(height: 8),
              Align(alignment: Alignment.centerLeft, child: FrenchPlate(b.plate, size: 13)),
              if (b.status == 'pending_payment') ...[
                const SizedBox(height: 10),
                GradientButton(
                  key: Key('trip-pay-${b.reference}'),
                  label: 'trips.finish_payment'.tr(),
                  onPressed: () => context.router.push(PaymentRoute(reference: b.reference)),
                ),
              ] else if (day != TripDay.other) ...[
                const SizedBox(height: 10),
                GradientButton(
                  key: Key('trip-on-my-way-${b.reference}'),
                  icon: day == TripDay.dropOff ? Icons.near_me_rounded : Icons.flight_land_rounded,
                  label: day == TripDay.dropOff ? 'trips.on_my_way'.tr() : 'trips.your_return'.tr(),
                  onPressed: () => context.router.push(MyBookingRoute(reference: b.reference)),
                ),
              ],
              const SizedBox(height: 2),
              BookingActions(booking: b),
              if (b.status != 'pending_payment' && !b.canEditFlight && !b.active) const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
