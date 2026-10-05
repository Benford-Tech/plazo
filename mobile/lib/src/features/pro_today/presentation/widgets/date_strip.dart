import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../shared/theme/theme.dart';

/// A week of days to move the planning through (the reference strip of 04/10/2026, in direction B):
/// Monday to Sunday around [selected], arrows for the previous and next week, a calendar icon for a
/// date further away. Today is marked, the selected day is highlighted.
class DateStrip extends StatelessWidget {
  const DateStrip({super.key, required this.selected, required this.today, required this.onSelected});

  final DateTime selected;
  final DateTime today;
  final ValueChanged<DateTime> onSelected;

  static DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);
  static bool _same(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  Widget build(BuildContext context) {
    final sel = _day(selected);
    final monday = sel.subtract(Duration(days: sel.weekday - 1));
    final days = [for (var i = 0; i < 7; i++) monday.add(Duration(days: i))];
    final weekdayFmt = DateFormat('EEE', 'fr_FR');
    final monthFmt = DateFormat('MMM', 'fr_FR');
    return Row(
      key: const Key('date-strip'),
      children: [
        _Arrow(
          key: const Key('date-prev-week'),
          icon: Icons.chevron_left_rounded,
          tooltip: 'pro.prev_week'.tr(),
          onTap: () => onSelected(sel.subtract(const Duration(days: 7))),
        ),
        for (final d in days)
          Expanded(
            child: _Day(
              key: Key('date-${d.year}-${d.month}-${d.day}'),
              weekday: weekdayFmt.format(d).replaceAll('.', ''),
              number: '${d.day}',
              month: monthFmt.format(d).replaceAll('.', ''),
              selected: _same(d, sel),
              isToday: _same(d, today),
              onTap: () => onSelected(d),
            ),
          ),
        _Arrow(
          key: const Key('date-next-week'),
          icon: Icons.chevron_right_rounded,
          tooltip: 'pro.next_week'.tr(),
          onTap: () => onSelected(sel.add(const Duration(days: 7))),
        ),
        _Arrow(
          key: const Key('date-pick'),
          icon: Icons.calendar_month_rounded,
          tooltip: 'pro.pick_date'.tr(),
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: sel,
              firstDate: DateTime(today.year - 1),
              lastDate: DateTime(today.year + 2),
              locale: const Locale('fr'),
            );
            if (picked != null) onSelected(picked);
          },
        ),
      ],
    );
  }
}

class _Day extends StatelessWidget {
  const _Day({super.key, required this.weekday, required this.number, required this.month, required this.selected, required this.isToday, required this.onTap});
  final String weekday;
  final String number;
  final String month;
  final bool selected;
  final bool isToday;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    // The selected day on the action colour (lime for the pro, orange for travellers); today ringed.
    final color = selected ? AppColors.onAccent : (isToday ? AppColors.accent : AppColors.muted);
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.chip,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.action : null,
          borderRadius: AppRadius.chip,
          border: isToday && !selected ? Border.all(color: AppColors.accent, width: 1.5) : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(weekday, style: AppText.label(size: 10.5, color: color)),
            Text(number, style: AppText.tabular(size: 18, color: color)),
            Text(month, style: AppText.muted(size: 10.5).copyWith(color: color, height: 1.2)),
          ],
        ),
      ),
    );
  }
}

class _Arrow extends StatelessWidget {
  const _Arrow({super.key, required this.icon, required this.tooltip, required this.onTap});
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: tooltip,
    visualDensity: VisualDensity.compact,
    padding: EdgeInsets.zero,
    constraints: const BoxConstraints(minWidth: 32, minHeight: 40),
    icon: Icon(icon, color: AppColors.muted, size: 22),
    onPressed: onTap,
  );
}
