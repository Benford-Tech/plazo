import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../shared/theme/theme.dart';
import '../../data/models/extras_models.dart';

/// The service's icon: a drop for the wash, a plug for the hybrid, a bolt for the electric car.
IconData extraIcon(String kind) => switch (kind) {
  'interior_wash' => Icons.water_drop_rounded,
  'hybrid_charge' => Icons.power_rounded,
  'ev_charge' => Icons.bolt_rounded,
  _ => Icons.local_car_wash_rounded,
};

/// The icon on its soft tile (peach in Plazo, pale green in Plazo Pro).
class ExtraIconTile extends StatelessWidget {
  const ExtraIconTile(this.kind, {super.key, this.size = 36});
  final String kind;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: AppColors.tint, borderRadius: BorderRadius.circular(size / 3)),
    alignment: Alignment.center,
    child: Icon(extraIcon(kind), size: size * 0.55, color: AppColors.accent),
  );
}

/// The order's state as a pill: « Commandé » / « À faire » (indigo or amber), « Fait » (green), « Remboursé » (grey).
class ExtraStatusPill extends StatelessWidget {
  const ExtraStatusPill(this.order, {super.key, this.staff = false});
  final ExtraOrderModel order;
  final bool staff;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, key) = switch (order.status) {
      'ordered' =>
        staff ? (AppStatus.warnSoft, AppStatus.warnText, 'extras.status.to_do') : (AppStatus.infoSoft, AppStatus.info, 'extras.status.ordered'),
      'done' => (AppStatus.okSoft, AppStatus.okText, 'extras.status.done'),
      'refused' => (AppColors.panel2, AppColors.muted, 'extras.status.refused'),
      _ => (AppColors.panel2, AppColors.muted, 'extras.status.refunded'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.pill),
      child: Text(key.tr(), style: AppText.body(size: 11.5, weight: 700, color: fg)),
    );
  }
}

/// "12 oct. à 15:12" in the device's zone.
String extraWhen(DateTime at) => DateFormat("d MMM 'à' HH:mm", 'fr').format(at.toLocal());
