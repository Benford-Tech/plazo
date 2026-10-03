import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/stay.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/icon_tile.dart';

/// The single "VOS DATES" pill (drop-off → return), opening the date sheet.
class DatesPill extends StatelessWidget {
  const DatesPill({super.key, required this.arrivalAt, required this.returnAt, required this.onTap, this.errorText});

  final String arrivalAt;
  final String returnAt;
  final VoidCallback onTap;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final a = parseLocal(arrivalAt), r = parseLocal(returnAt);
    final short = a != null && r != null ? formatStayDates(a.date, r.date) : null;
    final spoken = a != null && r != null
        ? 'search.dates_a11y'.tr(args: ['${formatDayLong(a.date)} ${a.time}', '${formatDayLong(r.date)} ${r.time}'])
        : 'search.choose_dates'.tr();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          button: true,
          label: spoken,
          excludeSemantics: true,
          child: InkWell(
            key: const Key('dates-pill'),
            borderRadius: BorderRadius.circular(14),
            onTap: onTap,
            child: Container(
              constraints: const BoxConstraints(minHeight: 56),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: errorText != null ? AppColors.danger : AppColors.line),
              ),
              child: Row(
                children: [
                  const IconTile(Icons.calendar_month_rounded, size: 36),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('search.your_dates'.tr().toUpperCase(), style: AppText.label(size: 10.5)),
                        const SizedBox(height: 2),
                        if (short == null)
                          Text('search.choose_dates'.tr(), style: AppText.strong(size: 14.5))
                        else
                          Text.rich(
                            TextSpan(
                              children: [
                                TextSpan(text: short.start, style: AppText.strong(size: 14.5)),
                                TextSpan(text: ' ${a!.time}', style: AppText.body(size: 12.5, weight: 500, color: AppColors.muted)),
                                TextSpan(text: '  →  ', style: AppText.body(size: 13, color: AppColors.muted)),
                                TextSpan(text: short.end, style: AppText.strong(size: 14.5)),
                                TextSpan(text: ' ${r!.time}', style: AppText.body(size: 12.5, weight: 500, color: AppColors.muted)),
                              ],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(errorText!, style: AppText.body(size: 13, color: AppColors.danger)),
          ),
      ],
    );
  }
}
