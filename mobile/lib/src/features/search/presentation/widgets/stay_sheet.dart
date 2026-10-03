import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/stay.dart';
import '../../../../core/utils/clock.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';

/// Opens the date + time sheet; returns the new stay, or null when closed.
Future<({String arrivalAt, String returnAt})?> showStaySheet(
  BuildContext context, {
  required String? arrivalAt,
  required String? returnAt,
  Clock clock = systemClock,
}) {
  return showModalBottomSheet<({String arrivalAt, String returnAt})>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    barrierColor: const Color(0x731E0A28),
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (_) => StaySheet(arrivalAt: arrivalAt, returnAt: returnAt, clock: clock),
  );
}

/// "Vos dates" (the site's phone sheet): drop-off and return tiles, one month, 30-minute time
/// slots, the billable days count, then "Valider les dates". Days before today at the parking
/// cannot be picked; a return not after the drop-off (or a drop-off in the past) is refused with the
/// API's message.
class StaySheet extends StatefulWidget {
  const StaySheet({super.key, required this.arrivalAt, required this.returnAt, this.clock = systemClock});

  final String? arrivalAt;
  final String? returnAt;
  final Clock clock;

  @override
  State<StaySheet> createState() => _StaySheetState();
}

class _StaySheetState extends State<StaySheet> {
  late RangeDraft _draft;
  late String _startTime;
  late String _endTime;
  late int _year;
  late int _month;
  late final String _minDate;
  String? _error;

  @override
  void initState() {
    super.initState();
    _minDate = todayLocal(widget.clock());
    final a = parseLocal(widget.arrivalAt), r = parseLocal(widget.returnAt);
    _draft = RangeDraft(start: a?.date, end: r?.date);
    _startTime = a?.time ?? '08:00';
    _endTime = r?.time ?? '18:00';
    final focus = a?.date ?? _minDate;
    _year = int.parse(focus.substring(0, 4));
    _month = int.parse(focus.substring(5, 7));
  }

  RangeSide get _side => _draft.picking;

  void _moveMonth(int delta) {
    setState(() {
      final d = DateTime.utc(_year, _month + delta);
      _year = d.year;
      _month = d.month;
    });
  }

  bool get _canGoBack => '$_year-${_month.toString().padLeft(2, '0')}'.compareTo(_minDate.substring(0, 7)) > 0;

  void _confirm() {
    final arrival = '${_draft.start}T$_startTime';
    final ret = '${_draft.end}T$_endTime';
    final errors = validateStay(arrival, ret, widget.clock());
    if (errors.isNotEmpty) {
      setState(() => _error = translateErrorCode(errors['returnAt'] ?? errors['arrivalAt']));
      return;
    }
    Navigator.of(context).pop((arrivalAt: arrival, returnAt: ret));
  }

