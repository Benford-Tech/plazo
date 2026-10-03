import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// Discreet "Démo" tag next to the title of a fictional parking of the demo data.
class DemoTag extends StatelessWidget {
  const DemoTag({super.key});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'results.demo_hint'.tr(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(border: Border.all(color: AppColors.line), borderRadius: BorderRadius.circular(6)),
        child: Text('results.demo'.tr().toUpperCase(), style: AppText.body(size: 10.5, weight: 600, color: AppColors.muted)),
      ),
    );
  }
}
