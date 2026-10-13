import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/money.dart';
import '../../../../shared/theme/theme.dart';
import '../../data/models/revenue_models.dart';
import '../../domain/revenue_period.dart';

/// The days still to come: bookings already taken (pale), P-B's mockup.
const _future = Color(0xFFC9D8C6);
const _chartHeight = 120.0;

/// P-B (13/10/2026): one bar per day of the period, to scale (the best day is full height); today in lime, the days
/// before in dark green, the days after pale. Touch or slide on the chart to read a day; until then the line under it
/// gives the best day.
class RevenueChart extends StatefulWidget {
  const RevenueChart({super.key, required this.days, required this.today, this.futureLegend = true});

  final List<RevenueDayModel> days;
  final String today;

  /// « Barres claires… »: only when counting by arrival and a day still to come has an amount.
  final bool futureLegend;

  @override
  State<RevenueChart> createState() => _RevenueChartState();
}

class _RevenueChartState extends State<RevenueChart> {
  int? _selected;

  @override
  void didUpdateWidget(RevenueChart old) {
    super.didUpdateWidget(old);
    if (old.days.length != widget.days.length || old.days.firstOrNull?.date != widget.days.firstOrNull?.date) _selected = null;
  }

  /// The day a screen reader's swipe up (+1) or down (-1) moves to, from the one read (else today, else an end).
  int _indexAfter(int delta) {
    final n = widget.days.length;
    final todayIndex = widget.days.indexWhere((d) => d.date == widget.today);
    final from = _selected ?? (todayIndex >= 0 ? todayIndex : (delta > 0 ? -1 : n));
    return (from + delta).clamp(0, n - 1);
  }

  void _step(int delta) {
    if (widget.days.isEmpty) return;
    setState(() => _selected = _indexAfter(delta));
  }

  void _pick(double dx, double width) {
    final n = widget.days.length;
    if (n == 0 || width <= 0) return;
    final i = (dx / width * n).floor().clamp(0, n - 1);
    if (i != _selected) setState(() => _selected = i);
  }

  static String _dayName(String date) => DateFormat('EEE d MMM', 'fr_FR').format(parseDay(date));

  String _line(RevenueDayModel day) => 'revenue.chart_day'.tr(
    args: [
      _dayName(day.date),
      'revenue.bookings_count'.tr(args: ['${day.count}']),
      formatEuros(day.totalCents),
    ],
  );

