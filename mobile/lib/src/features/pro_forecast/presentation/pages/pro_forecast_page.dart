import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../data/forecast_data_source.dart';
import '../../domain/forecast_period.dart';

/// « Planning prévisionnel » (28/10/2026, direction A « Calendrier par mois », as on the web): Semaine · Mois · 3 mois,
/// each day with its arrivals ↑, departures ↓ and the night's gauge, « Complet » in red. Opened from the calendar
/// button of the planning's date bar; tapping a day pops back with that date (YYYY-MM-DD) for the day planning.
@RoutePage()
class ProForecastPage extends StatefulWidget {
  const ProForecastPage({super.key, this.anchor});

  /// A date of the period shown first (the day the planning was on); today when null.
  final String? anchor;

  @override
  State<ProForecastPage> createState() => _ProForecastPageState();
}

class _ProForecastPageState extends State<ProForecastPage> {
  ForecastView _view = ForecastView.month;
  late String _anchor;
  ForecastModel? _data;
  String? _error;
  int _request = 0;

  static String _iso(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

  @override
  void initState() {
    super.initState();
    _anchor = widget.anchor ?? _iso(DateTime.now());
    _load();
  }

  Future<void> _load() async {
    if (!locator.isRegistered<ForecastDataSource>()) return;
    final period = periodOf(_view, _anchor);
    final request = ++_request;
    try {
      final data = await locator<ForecastDataSource>().fetch(period.from, period.days);
      // Only the last period asked for is shown.
      if (mounted && request == _request) {
        setState(() {
          _data = data;
          _error = null;
        });
      }
    } catch (_) {
      if (mounted && request == _request) setState(() => _error = 'forecast.error'.tr());
    }
  }

  void _go({ForecastView? view, String? anchor}) {
    setState(() {
      _view = view ?? _view;
      _anchor = anchor ?? _anchor;
      _data = null;
      _error = null;
    });
    _load();
  }

  String _title(({String from, int days}) period) {
    final from = DateTime.parse(period.from);
    final to = DateTime.parse(addDays(period.from, period.days - 1));
    String cap(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
    return switch (_view) {
      ForecastView.week => '${DateFormat('d MMM', 'fr_FR').format(from)} – ${DateFormat('d MMM y', 'fr_FR').format(to)}',
      ForecastView.month => cap(DateFormat('MMMM y', 'fr_FR').format(from)),
      ForecastView.quarter => cap('${DateFormat('MMM', 'fr_FR').format(from)} – ${DateFormat('MMM y', 'fr_FR').format(to)}'),
    };
  }

  @override
  Widget build(BuildContext context) {
    final period = periodOf(_view, _anchor);
    final data = _data;
    final today = data?.today.isNotEmpty == true ? data!.today : _iso(DateTime.now());
    final byDate = {for (final d in data?.days ?? const <ForecastDay>[]) d.date: d};
    final current = periodOf(_view, _iso(DateTime.now())).from == period.from;
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: 'forecast.title'.tr()),
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: _load,
        child: ListView(
          key: const Key('forecast-list'),
          padding: EdgeInsets.fromLTRB(12, 12, 12, 24 + MediaQuery.paddingOf(context).bottom),
          children: [
            _ViewPills(
              view: _view,
              onChanged: (v) => _go(view: v),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                IconButton(
                  key: const Key('forecast-prev'),
                  tooltip: 'forecast.previous'.tr(),
                  icon: const Icon(Icons.chevron_left_rounded),
                  onPressed: () => _go(anchor: shiftPeriod(_view, _anchor, -1)),
                ),
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(_title(period), key: const Key('forecast-title'), style: AppText.title(size: 22)),
                  ),
                ),
                IconButton(
                  key: const Key('forecast-next'),
                  tooltip: 'forecast.next'.tr(),
                  icon: const Icon(Icons.chevron_right_rounded),
                  onPressed: () => _go(anchor: shiftPeriod(_view, _anchor, 1)),
                ),
              ],
            ),
            if (!current)
              Center(
                child: TextButton(
                  key: const Key('forecast-today'),
                  onPressed: () => _go(anchor: _iso(DateTime.now())),
                  child: Text('pro.back_to_today'.tr(), style: AppText.strong(size: 13, color: AppColors.accent)),
                ),
              ),
            const _Legend(),
            const SizedBox(height: 10),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(_error!, textAlign: TextAlign.center),
              )
            else if (data == null)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
              )
            else ...[
              _Summary(days: data.days),
              const SizedBox(height: 10),
              if (_view == ForecastView.week)
                _WeekList(days: data.days, today: today, onOpen: _open)
              else
                for (final g in monthGrids(period.from, period.days)) ...[
                  _MonthGrid(month: g.month, weeks: g.weeks, byDate: byDate, today: today, onOpen: _open),
                  const SizedBox(height: 12),
                ],
              const SizedBox(height: 4),
              Text('forecast.note'.tr(), style: AppText.muted(size: 12)),
            ],
          ],
        ),
      ),
    );
  }

  void _open(String date) => context.router.maybePop<String>(date);
}

