import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/helpers/money.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../data/models/extras_models.dart';
import '../bloc/staff_extras_bloc.dart';
import 'extra_widgets.dart';

/// Plazo Pro, on a booking's sheet: « Services commandés » (21/10/2026). Hidden when nothing was ordered. « Accepter »
/// (29/10/2026) tells the traveller the team will do it.
class StaffExtrasCard extends StatelessWidget {
  const StaffExtrasCard({super.key, required this.reservationId, required this.canAct});
  final String reservationId;

  /// May mark the services done or not possible (`reservations:status`).
  final bool canAct;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => locator<StaffExtrasBloc>()..add(StaffExtrasStarted(reservationId)),
      child: StaffExtrasView(canAct: canAct),
    );
  }
}

class StaffExtrasView extends StatelessWidget {
  const StaffExtrasView({super.key, required this.canAct});
  final bool canAct;

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<StaffExtrasBloc, StaffExtrasState>(
      listenWhen: (a, b) => (b.notice != null && a.notice != b.notice) || (b.errorCode != null && a.errorCode != b.errorCode),
      listener: (context, state) {
        final key = 'extras.errors.${state.errorCode}';
        final text = state.errorCode != null
            ? (key.tr() == key ? translateErrorCode(state.errorCode) : key.tr())
            : 'extras.staff_notice.${state.notice}'.tr();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
        context.read<StaffExtrasBloc>().add(const StaffExtrasNoticeShown());
      },
      builder: (context, state) {
        final orders = state.data?.extras ?? const <ExtraOrderModel>[];
        if (orders.isEmpty) return const SizedBox.shrink();
        final toDo = orders.where((o) => o.toDo).length;
        return Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(child: Text('extras.staff_title'.tr().toUpperCase(), style: AppText.label(size: 11))),
                  if (toDo > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: const BoxDecoration(color: AppStatus.warnSoft, borderRadius: AppRadius.pill),
                      child: Text('extras.to_do_count'.plural(toDo), style: AppText.body(size: 11, weight: 700, color: AppStatus.warnText)),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              AppCard(
                key: const Key('staff-extras'),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: Column(
                  children: [for (final o in orders) _StaffOrderRow(order: o, canAct: canAct, busy: state.busyId == o.id, disabled: state.busy)],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _StaffOrderRow extends StatelessWidget {
  const _StaffOrderRow({required this.order, required this.canAct, required this.busy, required this.disabled});
  final ExtraOrderModel order;
  final bool canAct;
  final bool busy;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final price = formatEuros(order.priceCents);
    final detail = switch (order.status) {
      'done' when order.doneAt != null => 'extras.done_by'.tr(args: [extraWhen(order.doneAt!), order.doneBy ?? '']).trim(),
      'refused' => [
        'extras.refused_line'.tr(args: [price]),
        if (order.refusedReason != null) '« ${order.refusedReason} »',
      ].join(' · '),
      'refunded' => 'extras.refunded_line'.tr(args: [price]),
      _ when order.acceptedAt != null => [
        'extras.paid_before_return'.tr(args: [price]),
        'extras.accepted_by'.tr(args: [order.acceptedBy ?? '']).trim(),
      ].join(' · '),
      _ => 'extras.paid_before_return'.tr(args: [price]),
    };
    return Padding(
      key: Key('staff-extra-${order.kind}'),
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              ExtraIconTile(order.kind, size: 30),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.label, style: AppText.strong(size: 14)),
                    Text(detail, style: AppText.muted(size: 12)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              ExtraStatusPill(order, staff: true),
            ],
          ),
          if (order.toDo && canAct) ...[
            const SizedBox(height: 8),
            Wrap(
              alignment: WrapAlignment.end,
              crossAxisAlignment: WrapCrossAlignment.center,
              runSpacing: 6,
              children: [
                TextButton(
                  key: Key('extra-refuse-${order.kind}'),
                  onPressed: disabled ? null : () => _refuse(context),
                  child: Text('extras.refuse'.tr(), style: AppText.strong(size: 13, color: AppColors.muted)),
                ),
                if (order.acceptedAt == null) ...[
                  const SizedBox(width: 6),
                  OutlinedButton(
                    key: Key('extra-accept-${order.kind}'),
                    onPressed: disabled ? null : () => context.read<StaffExtrasBloc>().add(StaffExtraAccepted(order.id)),
                    child: Text('extras.accept'.tr()),
                  ),
                ],
                const SizedBox(width: 6),
                FilledButton(
                  key: Key('extra-done-${order.kind}'),
                  onPressed: disabled ? null : () => context.read<StaffExtrasBloc>().add(StaffExtraDone(order.id)),
                  child: busy
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text('extras.mark_done'.tr()),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _refuse(BuildContext context) async {
    final bloc = context.read<StaffExtrasBloc>();
    final reason = await showDialog<String>(
      context: context,
      builder: (_) => _RefuseDialog(order: order),
    );
    if (reason != null) bloc.add(StaffExtraRefused(order.id, reason: reason));
  }
}

/// « Pas possible ? »: an optional reason, then the refund. Pops the reason ('' without one), null when cancelled.
class _RefuseDialog extends StatefulWidget {
  const _RefuseDialog({required this.order});
  final ExtraOrderModel order;

  @override
  State<_RefuseDialog> createState() => _RefuseDialogState();
}

class _RefuseDialogState extends State<_RefuseDialog> {
  final _reason = TextEditingController();

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('extras.refuse_title'.tr(args: [widget.order.label])),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('extras.refuse_text'.tr(args: [formatEuros(widget.order.priceCents)]), style: AppText.muted(size: 13)),
          const SizedBox(height: 10),
          TextField(
            key: const Key('extra-refuse-reason'),
            controller: _reason,
            maxLength: 200,
            decoration: InputDecoration(labelText: 'extras.refuse_reason'.tr()),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text('extras.cancel'.tr())),
        FilledButton(
          key: const Key('extra-refuse-confirm'),
          onPressed: () => Navigator.of(context).pop(_reason.text),
          child: Text('extras.refuse_confirm'.tr()),
        ),
      ],
    );
  }
}
