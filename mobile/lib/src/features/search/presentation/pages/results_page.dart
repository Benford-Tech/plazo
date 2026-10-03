import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/segmented.dart';
import '../../data/models/public_models.dart';
import '../../domain/logic/filters.dart';
import '../../domain/usecases/public_use_cases.dart';
import '../bloc/results/results_bloc.dart';
import '../widgets/filters_sheet.dart';
import '../widgets/result_card.dart';
import '../widgets/results_map.dart';
import '../widgets/stay_sheet.dart';

/// A2, the results (the site's /:airport/recherche?arrivee=…&retour=…): list by default, map in
/// one tap, the site's sorts and filters.
@RoutePage()
class ResultsPage extends StatelessWidget implements AutoRouteWrapper {
  const ResultsPage({
    super.key,
    @PathParam('airport') required this.airport,
    @QueryParam('arrivee') this.arrivee,
    @QueryParam('retour') this.retour,
  });

  final String airport;
  final String? arrivee;
  final String? retour;

  @override
  Widget wrappedRoute(BuildContext context) {
    // A link without dates: the site's default stay.
    final fallback = defaultStay(DateTime.now());
    return BlocProvider(
      create: (_) => locator<ResultsBloc>(
        param1: StayParams(airport: airport, arrivalAt: arrivee ?? fallback.arrival, returnAt: retour ?? fallback.returnAt),
      )..add(const ResultsRequested()),
      child: this,
    );
  }

  @override
  Widget build(BuildContext context) => const _ResultsView();
}

class _ResultsView extends StatelessWidget {
  const _ResultsView();

  Future<void> _modify(BuildContext context) async {
    final bloc = context.read<ResultsBloc>();
    final s = bloc.state;
    final stay = await showStaySheet(context, arrivalAt: s.arrivalAt, returnAt: s.returnAt);
    if (stay != null) bloc.add(ResultsStayChanged(arrivalAt: stay.arrivalAt, returnAt: stay.returnAt));
  }

