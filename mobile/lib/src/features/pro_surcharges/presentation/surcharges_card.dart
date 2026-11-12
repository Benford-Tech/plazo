import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/helpers/money.dart';
import '../../../core/utils/error_message_handler.dart';
import '../../../di/locator.dart';
import '../../../shared/theme/theme.dart';
import '../../../shared/widgets/app_card.dart';
import '../data/surcharges_data_source.dart';

/// « Suppléments » of a booking in Plazo Pro (12/11/2026, « fais B dans Plazo Pro aussi », the web's
/// `BookingSurchargesCard`): the late arrival Plazo spots (« Appliquer 10 € » · « Non »), the parking's supplements in one
/// touch, « Autre montant… », the list with « Retirer » and what to collect at the parking. On the booking's sheet and in
/// « Rendre ». Hidden when the parking offers none and none was applied.
class SurchargesCard extends StatefulWidget {
  const SurchargesCard({super.key, required this.reservationId, this.compact = false});
  final String reservationId;

  /// In the « Rendre » sheet: no title row nor note.
  final bool compact;

  @override
  State<SurchargesCard> createState() => _SurchargesCardState();
}

class _SurchargesCardState extends State<SurchargesCard> {
  BookingSurcharges? _data;
  bool _busy = false;

  SurchargesDataSource get _source => locator<SurchargesDataSource>();

  @override
  void initState() {
    super.initState();
    _run(() => _source.list(widget.reservationId), quiet: true);
  }

  Future<void> _run(Future<BookingSurcharges> Function() call, {String? done, bool quiet = false}) async {
    if (_busy) return;
    setState(() => _busy = true);
    // Not looked up for the first load, which runs from initState.
    final messenger = quiet ? null : ScaffoldMessenger.maybeOf(context);
    try {
      final data = await call();
      if (!mounted) return;
      setState(() => _data = data);
      if (done != null) messenger?.showSnackBar(SnackBar(content: Text(done.tr())));
    } on DioException catch (e) {
      if (!mounted || quiet) return;
      final key = 'surcharges.errors.${e.errorCode}';
      messenger?.showSnackBar(SnackBar(content: Text(key.tr() == key ? e.errorMessage : key.tr())));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _other() async {
    final result = await showModalBottomSheet<({String label, int cents})>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _OtherSheet(),
    );
    if (result == null || !mounted) return;
    await _run(
      () => _source.add(widget.reservationId, label: result.label, amountCents: result.cents),
      done: 'surcharges.added',
    );
  }

  String _time(String local) => local.length >= 16 ? local.substring(11, 16) : local;

  @override
  Widget build(BuildContext context) {
    final s = _data;
    if (s == null || s.empty) return const SizedBox.shrink();
    final id = widget.reservationId;
    final body = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (s.suggestion != null && s.canEdit) ...[
          Container(
            key: const Key('surcharge-suggestion'),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppStatus.warnSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFCD34D)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'surcharges.late_title'.tr(args: ['${s.suggestion!.lateMinutes}']),
                  style: AppText.strong(size: 14, color: AppStatus.warnText),
                ),
                const SizedBox(height: 2),
                Text(
                  'surcharges.late_text'.tr(
                    args: [_time(s.suggestion!.scheduledAt), _time(s.suggestion!.arrivedAt), formatShortEuros(s.suggestion!.amountCents)],
                  ),
                  style: AppText.body(size: 13, color: AppStatus.warnText),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton(
                        key: const Key('surcharge-apply-late'),
                        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                        onPressed: _busy ? null : () => _run(() => _source.add(id, key: 'late'), done: 'surcharges.added'),
                        child: Text('surcharges.apply'.tr(args: [formatShortEuros(s.suggestion!.amountCents)])),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      key: const Key('surcharge-dismiss'),
                      style: OutlinedButton.styleFrom(minimumSize: const Size(72, 44)),
                      onPressed: _busy ? null : () => _run(() => _source.dismiss(id)),
                      child: Text('surcharges.no'.tr()),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
        if (s.canEdit) ...[
          Text('surcharges.quick'.tr().toUpperCase(), style: AppText.label(size: 11)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final o in s.options)
                ActionChip(
                  key: Key('surcharge-add-${o.key}'),
                  label: Text('${o.label} · ${formatShortEuros(o.amountCents)}'),
                  onPressed: _busy ? null : () => _run(() => _source.add(id, key: o.key), done: 'surcharges.added'),
                ),
              ActionChip(
                key: const Key('surcharge-other'),
                label: Text('surcharges.other'.tr(), style: AppText.body(size: 13, color: AppColors.muted)),
                onPressed: _busy ? null : _other,
              ),
            ],
          ),
        ],
        if (s.surcharges.isNotEmpty) ...[
          const SizedBox(height: 8),
          const Divider(height: 16),
          for (final x in s.surcharges)
            Padding(
              key: Key('surcharge-row-${x.id}'),
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(x.label, style: AppText.strong(size: 14)),
                        Text(
                          x.by != null ? 'surcharges.added_by'.tr(args: [x.by!, _time(x.at)]) : 'surcharges.added_at'.tr(args: [_time(x.at)]),
                          style: AppText.muted(size: 12),
                        ),
                      ],
                    ),
                  ),
                  Text(formatEuros(x.amountCents), style: AppText.tabular(size: 14, weight: 500)),
                  if (s.canEdit)
                    IconButton(
                      key: Key('surcharge-remove-${x.id}'),
                      tooltip: 'surcharges.remove'.tr(),
                      icon: const Icon(Icons.close_rounded, size: 18),
                      onPressed: _busy ? null : () => _run(() => _source.remove(id, x.id), done: 'surcharges.removed'),
                    ),
                ],
              ),
            ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(child: Text('surcharges.total'.tr(), style: AppText.strong(size: 14))),
              Text(formatEuros(s.totalCents), key: const Key('surcharges-total'), style: AppText.tabular(size: 14)),
            ],
          ),
        ],
        if (!widget.compact) ...[const SizedBox(height: 8), Text('surcharges.note'.tr(), style: AppText.muted(size: 12))],
      ],
    );
    if (widget.compact) return Padding(key: const Key('surcharges-compact'), padding: const EdgeInsets.only(bottom: 10), child: body);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('surcharges.title'.tr().toUpperCase(), style: AppText.label(size: 11)),
          const SizedBox(height: 6),
          AppCard(key: const Key('surcharges-card'), child: body),
        ],
      ),
    );
  }
}

