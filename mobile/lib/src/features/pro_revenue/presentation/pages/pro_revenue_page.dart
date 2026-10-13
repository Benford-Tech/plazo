import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../data/models/revenue_models.dart';
import '../../domain/revenue_period.dart';
import '../bloc/pro_revenue_bloc.dart';
import '../widgets/revenue_chart.dart';
import '../widgets/revenue_labels.dart';

/// Text on the dark green band, under the lime total (P-B's mockup).
const _bandSoft = Color(0xFFD9F0C2);
const _radius = BorderRadius.all(Radius.circular(14));

/// P-B « le total d'abord » (13/10/2026): the revenue of Plazo Pro for the managers, a day, a week or a month at a
/// time; the total on a dark green band, the days in bars, the bookings without an amount to complete, the channels.
/// The CSV stays on the web.
@RoutePage()
class ProRevenuePage extends StatelessWidget implements AutoRouteWrapper {
  const ProRevenuePage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProRevenueBloc>()..add(const ProRevenueStarted()), child: this);

  @override
  Widget build(BuildContext context) => const ProRevenueView();
}

class ProRevenueView extends StatelessWidget {
  const ProRevenueView({super.key});

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: BlocBuilder<ProRevenueBloc, ProRevenueState>(
          builder: (context, state) {
            final bloc = context.read<ProRevenueBloc>();
            final report = state.report;
            return RefreshIndicator(
              color: AppColors.accent,
              onRefresh: () async => bloc.add(const ProRevenueRefreshed()),
              child: ListView(
                key: const Key('revenue-page'),
                padding: EdgeInsets.zero,
                children: [
                  _Band(state: state),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 32),
                    child: report == null
                        ? _Waiting(state: state)
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _DaysCard(report: report, state: state),
                              if (report.withoutAmount > 0) ...[const SizedBox(height: 12), _MissingRow(report: report)],
                              const SizedBox(height: 12),
                              _ChannelsCard(report: report),
                            ],
                          ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _Band extends StatelessWidget {
  const _Band({required this.state});
  final ProRevenueState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProRevenueBloc>();
    final report = state.report;
    final label = periodLabel(
      state.span,
      state.anchor,
      state.today,
      todayWord: 'revenue.period.today'.tr(),
      yesterdayWord: 'revenue.period.yesterday'.tr(),
      thisWeekWord: 'revenue.period.this_week'.tr(),
      range: (first, last) => 'revenue.period.range'.tr(args: [first, last]),
    );
    return Container(
      color: AppColors.accent,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 4, 4, 22),
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    key: const Key('revenue-back'),
                    tooltip: MaterialLocalizations.of(context).backButtonTooltip,
                    icon: const Icon(Icons.chevron_left_rounded, color: Colors.white, size: 28),
                    onPressed: () => context.router.maybePop(),
                  ),
                  Expanded(
                    child: Semantics(
                      header: true,
                      child: Text('revenue.title'.tr(), style: AppText.title(size: 20, color: Colors.white)),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Column(
                  children: [
                    const SizedBox(height: 6),
                    _SpanSwitch(span: state.span, onChanged: (s) => bloc.add(ProRevenueSpanChanged(s))),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        IconButton(
                          key: const Key('revenue-prev'),
                          tooltip: 'revenue.previous.${state.span.name}'.tr(),
                          icon: const Icon(Icons.chevron_left_rounded, color: Colors.white),
                          onPressed: () => bloc.add(const ProRevenueStepped(-1)),
                        ),
                        Expanded(
                          child: Text(
                            label,
                            key: const Key('revenue-period'),
                            textAlign: TextAlign.center,
                            style: AppText.strong(size: 16, color: Colors.white),
                          ),
                        ),
                        IconButton(
                          key: const Key('revenue-next'),
                          tooltip: 'revenue.next.${state.span.name}'.tr(),
                          icon: const Icon(Icons.chevron_right_rounded, color: Colors.white),
                          onPressed: () => bloc.add(const ProRevenueStepped(1)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 46,
                      child: report == null
                          ? Center(
                              child: state.viewState.isError
                                  ? Text('—', style: AppText.tabular(size: 36, color: AppColors.action))
                                  : const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.action)),
                            )
                          : FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                formatEuros(report.totalCents),
                                key: const Key('revenue-total'),
                                style: AppText.tabular(size: 42, color: AppColors.action).copyWith(height: 1),
                              ),
                            ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      report == null ? ' ' : _summaryLine(report),
                      key: const Key('revenue-summary'),
                      textAlign: TextAlign.center,
                      style: AppText.body(size: 13.5, color: _bandSoft),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// « 86 réservations · panier moyen 145,12 € · 6,4 jours ».
  static String _summaryLine(RevenueReportModel r) {
    if (r.count == 0) return 'revenue.none'.tr();
    return [
      'revenue.bookings_count'.tr(args: ['${r.count}']),
      if (r.averageCents != null) 'revenue.average'.tr(args: [formatEuros(r.averageCents!)]),
      if (r.averageDays != null) 'revenue.average_days'.tr(args: [revenueDays(r.averageDays!)]),
    ].join(' · ');
  }
}

/// « Jour · Semaine · Mois » on the band, the chosen one in lime.
class _SpanSwitch extends StatelessWidget {
  const _SpanSwitch({required this.span, required this.onChanged});
  final RevenueSpan span;
  final ValueChanged<RevenueSpan> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), borderRadius: const BorderRadius.all(Radius.circular(999))),
      child: Row(
        children: [
          for (final s in RevenueSpan.values)
            Expanded(
              child: Semantics(
                button: true,
                selected: s == span,
                inMutuallyExclusiveGroup: true,
                child: Material(
                  color: s == span ? AppColors.action : Colors.transparent,
                  borderRadius: const BorderRadius.all(Radius.circular(999)),
                  child: InkWell(
                    key: Key('revenue-span-${s.name}'),
                    borderRadius: const BorderRadius.all(Radius.circular(999)),
                    onTap: () => onChanged(s),
                    child: Container(
                      height: 38,
                      alignment: Alignment.center,
                      child: Text(
                        'revenue.span.${s.name}'.tr(),
                        style: AppText.body(size: 13.5, weight: 600, color: s == span ? AppColors.onAccent : Colors.white),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Waiting extends StatelessWidget {
  const _Waiting({required this.state});
  final ProRevenueState state;

  @override
  Widget build(BuildContext context) {
    if (!state.viewState.isError) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 12),
      child: Column(
        children: [
          Text(state.errorMessage ?? 'errors.generic'.tr(), textAlign: TextAlign.center, style: AppText.body()),
          const SizedBox(height: 12),
          TextButton(
            key: const Key('revenue-retry'),
            onPressed: () => context.read<ProRevenueBloc>().add(const ProRevenueRefreshed()),
            child: Text('revenue.retry'.tr(), style: AppText.strong(size: 14, color: AppColors.accent)),
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
    decoration: BoxDecoration(
      color: AppColors.panel,
      borderRadius: _radius,
      border: Border.all(color: AppColors.panelLine),
    ),
    child: child,
  );
}

Widget _heading(String text) => Semantics(
  header: true,
  child: Text(text.toUpperCase(), style: AppText.title(size: 14, color: AppColors.accent).copyWith(letterSpacing: 0.84)),
);

/// « Par jour d'arrivée » with its switch to « Par réservation », and the bars (a week or a month).
class _DaysCard extends StatelessWidget {
  const _DaysCard({required this.report, required this.state});
  final RevenueReportModel report;
  final ProRevenueState state;

  @override
  Widget build(BuildContext context) {
    final byArrival = state.basis == 'arrival';
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: _heading(byArrival ? 'revenue.by_arrival'.tr() : 'revenue.by_booking'.tr())),
              TextButton(
                key: const Key('revenue-basis'),
                style: TextButton.styleFrom(minimumSize: const Size(44, 44), padding: const EdgeInsets.symmetric(horizontal: 8)),
                onPressed: () => context.read<ProRevenueBloc>().add(ProRevenueBasisChanged(byArrival ? 'booked' : 'arrival')),
                child: Text(
                  byArrival ? 'revenue.switch_to_booking'.tr() : 'revenue.switch_to_arrival'.tr(),
                  style: AppText.strong(size: 13, color: AppColors.accent),
                ),
              ),
            ],
          ),
          Text(byArrival ? 'revenue.by_arrival_help'.tr() : 'revenue.by_booking_help'.tr(), style: AppText.muted(size: 12.5)),
          if (report.byDay.length > 1) ...[const SizedBox(height: 12), RevenueChart(days: report.byDay, today: state.today)],
        ],
      ),
    );
  }
}

/// « À compléter »: the bookings of the period without an amount, left out of the total.
class _MissingRow extends StatelessWidget {
  const _MissingRow({required this.report});
  final RevenueReportModel report;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.panel,
      shape: const RoundedRectangleBorder(
        borderRadius: _radius,
        side: BorderSide(color: AppColors.panelLine),
      ),
      child: InkWell(
        key: const Key('revenue-missing'),
        borderRadius: _radius,
        onTap: () => context.router.push(ProRevenueMissingRoute(bloc: context.read<ProRevenueBloc>())),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
          child: Row(
            children: [
              Container(
                width: 34,
                height: 34,
                alignment: Alignment.center,
                decoration: const BoxDecoration(color: AppStatus.warnSoft, borderRadius: BorderRadius.all(Radius.circular(10))),
                child: Text('${report.withoutAmount}', style: AppText.tabular(size: 15, weight: 800, color: AppStatus.warnText)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('revenue.missing_title'.tr(), style: AppText.strong()),
                    Text('revenue.missing_sub'.tr(), style: AppText.muted(size: 13)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChannelsCard extends StatelessWidget {
  const _ChannelsCard({required this.report});
  final RevenueReportModel report;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _heading('revenue.by_channel'.tr()),
          const SizedBox(height: 4),
          if (report.byChannel.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text('revenue.none_period'.tr(), style: AppText.muted()),
            ),
          for (final (i, line) in report.byChannel.indexed)
            MergeSemantics(
              child: Container(
                key: Key('revenue-channel-$i'),
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  border: i == report.byChannel.length - 1 ? null : const Border(bottom: BorderSide(color: AppColors.panel2)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(text: revenueLineName(line), style: AppText.strong(size: 14)),
                            TextSpan(
                              text: '  ${line.count}',
                              semanticsLabel: ', ${'revenue.bookings_count'.tr(args: ['${line.count}'])}',
                              style: AppText.tabular(size: 11, weight: 500, color: AppColors.muted),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Text(formatEuros(line.totalCents), style: AppText.tabular(size: 14)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
