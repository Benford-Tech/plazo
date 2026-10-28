import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/formatters.dart';
import '../../../../shared/theme/theme.dart';

/// One line to move the planning through the days (direction A of 27/10/2026, in place of the week
/// strip and the title: the header took 590 px before the first booking): « ‹ MAR. 27 OCT. › »,
/// an « Aujourd'hui » pill (a button when another day is shown), a calendar icon for a date further away.
class PlanningDateBar extends StatelessWidget {
  const PlanningDateBar({super.key, required this.selected, required this.today, required this.onSelected, this.onForecast});

  final DateTime selected;
  final DateTime today;

  /// Called with the chosen day; null stands for today.
  final ValueChanged<DateTime?> onSelected;

  /// « Planning prévisionnel » (28/10/2026): opens the calendar of the coming weeks; no button when null.
  final VoidCallback? onForecast;

  static DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);
  static bool _same(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  Widget build(BuildContext context) {
    final sel = _day(selected);
    final isToday = _same(sel, today);
    return Container(
      key: const Key('date-bar'),
      color: AppColors.canvas,
      padding: const EdgeInsets.fromLTRB(4, 2, 4, 2),
      child: Row(
        children: [
          _Arrow(
            key: const Key('date-prev-day'),
            icon: Icons.chevron_left_rounded,
            tooltip: 'pro.prev_day'.tr(),
            onTap: () => onSelected(sel.subtract(const Duration(days: 1))),
          ),
          // Takes what the pill and the arrows leave, scaled down rather than overflowing on a narrow phone.
          Expanded(
            child: InkWell(
              key: const Key('date-pick'),
              borderRadius: AppRadius.chip,
              onTap: () => _pick(context, sel),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    planningDay(sel),
                    key: const Key('planning-date'),
                    style: AppText.label(size: 14, color: AppColors.dark).copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ),
          ),
          _Arrow(
            key: const Key('date-next-day'),
            icon: Icons.chevron_right_rounded,
            tooltip: 'pro.next_day'.tr(),
            onTap: () => onSelected(sel.add(const Duration(days: 1))),
          ),
          if (isToday)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: const BoxDecoration(color: AppColors.action, borderRadius: AppRadius.pill),
              child: Text('pro.back_to_today'.tr(), style: AppText.strong(size: 12, color: AppColors.onAccent)),
            )
          else
            TextButton(
              key: const Key('today-back'),
              onPressed: () => onSelected(null),
              style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
              child: Text('pro.back_to_today'.tr(), style: AppText.strong(size: 13, color: AppColors.accent)),
            ),
          _Arrow(
            key: const Key('date-calendar'),
            icon: Icons.calendar_month_rounded,
            tooltip: 'pro.pick_date'.tr(),
            color: AppColors.accent,
            onTap: () => _pick(context, sel),
          ),
          if (onForecast != null)
            _Arrow(
              key: const Key('date-forecast'),
              icon: Icons.calendar_view_month_rounded,
              tooltip: 'forecast.open'.tr(),
              color: AppColors.accent,
              onTap: onForecast!,
            ),
        ],
      ),
    );
  }

  Future<void> _pick(BuildContext context, DateTime sel) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: sel,
      firstDate: DateTime(today.year - 1),
      lastDate: DateTime(today.year + 2),
      locale: const Locale('fr'),
    );
    if (picked != null) onSelected(_same(picked, today) ? null : picked);
  }
}

class _Arrow extends StatelessWidget {
  const _Arrow({super.key, required this.icon, required this.tooltip, required this.onTap, this.color = AppColors.muted});
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: tooltip,
    visualDensity: VisualDensity.compact,
    padding: EdgeInsets.zero,
    constraints: const BoxConstraints(minWidth: 36, minHeight: 40),
    icon: Icon(icon, color: color, size: 24),
    onPressed: onTap,
  );
}