/// « Autre montant… »: a name and an amount typed on the spot.
class _OtherSheet extends StatefulWidget {
  const _OtherSheet();

  @override
  State<_OtherSheet> createState() => _OtherSheetState();
}

class _OtherSheetState extends State<_OtherSheet> {
  final _label = TextEditingController();
  final _amount = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _label.dispose();
    _amount.dispose();
    super.dispose();
  }

  void _submit() {
    final label = _label.text.trim();
    final parsed = parseEuroInput(_amount.text);
    if (label.isEmpty) return setState(() => _error = 'surcharges.label_required'.tr());
    if (!parsed.valid || parsed.cents == null || parsed.cents! <= 0 || parsed.cents! > 100000) {
      return setState(() => _error = 'surcharges.amount_invalid'.tr());
    }
    Navigator.of(context).pop((label: label, cents: parsed.cents!));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 16 + MediaQuery.viewInsetsOf(context).bottom + MediaQuery.paddingOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('surcharges.other_title'.tr(), style: AppText.strong(size: 18)),
          const SizedBox(height: 12),
          TextField(
            key: const Key('surcharge-other-label'),
            controller: _label,
            autofocus: true,
            maxLength: 80,
            decoration: InputDecoration(labelText: 'surcharges.other_label'.tr()),
          ),
          TextField(
            key: const Key('surcharge-other-amount'),
            controller: _amount,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: 'surcharges.other_amount'.tr(), suffixText: '€'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(
              _error!,
              key: const Key('surcharge-other-error'),
              style: AppText.body(size: 13, color: AppStatus.badText),
            ),
          ],
          const SizedBox(height: 14),
          FilledButton(
            key: const Key('surcharge-other-confirm'),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            onPressed: _submit,
            child: Text('surcharges.add'.tr()),
          ),
        ],
      ),
    );
  }
}
