import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/listing.dart';
import '../../../../core/helpers/money.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/segmented.dart';
import '../../data/models/public_models.dart';
import '../../domain/logic/filters.dart';

/// Opens the filters (the site's filter column): services, free cancellation, shuttle time, maximum
/// total price. Returns the new filters, or null when closed.
Future<Filters?> showFiltersSheet(BuildContext context, {required Filters filters, required List<SearchResultModel> results}) {
  return showModalBottomSheet<Filters>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    barrierColor: const Color(0x731E0A28),
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (_) => FiltersSheet(filters: filters, results: results),
  );
}

class FiltersSheet extends StatefulWidget {
  const FiltersSheet({super.key, required this.filters, required this.results});

  final Filters filters;
  final List<SearchResultModel> results;

  @override
  State<FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends State<FiltersSheet> {
  late Filters _f = widget.filters;

  int get _ceiling => priceCeilingCents(widget.results);

  /// What the results page will show with these filters (a limit at the maximum is no limit).
  int get _count {
    final max = _f.maxPriceCents;
    final applied = max != null && max >= _ceiling ? _f.copyWith(maxPriceCents: () => null) : _f;
    return applyFilters(widget.results, applied).length;
  }

  @override
  Widget build(BuildContext context) {
    final counts = serviceCounts(widget.results);
    final visible = filterServices.where((s) => counts[s]! > 0 || _f.services.contains(s)).toList();
    final ceiling = _ceiling;
    final price = (_f.maxPriceCents ?? ceiling).clamp(0, ceiling);
    final free = widget.results.where((r) => r.cancellationPolicy != 'non_refundable').length;
    return SafeArea(
      top: false,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 4, 0),
            child: Row(
              children: [
                Semantics(header: true, child: Text('filters.title'.tr(), style: AppText.title(size: 22))),
                const Spacer(),
                if (_f.active)
                  TextButton(
                    key: const Key('filters-clear'),
                    onPressed: () => setState(() => _f = _f.cleared()),
                    child: Text('filters.clear'.tr(), style: AppText.strong(size: 14, color: AppColors.accent)),
                  ),
                IconButton(tooltip: 'common.close'.tr(), onPressed: () => Navigator.of(context).pop(), icon: const Icon(Icons.close_rounded)),
              ],
            ),
          ),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              children: [
                if (visible.isNotEmpty) ...[
                  _title('filters.services'.tr()),
                  for (final s in visible)
                    CheckboxListTile(
                      key: Key('filter-$s'),
                      contentPadding: EdgeInsets.zero,
                      dense: false,
                      controlAffinity: ListTileControlAffinity.leading,
                      activeColor: AppColors.accent,
                      value: _f.services.contains(s),
                      onChanged: (v) => setState(() => _f = _f.copyWith(services: v == true ? [..._f.services, s] : _f.services.where((x) => x != s).toList())),
                      title: Text(serviceLabel(s), style: AppText.body()),
                      secondary: Text('${counts[s]}', style: AppText.muted()),
                    ),
                ],
                _title('filters.cancellation'.tr()),
                CheckboxListTile(
                  key: const Key('filter-free-cancellation'),
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  activeColor: AppColors.accent,
                  value: _f.freeCancellation,
                  onChanged: (v) => setState(() => _f = _f.copyWith(freeCancellation: v ?? false)),
                  title: Text('filters.free_cancellation'.tr(), style: AppText.body()),
                  secondary: Text('$free', style: AppText.muted()),
                ),
                _title('filters.shuttle'.tr()),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final limit in [...shuttleLimits, null])
                      PillChip(
                        key: Key('filter-shuttle-${limit ?? 'any'}'),
                        label: limit == null ? 'filters.shuttle_any'.tr() : 'filters.shuttle_max'.tr(args: ['$limit']),
                        selected: _f.maxShuttle == limit,
                        onTap: () => setState(() => _f = _f.copyWith(maxShuttle: () => limit)),
                      ),
                  ],
                ),
                if (ceiling > 0) ...[
                  _title('filters.total_price'.tr()),
                  Slider(
                    key: const Key('filter-price'),
                    value: price.toDouble(),
                    min: 0,
                    max: ceiling.toDouble(),
                    divisions: ceiling ~/ 500,
                    activeColor: AppColors.accent,
                    label: 'filters.up_to'.tr(args: [formatWholeEuros(price)]),
                    semanticFormatterCallback: (v) => 'filters.up_to'.tr(args: [formatWholeEuros(v.round())]),
                    onChanged: (v) => setState(() => _f = _f.copyWith(maxPriceCents: () => v.round() >= ceiling ? null : v.round())),
                  ),
                  ExcludeSemantics(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(formatWholeEuros(0), style: AppText.muted(size: 13)),
                        Text('filters.up_to'.tr(args: [formatWholeEuros(price)]), style: AppText.muted(size: 13)),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            child: GradientButton(
              key: const Key('filters-apply'),
              label: _count == 0 ? 'filters.apply_none'.tr() : (_count == 1 ? 'filters.apply_one'.tr() : 'filters.apply'.tr(args: ['$_count'])),
              onPressed: () => Navigator.of(context).pop(_f),
            ),
          ),
        ],
      ),
    );
  }

  Widget _title(String text) => Padding(
    padding: const EdgeInsets.only(top: 14, bottom: 4),
    child: Semantics(header: true, child: Text(text, style: AppText.strong(size: 15))),
  );
}
