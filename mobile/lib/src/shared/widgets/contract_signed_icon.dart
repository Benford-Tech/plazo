import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/helpers/formatters.dart';
import '../theme/theme.dart';

/// 15/11/2026 (« avoir une indication des contrats déjà signés sur la réservation et sur le planning », choix C): a small
/// green signed-document icon beside the traveller's name; a long press says when. Nothing while it is not signed.
class ContractSignedIcon extends StatelessWidget {
  const ContractSignedIcon({super.key, required this.signedAt, this.size = 16});
  final DateTime? signedAt;
  final double size;

  @override
  Widget build(BuildContext context) {
    final at = signedAt;
    if (at == null) return const SizedBox.shrink();
    final label = '${'pro.contract_signed'.tr()} · ${DateFormat(withTime('d MMM'), appLocale).format(at.toLocal())}';
    return Tooltip(
      message: label,
      child: Semantics(
        label: label,
        child: Icon(Icons.assignment_turned_in_rounded, size: size, color: AppColors.accent),
      ),
    );
  }
}