class _ViewPills extends StatelessWidget {
  const _ViewPills({required this.view, required this.onChanged});
  final ForecastView view;
  final ValueChanged<ForecastView> onChanged;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(4),
    decoration: BoxDecoration(
      color: AppColors.panel,
      borderRadius: AppRadius.pill,
      border: Border.all(color: AppColors.panelLine),
    ),
    child: Row(
      children: [
        for (final v in ForecastView.values)
          Expanded(
            child: Semantics(
              selected: v == view,
              button: true,
              child: InkWell(
                key: Key('forecast-view-${v.name}'),
                borderRadius: AppRadius.pill,
                onTap: () => onChanged(v),
                child: Container(
                  alignment: Alignment.center,
                  padding: const EdgeInsets.symmetric(vertical: 9),
                  decoration: BoxDecoration(color: v == view ? AppColors.action : null, borderRadius: AppRadius.pill),
                  child: Text(
                    'forecast.views.${v.name}'.tr(),
                    style: AppText.strong(size: 13.5, color: v == view ? AppColors.onAccent : AppColors.muted),
                  ),
                ),
              ),
            ),
          ),
      ],
    ),
  );
}

class _Legend extends StatelessWidget {
  const _Legend();

  @override
  Widget build(BuildContext context) {
    Widget bar(Color c) => Container(
      width: 18,
      height: 7,
      decoration: BoxDecoration(color: c, borderRadius: AppRadius.pill),
    );
    Widget item(Widget swatch, String key) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        swatch,
        const SizedBox(width: 5),
        Text('forecast.legend.$key'.tr(), style: AppText.muted(size: 12.5)),
      ],
    );
    return Wrap(
      spacing: 14,
      runSpacing: 4,
      children: [
        item(const Icon(Icons.arrow_upward_rounded, size: 15, color: AppStatus.okText), 'arrivals'),
        item(const Icon(Icons.arrow_downward_rounded, size: 15, color: AppStatus.info), 'departures'),
        item(bar(AppStatus.warn), 'high'),
        item(bar(AppStatus.bad), 'full'),
      ],
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.days});
  final List<ForecastDay> days;

  @override
  Widget build(BuildContext context) {
    final arrivals = days.fold<int>(0, (n, d) => n + d.arrivals);
    final departures = days.fold<int>(0, (n, d) => n + d.returns);
    final full = days.where((d) => gaugeOf(parked: d.parked, bookable: d.bookable).level == GaugeLevel.full).length;
    ForecastDay? busiest;
    for (final d in days) {
      if (busiest == null || d.parked > busiest.parked) busiest = d;
    }
    return Wrap(
      key: const Key('forecast-summary'),
      spacing: 12,
      runSpacing: 2,
      children: [
        Text('forecast.summary'.tr(namedArgs: {'arrivals': '$arrivals', 'departures': '$departures'}), style: AppText.strong(size: 14)),
        if (busiest != null && busiest.parked > 0)
          Text(
            'forecast.busiest'.tr(
              namedArgs: {
                'pct': '${gaugeOf(parked: busiest.parked, bookable: busiest.bookable).pct}',
                'day': DateFormat('EEE d', 'fr_FR').format(DateTime.parse(busiest.date)),
              },
            ),
            style: AppText.muted(size: 13),
          ),
        if (full > 0) Text('forecast.full_nights'.plural(full), style: AppText.strong(size: 13, color: AppStatus.badText)),
      ],
    );
  }
}

const _bar = {GaugeLevel.low: Color(0x66A3E635), GaugeLevel.mid: Color(0xFFA3E635), GaugeLevel.high: AppStatus.warn, GaugeLevel.full: AppStatus.bad};
const _text = {
  GaugeLevel.low: AppColors.muted,
  GaugeLevel.mid: AppColors.accent,
  GaugeLevel.high: AppStatus.warnText,
  GaugeLevel.full: AppStatus.badText,
};

String _load(ForecastDay day, ({int pct, GaugeLevel level}) g) => g.level == GaugeLevel.full
    ? (day.overbooked ? 'forecast.overbooked'.tr(namedArgs: {'n': '${day.parked - day.bookable}'}) : 'forecast.full'.tr())
    : '${g.pct} %';