  void _open(BuildContext context, SearchResultModel r) {
    final s = context.read<ResultsBloc>().state;
    context.router.push(ParkingRoute(airport: s.airport, parking: r.slug, arrivee: s.arrivalAt, retour: s.returnAt));
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ResultsBloc, ResultsState>(
      builder: (context, state) {
        final name = (state.response?.airport.name ?? 'search.kicker'.tr()).replaceAll('Saint-', 'St-');
        final a = parseLocal(state.arrivalAt), r = parseLocal(state.returnAt);
        final days = a != null && r != null ? stayDays(state.arrivalAt, state.returnAt) : 0;
        final range = a != null && r != null ? shortRange(a.date, r.date) : '';
        return Scaffold(
          appBar: AppBar(
            toolbarHeight: 56,
            titleSpacing: NavigationToolbar.kMiddleSpacing,
            title: Semantics(
              label: 'results.header_a11y'.tr(args: [name, formatDateTime(state.arrivalAt), formatDateTime(state.returnAt), daysLabel(days)]),
              excludeSemantics: true,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text('results.header'.tr(args: [name, range, '$days']), style: AppText.strong(size: 15.5, color: Colors.white)),
              ),
            ),
            actions: [
              TextButton(
                key: const Key('results-modify'),
                onPressed: () => _modify(context),
                style: TextButton.styleFrom(minimumSize: const Size(48, 48), foregroundColor: Colors.white),
                child: Text('results.modify'.tr(), style: AppText.strong(size: 14, color: Colors.white)),
              ),
              const SizedBox(width: 4),
            ],
          ),
          body: SafeArea(
            top: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Segmented<ResultsView>(
                    key: const Key('results-view'),
                    values: ResultsView.values,
                    labels: ['results.list'.tr(), 'results.map'.tr()],
                    selected: state.view,
                    onChanged: (v) => context.read<ResultsBloc>().add(ResultsViewChanged(v)),
                  ),
                ),
                SizedBox(
                  height: 56,
                  child: Row(
                    children: [
                      Expanded(
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.fromLTRB(16, 8, 6, 0),
                          children: [
                            for (final (key, label) in [
                              (SortKey.price, 'results.sort_price'.tr()),
                              (SortKey.shuttle, 'results.sort_shuttle'.tr()),
                              (SortKey.distance, 'results.sort_distance'.tr()),
                            ]) ...[
                              PillChip(
                                key: Key('sort-${key.name}'),
                                label: label,
                                selected: state.filters.sort == key,
                                onTap: () => context.read<ResultsBloc>().add(ResultsSortChanged(key)),
                              ),
                              const SizedBox(width: 6),
                            ],
                          ],
                        ),
                      ),
                      // Always in view, whatever the sorts' width.
                      Padding(
                        padding: const EdgeInsets.fromLTRB(0, 8, 16, 0),
                        child: PillChip(
                          key: const Key('open-filters'),
                          icon: Icons.tune_rounded,
                          label: state.filters.active ? 'results.filters_count'.tr(args: ['${state.filters.activeCount}']) : 'results.filters'.tr(),
                          selected: state.filters.active,
                          onTap: () async {
                            final bloc = context.read<ResultsBloc>();
                            final f = await showFiltersSheet(context, filters: state.filters, results: state.results);
                            if (f != null) bloc.add(ResultsFiltersChanged(f));
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(child: _body(context, state)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _body(BuildContext context, ResultsState state) {
    if (state.loadState.isProcessing && state.response == null || state.loadState.isIdle) {
      return const Center(child: CircularProgressIndicator(color: AppColors.violet));
    }
    if (state.loadState.isError) {
      final code = state.errorCode;
      final dateProblem = const ['arrival_in_past', 'return_before_arrival', 'stay_too_long', 'invalid_datetime'].contains(code);
      return _Empty(
        title: dateProblem ? translateErrorCode(code) : (state.errorMessage ?? 'errors.generic'.tr()),
        action: dateProblem ? 'parking.change_dates'.tr() : 'common.retry'.tr(),
        onAction: dateProblem ? () => _modify(context) : () => context.read<ResultsBloc>().add(const ResultsRequested()),
      );
    }
    final shown = state.shown;
    if (state.view == ResultsView.map && state.response != null) {
      final selected = shown.where((r) => r.slug == state.selectedSlug).firstOrNull;
      return Stack(
        children: [
          Positioned.fill(
            child: ResultsMap(
              key: const Key('results-map'),
              airport: state.response!.airport,
              results: shown,
              selected: state.selectedSlug,
              onSelect: (slug) => context.read<ResultsBloc>().add(ResultsSelected(slug)),
            ),
          ),
          if (selected != null)
            Positioned(
              left: 12,
              right: 12,
              bottom: 12,
              child: ResultCard(
                key: const Key('selected-card'),
                result: selected,
                compact: true,
                highlighted: true,
                badges: state.badges[selected.slug] ?? const [],
                onTap: () => _open(context, selected),
              ),
            ),
        ],
      );
    }
    if (shown.isEmpty) {
      final none = state.results.isEmpty;
      return _Empty(
        title: none ? 'results.none_title'.tr() : 'results.no_match_title'.tr(),
        text: none ? 'results.none_text'.tr() : 'results.no_match_text'.tr(),
        action: none ? 'parking.change_dates'.tr() : 'results.clear'.tr(),
        onAction: none
            ? () => _modify(context)
            : () => context.read<ResultsBloc>().add(ResultsFiltersChanged(state.filters.cleared())),
      );
    }
    final count = state.availableCount;
    return RefreshIndicator(
      color: AppColors.violet,
      onRefresh: () async => context.read<ResultsBloc>().add(const ResultsRequested()),
      child: ListView.separated(
        key: const Key('results-list'),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        itemCount: shown.length + 2,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          if (i == 0) {
            return Semantics(
              header: true,
              liveRegion: true,
              child: Text(
                count == 0
                    ? 'results.available_none'.tr()
                    : count == 1
                    ? 'results.available_one'.tr()
                    : 'results.available_many'.tr(args: ['$count']),
                style: AppText.title(size: 20),
              ),
            );
          }
          if (i == shown.length + 1) {
            return Text(state.online ? 'results.footnote_online'.tr() : 'results.footnote_on_site'.tr(), style: AppText.muted(size: 12.5));
          }
          final r = shown[i - 1];
          return ResultCard(
            result: r,
            highlighted: i == 1 && r.available,
            badges: state.badges[r.slug] ?? const [],
            onTap: () => _open(context, r),
          );
        },
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.title, this.text, required this.action, required this.onAction});

  final String title;
  final String? text;
  final String action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) => ListView(
    key: const Key('results-empty'),
    padding: const EdgeInsets.all(16),
    children: [
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: AppColors.canvas, borderRadius: BorderRadius.circular(16)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppText.strong(size: 17)),
            if (text != null) ...[const SizedBox(height: 6), Text(text!, style: AppText.muted())],
            const SizedBox(height: 14),
            OutlineAction(label: action, onPressed: onAction),
          ],
        ),
      ),
    ],
  );
}