  @override
  Widget build(BuildContext context) {
    final days = rangeDays(_draft.start, _draft.end);
    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(16, 10, 16, 18 + MediaQuery.viewInsetsOf(context).bottom),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(width: 44, height: 5, decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(3))),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Semantics(header: true, child: Text('picker.title'.tr(), style: AppText.title(size: 22))),
                const Spacer(),
                if (days != null)
                  Semantics(liveRegion: true, child: Text(daysLabel(days), key: const Key('stay-days'), style: AppText.strong(size: 13.5, color: AppColors.accent))),
                IconButton(
                  tooltip: 'common.close'.tr(),
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded, color: AppColors.muted),
                ),
              ],
            ),
            Row(
              children: [
                Expanded(child: _tile(RangeSide.start)),
                const SizedBox(width: 8),
                Expanded(child: _tile(RangeSide.end)),
              ],
            ),
            const SizedBox(height: 10),
            _monthHeader(),
            _calendar(),
            const SizedBox(height: 6),
            Text(_side == RangeSide.start ? 'picker.drop_off_time'.tr() : 'picker.pick_up_time'.tr(), style: AppText.strong(size: 14)),
            const SizedBox(height: 8),
            _TimeRow(
              key: ValueKey(_side),
              value: _side == RangeSide.start ? _startTime : _endTime,
              label: _side == RangeSide.start ? 'picker.drop_off_time'.tr() : 'picker.pick_up_time'.tr(),
              onPick: (t) => setState(() {
                _error = null;
                if (_side == RangeSide.start) {
                  _startTime = t;
                } else {
                  _endTime = t;
                }
              }),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Semantics(liveRegion: true, child: Text(_error!, key: const Key('stay-error'), style: AppText.body(size: 14, color: AppColors.danger))),
            ],
            const SizedBox(height: 14),
            GradientButton(
              key: const Key('stay-confirm'),
              label: 'picker.confirm'.tr(),
              onPressed: _draft.start != null && _draft.end != null ? _confirm : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(RangeSide side) {
    final date = side == RangeSide.start ? _draft.start : _draft.end;
    final time = side == RangeSide.start ? _startTime : _endTime;
    final active = _side == side;
    final label = side == RangeSide.start ? 'picker.drop_off'.tr() : 'picker.pick_up'.tr();
    final value = date == null ? 'picker.choose'.tr() : '${formatDay(date)} · $time';
    return Semantics(
      button: true,
      selected: active,
      label: '$label : ${date == null ? 'picker.choose'.tr() : '${formatDayLong(date)} $time'}',
      excludeSemantics: true,
      child: InkWell(
        key: Key(side == RangeSide.start ? 'stay-tile-start' : 'stay-tile-end'),
        borderRadius: BorderRadius.circular(14),
        onTap: () => setState(() => _draft = _draft.copyWith(picking: side)),
        child: Container(
          constraints: const BoxConstraints(minHeight: 56),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: active ? AppColors.accent : AppColors.line, width: active ? 2 : 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label.toUpperCase(), style: AppText.label(size: 11)),
              const SizedBox(height: 2),
              Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.tabular(size: 14.5)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _monthHeader() => Row(
    children: [
      IconButton(
        tooltip: 'picker.prev_month'.tr(),
        onPressed: _canGoBack ? () => _moveMonth(-1) : null,
        icon: const Icon(Icons.chevron_left_rounded),
      ),
      Expanded(
        child: Text(
          _capitalize(monthTitle(_year, _month)),
          key: const Key('stay-month'),
          textAlign: TextAlign.center,
          style: AppText.strong(size: 15),
        ),
      ),
      IconButton(tooltip: 'picker.next_month'.tr(), onPressed: () => _moveMonth(1), icon: const Icon(Icons.chevron_right_rounded)),
    ],
  );

  Widget _calendar() {
    final weeks = monthWeeks(_year, _month);
    final letters = 'picker.weekdays'.tr().split(',');
    return Column(
      children: [
        ExcludeSemantics(
          child: Row(
            children: [
              for (final l in letters) Expanded(child: Center(child: Text(l, style: AppText.label(size: 11.5)))),
            ],
          ),
        ),
        const SizedBox(height: 4),
        for (final week in weeks)
          Row(
            children: [
              for (final day in week) Expanded(child: day == null ? const SizedBox(height: 46) : _day(day)),
            ],
          ),
      ],
    );
  }

  Widget _day(String day) {
    final disabled = day.compareTo(_minDate) < 0;
    final start = _draft.start, end = _draft.end;
    final isStart = day == start, isEnd = day == end;
    final between = start != null && end != null && day.compareTo(start) > 0 && day.compareTo(end) < 0;
    final selected = isStart || isEnd;
    final today = day == _minDate;
    return Semantics(
      button: !disabled,
      enabled: !disabled,
      selected: selected,
      label: '${formatDayLong(day)}${today ? ', ${'picker.today'.tr()}' : ''}',
      excludeSemantics: true,
      child: GestureDetector(
        key: Key('day-$day'),
        behavior: HitTestBehavior.opaque,
        onTap: disabled
            ? null
            : () => setState(() {
                _error = null;
                _draft = pickDay(_draft, day, _minDate);
              }),
        child: Container(
          height: 46,
          margin: const EdgeInsets.symmetric(vertical: 1),
          decoration: BoxDecoration(color: between ? AppColors.tint : Colors.transparent),
          alignment: Alignment.center,
          child: Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: selected ? AppColors.primaryGradient : null,
              shape: BoxShape.circle,
              border: today && !selected ? Border.all(color: AppColors.accent) : null,
            ),
            child: Text(
              '${int.parse(day.substring(8))}',
              style: AppText.body(
                size: 14.5,
                weight: selected ? 700 : 500,
                color: selected ? Colors.white : (disabled ? AppColors.line : AppColors.ink),
              ),
            ),
          ),
        ),
      ),
    );
  }

  static String _capitalize(String s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';
}

/// Half-hour slots as one horizontally scrolling row of pills (the chosen one in view).
class _TimeRow extends StatefulWidget {
  const _TimeRow({super.key, required this.value, required this.onPick, required this.label});

  final String value;
  final ValueChanged<String> onPick;
  final String label;

  @override
  State<_TimeRow> createState() => _TimeRowState();
}

class _TimeRowState extends State<_TimeRow> {
  late final ScrollController _scroll;
  static const _itemWidth = 78.0;

  @override
  void initState() {
    super.initState();
    final index = timeOptions(widget.value).indexOf(widget.value);
    _scroll = ScrollController(initialScrollOffset: index < 0 ? 0 : (index * (_itemWidth + 8) - 120).clamp(0, double.infinity));
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final options = timeOptions(widget.value);
    return Semantics(
      label: widget.label,
      child: SizedBox(
        height: 48,
        child: ListView.separated(
          controller: _scroll,
          scrollDirection: Axis.horizontal,
          itemCount: options.length,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, i) {
            final t = options[i];
            final selected = t == widget.value;
            return Semantics(
              button: true,
              selected: selected,
              label: t,
              excludeSemantics: true,
              child: InkWell(
                key: Key('time-$t'),
                borderRadius: BorderRadius.circular(24),
                onTap: () => widget.onPick(t),
                child: Container(
                  width: _itemWidth,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: selected ? AppColors.primaryGradient : null,
                    borderRadius: BorderRadius.circular(24),
                    border: selected ? null : Border.all(color: AppColors.line),
                  ),
                  child: Text(t, style: AppText.tabular(size: 15, weight: 600, color: selected ? Colors.white : AppColors.ink)),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