/// One day: its number (or « lun. 26 » in the week list), ↑ arrivals, ↓ departures, the gauge and its load.
class _DayCell extends StatelessWidget {
  const _DayCell({required this.date, required this.day, required this.today, required this.onOpen});
  final String date;
  final ForecastDay? day;
  final String today;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    final d = day;
    final g = d == null ? null : gaugeOf(parked: d.parked, bookable: d.bookable);
    final full = g?.level == GaugeLevel.full;
    final isToday = date == today;
    return Opacity(
      opacity: date.compareTo(today) < 0 ? 0.45 : 1,
      child: Material(
        color: full ? AppStatus.badSoft : AppColors.panel,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.small,
          side: BorderSide(color: isToday ? AppColors.action : (full ? AppStatus.bad : AppColors.panelLine), width: isToday ? 2 : 1),
        ),
        child: InkWell(
          key: Key('forecast-day-$date'),
          borderRadius: AppRadius.small,
          onTap: () => onOpen(date),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(3, 4, 3, 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${int.parse(date.substring(8))}', style: AppText.tabular(size: 12, color: isToday ? AppColors.accent : AppColors.ink)),
                if (d != null && g != null) ...[
                  Text('↑${d.arrivals}', style: AppText.tabular(size: 10.5, weight: 600, color: AppStatus.okText)),
                  Text('↓${d.returns}', style: AppText.tabular(size: 10.5, weight: 600, color: AppStatus.info)),
                  const SizedBox(height: 2),
                  _Gauge(pct: g.pct, color: _bar[g.level]!),
                  const SizedBox(height: 2),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(_load(d, g), style: AppText.tabular(size: 9.5, weight: 600, color: _text[g.level]!)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Gauge extends StatelessWidget {
  const _Gauge({required this.pct, required this.color});
  final int pct;
  final Color color;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: AppRadius.pill,
    child: SizedBox(
      height: 5,
      child: Stack(
        children: [
          const Positioned.fill(child: ColoredBox(color: AppColors.panel2)),
          FractionallySizedBox(
            widthFactor: (pct.clamp(0, 100)) / 100,
            child: ColoredBox(color: color),
          ),
        ],
      ),
    ),
  );
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({required this.month, required this.weeks, required this.byDate, required this.today, required this.onOpen});
  final String month;
  final List<List<String?>> weeks;
  final Map<String, ForecastDay> byDate;
  final String today;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    final title = DateFormat('MMMM y', 'fr_FR').format(DateTime.parse(month));
    final weekdays = 'forecast.weekdays'.tr().split(',');
    return AppCard(
      key: Key('forecast-month-$month'),
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 2, 4, 6),
            child: Text(title[0].toUpperCase() + title.substring(1), style: AppText.strong(size: 15)),
          ),
          Row(
            children: [
              for (final w in weekdays)
                Expanded(
                  child: Center(child: Text(w, style: AppText.label(size: 10.5))),
                ),
            ],
          ),
          const SizedBox(height: 4),
          for (final week in weeks)
            Padding(
              padding: const EdgeInsets.only(bottom: 3),
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final date in week)
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 1.5),
                          child: date == null ? const SizedBox() : _DayCell(date: date, day: byDate[date], today: today, onOpen: onOpen),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// The week as a list: one line per day, wider than a grid cell on a phone.
class _WeekList extends StatelessWidget {
  const _WeekList({required this.days, required this.today, required this.onOpen});
  final List<ForecastDay> days;
  final String today;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (final d in days)
        Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: _WeekRow(day: d, today: today, onOpen: onOpen),
        ),
    ],
  );
}

class _WeekRow extends StatelessWidget {
  const _WeekRow({required this.day, required this.today, required this.onOpen});
  final ForecastDay day;
  final String today;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    final g = gaugeOf(parked: day.parked, bookable: day.bookable);
    final full = g.level == GaugeLevel.full;
    final isToday = day.date == today;
    final label = DateFormat('EEE d MMM', 'fr_FR').format(DateTime.parse(day.date));
    return Opacity(
      opacity: day.date.compareTo(today) < 0 ? 0.45 : 1,
      child: Material(
        color: full ? AppStatus.badSoft : AppColors.panel,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.chip,
          side: BorderSide(color: isToday ? AppColors.action : (full ? AppStatus.bad : AppColors.panelLine), width: isToday ? 2 : 1),
        ),
        child: InkWell(
          key: Key('forecast-day-${day.date}'),
          borderRadius: AppRadius.chip,
          onTap: () => onOpen(day.date),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                SizedBox(
                  width: 92,
                  child: Text(label, style: AppText.tabular(size: 13.5, color: isToday ? AppColors.accent : AppColors.ink)),
                ),
                Text('↑${day.arrivals}', style: AppText.tabular(size: 14, color: AppStatus.okText)),
                const SizedBox(width: 10),
                Text('↓${day.returns}', style: AppText.tabular(size: 14, color: AppStatus.info)),
                const SizedBox(width: 12),
                Expanded(
                  child: _Gauge(pct: g.pct, color: _bar[g.level]!),
                ),
                const SizedBox(width: 10),
                Text(_load(day, g), style: AppText.tabular(size: 12.5, weight: 600, color: _text[g.level]!)),
                const Icon(Icons.chevron_right_rounded, color: AppColors.muted, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
