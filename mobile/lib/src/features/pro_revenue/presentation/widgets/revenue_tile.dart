import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/helpers/money.dart';
import '../../../../core/router/app_router.dart';
import '../../../../shared/theme/theme.dart';
import '../../domain/revenue_period.dart';
import '../bloc/revenue_summary_bloc.dart';

const _radius = BorderRadius.all(Radius.circular(12));

/// T-A (13/10/2026): the dashboard's revenue card, full width under the five figures, managers only: the month's
/// total, today, the last 7 days and the bookings without an amount; it opens the revenue page. Hidden until the
/// first figures come (and when they never do).
class RevenueTile extends StatelessWidget {
  const RevenueTile({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<RevenueSummaryBloc, RevenueSummaryState>(
      builder: (context, state) {
        final d = state.data;
        if (d == null) return const SizedBox.shrink();
        final month = DateFormat('MMMM', 'fr_FR').format(parseDay(d.month.from));
        final title = 'revenue.tile_title'.tr(args: [month]).toUpperCase();
        Widget figure(String label, int cents) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: AppText.tabular(size: 11, weight: 500, color: AppColors.muted)),
            const SizedBox(height: 2),
            Text(formatEuros(cents), style: AppText.tabular(size: 15)),
          ],
        );
        return Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Semantics(
            button: true,
            label: 'revenue.tile_semantics'.tr(args: [month, formatEuros(d.month.totalCents)]),
            child: Material(
              key: const Key('revenue-tile'),
              color: AppColors.panel,
              shape: const RoundedRectangleBorder(
                borderRadius: _radius,
                side: BorderSide(color: AppColors.panelLine),
              ),
              child: InkWell(
                borderRadius: _radius,
                onTap: () async {
                  final bloc = context.read<RevenueSummaryBloc>();
                  await context.router.push(const ProRevenueRoute());
                  // Amounts completed on the page count at once.
                  if (!bloc.isClosed) bloc.add(const RevenueSummaryRefreshed());
                },
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(title, style: AppText.title(size: 14, color: AppColors.accent).copyWith(letterSpacing: 0.84)),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                        ],
                      ),
                      const SizedBox(height: 8),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          formatEuros(d.month.totalCents),
                          key: const Key('revenue-tile-total'),
                          style: AppText.tabular(size: 32).copyWith(height: 1.05),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Wrap(
                              spacing: 18,
                              runSpacing: 6,
                              children: [figure('revenue.today'.tr(), d.todayCents), figure('revenue.week'.tr(), d.weekCents)],
                            ),
                          ),
                          if (d.month.withoutAmount > 0)
                            Container(
                              key: const Key('revenue-tile-missing'),
                              constraints: const BoxConstraints(minHeight: 26),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: const BoxDecoration(color: AppStatus.warnSoft, borderRadius: BorderRadius.all(Radius.circular(999))),
                              child: Text(
                                'revenue.without_amount'.tr(args: ['${d.month.withoutAmount}']),
                                style: AppText.body(size: 12.5, weight: 600, color: AppStatus.warnText),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
