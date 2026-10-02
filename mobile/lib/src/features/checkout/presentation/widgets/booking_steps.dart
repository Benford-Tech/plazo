import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../shared/widgets/segmented.dart';

/// "1 · Vos informations" / "2 · Paiement" (paid online only): where the traveller is.
class BookingSteps extends StatelessWidget {
  const BookingSteps({super.key, required this.current});

  final int current;

  @override
  Widget build(BuildContext context) {
    final labels = ['book.step_details'.tr(), 'book.step_payment'.tr()];
    return Semantics(
      label: 'book.steps_a11y'.tr(args: ['$current', labels[current - 1]]),
      excludeSemantics: true,
      child: Segmented<int>(values: const [1, 2], labels: labels, selected: current, onChanged: null),
    );
  }
}

/// A row of the recap: label on the left, value on the right.
class RecapRow extends StatelessWidget {
  const RecapRow({super.key, required this.left, required this.right});

  final Widget left;
  final Widget right;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(child: left),
        const SizedBox(width: 12),
        right,
      ],
    ),
  );
}
