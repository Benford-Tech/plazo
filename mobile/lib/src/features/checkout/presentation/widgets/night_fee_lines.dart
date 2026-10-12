import 'package:flutter/material.dart';

import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/night_fees.dart';
import '../../../../shared/theme/theme.dart';
import '../../../search/data/models/public_models.dart';
import 'booking_steps.dart';

/// The price detail above a stay's total (direction B, 12/10/2026, « Dans le détail du prix seulement »): « Forfait
/// 8 jours » (the price grid's part) and « Frais de nuit · dépôt à 23:30 », only when the stay pays a night fee; nothing
/// otherwise. Shared by the booking form's recap and the payment step, so both add up the same way.
class NightFeeLines extends StatelessWidget {
  const NightFeeLines({
    super.key,
    required this.days,
    required this.priceCents,
    this.basePriceCents,
    this.nightFee,
    required this.arrivalAt,
    required this.returnAt,
    this.size = 14.5,
  });

  final int days;

  /// The total, night fees included.
  final int priceCents;
  final int? basePriceCents;
  final NightFeeModel? nightFee;

  /// Booked local times "YYYY-MM-DDTHH:mm", for the hours of the night fee line.
  final String arrivalAt;
  final String returnAt;
  final double size;

  /// True when there is a detail to show (the stay pays a night fee).
  static bool shows(NightFeeModel? fee) => chargedNightFee(fee) != null;

  @override
  Widget build(BuildContext context) {
    final fee = chargedNightFee(nightFee);
    if (fee == null) return const SizedBox.shrink();
    final base = basePriceOf(priceCents: priceCents, basePriceCents: basePriceCents, nightFee: fee) ?? priceCents;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RecapRow(
          key: const Key('price-package'),
          left: Text(packageLabel(days), style: AppText.muted(size: size)),
          right: Text(formatEuros(base), style: AppText.strong(size: size)),
        ),
        RecapRow(
          key: const Key('price-night-fee'),
          left: Text(nightFeeLabel(fee, arrivalAt: arrivalAt, returnAt: returnAt)!, style: AppText.muted(size: size)),
          right: Text(formatEuros(fee.totalCents), style: AppText.strong(size: size)),
        ),
      ],
    );
  }
}
