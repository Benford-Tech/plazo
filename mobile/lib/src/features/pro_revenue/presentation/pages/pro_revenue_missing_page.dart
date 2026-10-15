import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/helpers/money.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../data/models/revenue_models.dart';
import '../bloc/pro_revenue_bloc.dart';
import '../widgets/revenue_labels.dart';

/// « À compléter » (13/10/2026): the bookings of the period shown without an amount, the most recent first, each with
/// its amount to type; once saved it leaves the list and counts in the revenue. Shares the revenue page's bloc.
@RoutePage()
class ProRevenueMissingPage extends StatelessWidget implements AutoRouteWrapper {
  const ProRevenueMissingPage({super.key, this.bloc});

  /// The revenue page's; opened from its address alone, the screen reads the current month itself.
  final ProRevenueBloc? bloc;

  @override
  Widget wrappedRoute(BuildContext context) => bloc != null
      ? BlocProvider.value(value: bloc!, child: this)
      : BlocProvider(create: (_) => locator<ProRevenueBloc>()..add(const ProRevenueStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProRevenueBloc, ProRevenueState>(
      builder: (context, state) {
        final report = state.report;
        final missing = report?.missing ?? const <RevenueMissingModel>[];
        final count = report?.withoutAmount ?? 0;
        return Scaffold(
          appBar: BrandAppBar(title: 'revenue.missing_page'.tr(args: ['$count'])),
          // Edge-to-edge (Android 15+): the end of the list stays above the navigation bar and, in landscape, the amounts keep
          // clear of a side bar or cutout.
          body: SafeArea(
            top: false,
            child: ListView(
              key: const Key('revenue-missing-list'),
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 32),
              children: [
                Text('revenue.missing_intro'.tr(), style: AppText.muted()),
                const SizedBox(height: 10),
                if (missing.isEmpty)
                  AppCard(
                    child: Text('revenue.missing_done'.tr(), key: const Key('revenue-missing-done'), style: AppText.body()),
                  )
                else
                  for (final m in missing) ...[
                    _MissingCard(key: ValueKey('revenue-row-${m.id}'), booking: m, saving: state.saving.contains(m.id), error: state.rowErrors[m.id]),
                    const SizedBox(height: 10),
                  ],
                if (state.savedName != null && state.savedCents != null) ...[
                  Semantics(
                    liveRegion: true,
                    child: Container(
                      key: const Key('revenue-saved'),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: const BoxDecoration(color: AppStatus.okSoft, borderRadius: BorderRadius.all(Radius.circular(12))),
                      child: Row(
                        children: [
                          const Icon(Icons.check_rounded, size: 18, color: AppStatus.okText),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'revenue.saved'.tr(args: [state.savedName!, formatEuros(state.savedCents!)]),
                              style: AppText.body(size: 13.5, weight: 600, color: AppStatus.okText),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                if (count > missing.length && missing.isNotEmpty) ...[
                  Text('revenue.missing_more'.tr(args: ['${missing.length}']), style: AppText.muted(size: 12.5)),
                  const SizedBox(height: 6),
                ],
                Text('revenue.missing_plazo'.tr(args: [Product.name]), style: AppText.muted(size: 12.5)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _MissingCard extends StatefulWidget {
  const _MissingCard({super.key, required this.booking, required this.saving, this.error});
  final RevenueMissingModel booking;
  final bool saving;
  final RevenueRowError? error;

  @override
  State<_MissingCard> createState() => _MissingCardState();
}

class _MissingCardState extends State<_MissingCard> {
  final _amount = TextEditingController();

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    context.read<ProRevenueBloc>().add(ProRevenuePriceSubmitted(id: widget.booking.id, text: _amount.text));
  }

  String? get _errorText {
    final e = widget.error;
    if (e == null) return null;
    return switch (e.code) {
      'invalid' => 'res.price_invalid'.tr(),
      'price_locked' => 'res.price_locked'.tr(args: [Product.name]),
      'reservation_closed' => 'revenue.closed'.tr(),
      'not_found' => 'revenue.gone'.tr(),
      _ => e.message ?? 'errors.generic'.tr(),
    };
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.booking;
    final name = b.customerName.trim().isEmpty ? b.reference : b.customerName;
    final error = _errorText;
    final details = [
      revenueChannelName(b.channel, b.detail),
      b.reference,
      'revenue.arrival'.tr(args: [DateFormat('d MMM', 'fr_FR').format(b.arrivalAt.toLocal())]),
    ].join(' · ');
    return AppCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: AppText.strong()),
                    const SizedBox(height: 2),
                    Text(details, style: AppText.tabular(size: 11, weight: 500, color: AppColors.muted)),
                  ],
                ),
              ),
              if (b.plate != null && b.plate!.isNotEmpty) ...[const SizedBox(width: 8), FrenchPlate(b.plate!, size: 12)],
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Flexible(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 160),
                  child: TextField(
                    key: Key('revenue-amount-${b.id}'),
                    controller: _amount,
                    enabled: !widget.saving,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _submit(),
                    style: AppText.tabular(size: 16, weight: 600),
                    decoration: InputDecoration(
                      // « Montant » on screen; « Montant de Marc Petit en euros » for a screen reader.
                      label: Semantics(
                        label: 'revenue.amount_for'.tr(args: [name]),
                        excludeSemantics: true,
                        child: Text('revenue.amount_label'.tr()),
                      ),
                      hintText: '0,00',
                      suffixText: '€',
                      isDense: true,
                      border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: const BorderRadius.all(Radius.circular(10)),
                        borderSide: BorderSide(color: error == null ? AppColors.panelLine : AppColors.danger),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              FilledButton(
                key: Key('revenue-save-${b.id}'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.action,
                  foregroundColor: AppColors.onAccent,
                  minimumSize: const Size(44, 46),
                  shape: const StadiumBorder(),
                ),
                onPressed: widget.saving ? null : _submit,
                child: widget.saving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: AppColors.onAccent))
                    : Text('revenue.save'.tr(), style: AppText.strong(size: 14, color: AppColors.onAccent)),
              ),
            ],
          ),
          if (error != null) ...[
            const SizedBox(height: 6),
            Semantics(
              liveRegion: true,
              child: Text(
                error,
                key: Key('revenue-error-${b.id}'),
                style: AppText.body(size: 12.5, color: AppColors.danger),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