  @override
  Widget build(BuildContext context) {
    final days = widget.days;
    final max = days.fold<int>(0, (m, d) => math.max(m, d.totalCents));
    final best = max == 0 ? null : days.firstWhere((d) => d.totalCents == max);
    final selected = _selected == null || _selected! >= days.length ? null : days[_selected!];
    final caption = selected != null
        ? _line(selected)
        : best == null
        ? 'revenue.chart_empty'.tr()
        : 'revenue.chart_best'.tr(args: [_dayName(best.date), formatEuros(best.totalCents)]);
    final hasFuture = widget.futureLegend && days.any((d) => d.date.compareTo(widget.today) > 0 && d.totalCents > 0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LayoutBuilder(
          builder: (context, box) {
            final width = box.maxWidth;
            final n = days.length;
            final gap = n > 14 ? 3.0 : 8.0;
            return Semantics(
              container: true,
              label: 'revenue.chart_label'.tr(),
              value: caption,
              increasedValue: _line(days[_indexAfter(1)]),
              decreasedValue: _line(days[_indexAfter(-1)]),
              hint: 'revenue.chart_hint'.tr(),
              onIncrease: () => _step(1),
              onDecrease: () => _step(-1),
              child: ExcludeSemantics(
                child: GestureDetector(
                  key: const Key('revenue-chart'),
                  behavior: HitTestBehavior.opaque,
                  onTapDown: (d) => _pick(d.localPosition.dx, width),
                  onHorizontalDragUpdate: (d) => _pick(d.localPosition.dx, width),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(
                        height: _chartHeight,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            for (final (i, d) in days.indexed)
                              Expanded(
                                child: Padding(
                                  padding: EdgeInsets.symmetric(horizontal: gap / 2),
                                  child: _Bar(
                                    height: max == 0 ? 0 : _chartHeight * d.totalCents / max,
                                    color: i == _selected
                                        ? AppColors.onAccent
                                        : d.date == widget.today
                                        ? AppColors.action
                                        : d.date.compareTo(widget.today) > 0
                                        ? _future
                                        : AppColors.accent,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      Container(height: 1, color: AppColors.line),
                      const SizedBox(height: 4),
                      _Axis(days: days, today: widget.today, width: width),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 8),
        // Read through the chart's value: not twice.
        ExcludeSemantics(
          child: Text(caption, key: const Key('revenue-chart-caption'), style: AppText.body(size: 13, weight: 600)),
        ),
        if (hasFuture) ...[const SizedBox(height: 4), Text('revenue.chart_future'.tr(), style: AppText.muted(size: 12.5))],
      ],
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.height, required this.color});
  final double height;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    // A day with an amount always shows a sliver.
    height: height <= 0 ? 0 : math.max(2, height),
    decoration: BoxDecoration(
      color: color,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(2)),
    ),
  );
}

/// Under a week: every day (« lun. » over « 6 »). Over a week: the first day, today and the last, each under its bar.
class _Axis extends StatelessWidget {
  const _Axis({required this.days, required this.today, required this.width});
  final List<RevenueDayModel> days;
  final String today;
  final double width;

  @override
  Widget build(BuildContext context) {
    final n = days.length;
    final style = AppText.tabular(size: 10.5, weight: 500, color: AppColors.muted);
    final todayStyle = AppText.tabular(size: 10.5, weight: 700, color: AppColors.accent);
    if (n <= 7) {
      return Row(
        children: [
          for (final d in days)
            Expanded(
              child: Text(
                '${DateFormat('EEE', 'fr_FR').format(parseDay(d.date))}\n${parseDay(d.date).day}',
                textAlign: TextAlign.center,
                style: d.date == today ? todayStyle : style,
              ),
            ),
        ],
      );
    }
    final todayIndex = days.indexWhere((d) => d.date == today);
    const labelWidth = 96.0;
    final todayText = 'revenue.chart_today'.tr(args: ['${parseDay(today).day}']);
    // Where today's label really lands (centred, or held against an edge), from its measured width: the first and
    // last dates show only where they do not meet it.
    final painter = TextPainter(
      text: TextSpan(text: todayText, style: todayStyle),
      textDirection: ui.TextDirection.ltr,
      textScaler: MediaQuery.textScalerOf(context),
      maxLines: 1,
    )..layout(maxWidth: labelWidth);
    final todayWidth = painter.width;
    painter.dispose();
    final centre = (todayIndex + 0.5) * width / n;
    final todayStart = (centre - todayWidth / 2).clamp(0.0, math.max(0.0, width - todayWidth));
    final todayEnd = todayStart + todayWidth;
    const edgeLabel = 24.0; // room for « 31 » and a gap
    final marks = <(int, String, TextStyle)>[
      if (todayIndex < 0 || todayStart > edgeLabel) (0, '${parseDay(days.first.date).day}', style),
      if (todayIndex >= 0) (todayIndex, todayText, todayStyle),
      if (todayIndex < 0 || todayEnd < width - edgeLabel) (n - 1, '${parseDay(days.last.date).day}', style),
    ];
    return SizedBox(
      height: 16,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          for (final (i, text, s) in marks)
            () {
              // Centred under its bar, or held against the edge it would cross.
              final left = (i + 0.5) * width / n - labelWidth / 2;
              final align = left < 0 ? TextAlign.left : (left > width - labelWidth ? TextAlign.right : TextAlign.center);
              return Positioned(
                left: left.clamp(0, math.max(0, width - labelWidth)).toDouble(),
                width: labelWidth,
                child: Text(text, style: s, maxLines: 1, textAlign: align),
              );
            }(),
        ],
      ),
    );
  }
}
