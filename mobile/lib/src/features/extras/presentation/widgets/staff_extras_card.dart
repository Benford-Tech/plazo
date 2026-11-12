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

/// Plazo Pro, on a booking's sheet: « Services commandés » (21/10/2026). « Accepter » (29/10/2026) tells the traveller
/// the team will do it. 12/11/2026 (« Payé au parking »): with [canAdd], « Services additionnels » is always there when
/// the parking offers a service, with « + Ajouter un service » (a bottom sheet: service, price, « Payé par »).
class StaffExtrasCard extends StatelessWidget {
  const StaffExtrasCard({super.key, required this.reservationId, required this.canAct, this.canAdd = false, this.canConfigure = false});
  final String reservationId;

  /// May mark the services done or not possible (`reservations:status`).
  final bool canAct;

  /// May add a service paid at the parking (`reservations:manage`, never in the demo).
  final bool canAdd;

  /// A manager: told where to set the services when the parking offers none.
  final bool canConfigure;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => locator<StaffExtrasBloc>()..add(StaffExtrasStarted(reservationId)),
      child: StaffExtrasView(canAct: canAct, canAdd: canAdd, canConfigure: canConfigure),
    );
  }
}

class StaffExtrasView extends StatelessWidget {
  const StaffExtrasView({super.key, required this.canAct, this.canAdd = false, this.canConfigure = false});
  final bool canAct;
  final bool canAdd;
  final bool canConfigure;

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
        final services = state.data?.services ?? const <AddableExtraModel>[];
        final noneOffered = canAdd && canConfigure && state.data != null && services.isEmpty && orders.isEmpty;
        if (orders.isEmpty && !(canAdd && services.isNotEmpty) && !noneOffered) return const SizedBox.shrink();
        final toDo = orders.where((o) => o.toDo).length;
        final mayAdd = canAdd && (state.data?.canAdd ?? false);
        return Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(child: Text((canAdd ? 'extras.staff_title_all' : 'extras.staff_title').tr().toUpperCase(), style: AppText.label(size: 11))),
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
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final o in orders) _StaffOrderRow(order: o, canAct: canAct, canPay: canAdd, busy: state.busyId == o.id, disabled: state.busy),
                    if (noneOffered)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text('extras.none'.tr(), style: AppText.muted(size: 13)),
                      ),
                    if (mayAdd)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: FilledButton(
                          key: const Key('extra-add'),
                          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                          onPressed: state.busy ? null : () => _add(context, services),
                          child: state.busyId == 'add'
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                              : Text('extras.add_service'.tr()),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _add(BuildContext context, List<AddableExtraModel> services) async {
    final bloc = context.read<StaffExtrasBloc>();
    final added = await showModalBottomSheet<StaffExtraAdded>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => AddExtraSheet(services: services),
    );
    if (added != null) bloc.add(added);
  }
}

/// How a service added at the parking is paid (12/11/2026), in the mockup's order; `on_return`: « Au retour ».
const parkingPaymentChoices = ['card', 'cash', 'cheque', 'transfer', 'holiday_vouchers', 'on_return'];

/// The pill of how a service was paid: online on Plazo, at the parking (and how), or « À payer au retour ».
class ExtraPaymentPill extends StatelessWidget {
  const ExtraPaymentPill(this.order, {super.key});
  final ExtraOrderModel order;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, text) = !order.byStaff
        ? (AppStatus.infoSoft, AppStatus.info, 'extras.paid_online'.tr())
        : order.paymentMethod != null
        ? (AppColors.panel2, AppColors.muted, 'extras.paid_at_parking'.tr(args: ['extras.methods.${order.paymentMethod}'.tr()]))
        : (AppStatus.warnSoft, AppStatus.warnText, 'extras.to_collect'.tr());
    return Container(
      key: Key('extra-paid-${order.kind}'),
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.pill),
      child: Text(text, style: AppText.body(size: 11.5, weight: 700, color: fg)),
    );
  }
}

/// « Ajouter un service » (12/11/2026): the service (cards, unavailable ones greyed with why), its price (the parking's
/// by default) and « Payé par ». Pops the event to send, null when cancelled.
class AddExtraSheet extends StatefulWidget {
  const AddExtraSheet({super.key, required this.services});
  final List<AddableExtraModel> services;

  @override
  State<AddExtraSheet> createState() => _AddExtraSheetState();
}

class _AddExtraSheetState extends State<AddExtraSheet> {
  final _price = TextEditingController();
  String? _kind;
  String _method = 'card';
  String? _error;

  @override
  void initState() {
    super.initState();
    final first = widget.services.where((s) => s.available).firstOrNull;
    if (first != null) _choose(first);
  }

  @override
  void dispose() {
    _price.dispose();
    super.dispose();
  }

  void _choose(AddableExtraModel s) {
    _kind = s.kind;
    _price.text = formatEuroInput(s.priceCents);
  }

  void _submit() {
    final kind = _kind;
    if (kind == null) {
      setState(() => _error = 'extras.choose_service'.tr());
      return;
    }
    final parsed = parseEuroInput(_price.text);
    final cents = parsed.cents;
    if (!parsed.valid || cents == null || cents < 100 || cents > 100000) {
      setState(() => _error = 'extras.price_invalid'.tr());
      return;
    }
    Navigator.of(context).pop(StaffExtraAdded(kind: kind, priceCents: cents, paymentMethod: _method));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 16 + MediaQuery.viewInsetsOf(context).bottom + MediaQuery.paddingOf(context).bottom),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('extras.add_title'.tr(), style: AppText.strong(size: 18)),
            const SizedBox(height: 12),
            for (final s in widget.services)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _ServiceChoice(
                  service: s,
                  selected: _kind == s.kind,
                  onTap: s.available
                      ? () => setState(() {
                          _choose(s);
                          _error = null;
                        })
                      : null,
                ),
              ),
            const SizedBox(height: 4),
            TextField(
              key: const Key('extra-add-price'),
              controller: _price,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(labelText: 'extras.price'.tr(), suffixText: '€'),
            ),
            const SizedBox(height: 12),
            Text('extras.paid_by'.tr(), style: AppText.label(size: 11)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final m in parkingPaymentChoices)
                  ChoiceChip(
                    key: Key('extra-add-method-$m'),
                    label: Text('extras.methods.$m'.tr()),
                    selected: _method == m,
                    onSelected: (_) => setState(() => _method = m),
                  ),
              ],
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(
                _error!,
                key: const Key('extra-add-error'),
                style: AppText.body(size: 13, color: AppStatus.badText),
              ),
            ],
            const SizedBox(height: 14),
            FilledButton(
              key: const Key('extra-add-confirm'),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: _submit,
              child: Text('extras.add_submit'.tr()),
            ),
            const SizedBox(height: 4),
            TextButton(
              style: TextButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: () => Navigator.of(context).pop(),
              child: Text('extras.cancel'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}

class _ServiceChoice extends StatelessWidget {
  const _ServiceChoice({required this.service, required this.selected, required this.onTap});
  final AddableExtraModel service;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final reason = service.reason;
    final reasonKey = 'extras.staff_reason.$reason';
    final sub = service.available ? formatEuros(service.priceCents) : (reasonKey.tr() == reasonKey ? (reason ?? '') : reasonKey.tr());
    return Opacity(
      opacity: service.available ? 1 : 0.5,
      child: Material(
        color: selected ? AppColors.tintSoft : AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: selected ? AppColors.accent : AppColors.line, width: selected ? 1.5 : 1),
        ),
        child: InkWell(
          key: Key('extra-add-${service.kind}'),
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                ExtraIconTile(service.kind, size: 30),
                const SizedBox(width: 10),
                Expanded(child: Text(service.label, style: AppText.strong(size: 14))),
                Text(sub, style: AppText.muted(size: 12.5)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StaffOrderRow extends StatelessWidget {
  const _StaffOrderRow({required this.order, required this.canAct, required this.canPay, required this.busy, required this.disabled});
  final ExtraOrderModel order;
  final bool canAct;

  /// May note how a service added « Au retour » was paid.
  final bool canPay;
  final bool busy;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final price = formatEuros(order.priceCents);
    final staff = order.byStaff;
    final detail = switch (order.status) {
      'done' when order.doneAt != null => 'extras.done_by'.tr(args: [extraWhen(order.doneAt!), order.doneBy ?? '']).trim(),
      'refused' => [
        (staff ? 'extras.refused_line_staff' : 'extras.refused_line').tr(args: [price]),
        if (order.refusedReason != null) '« ${order.refusedReason} »',
      ].join(' · '),
      'refunded' => 'extras.refunded_line'.tr(args: [price]),
      _ when order.acceptedAt != null => [
        'extras.paid_before_return'.tr(args: [price]),
        'extras.accepted_by'.tr(args: [order.acceptedBy ?? '']).trim(),
      ].join(' · '),
      _ when staff => order.addedBy != null ? 'extras.added_line_by'.tr(args: [price, order.addedBy!]) : 'extras.added_line'.tr(args: [price]),
      _ => 'extras.paid_before_return'.tr(args: [price]),
    };
    final toCollect = staff && order.paymentMethod == null && (order.status == 'ordered' || order.status == 'done');
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
                    if (order.status == 'ordered' || order.status == 'done') ...[const SizedBox(height: 4), ExtraPaymentPill(order)],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              ExtraStatusPill(order, staff: true),
            ],
          ),
          if (toCollect && canPay)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(key: Key('extra-pay-${order.kind}'), onPressed: disabled ? null : () => _pay(context), child: Text('extras.mark_paid'.tr())),
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

  /// « Noter le paiement »: how the traveller paid a service added « Au retour ».
  Future<void> _pay(BuildContext context) async {
    final bloc = context.read<StaffExtrasBloc>();
    final method = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 16 + MediaQuery.paddingOf(ctx).bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('extras.paid_by'.tr(), style: AppText.strong(size: 18)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final m in parkingPaymentChoices.where((m) => m != 'on_return'))
                  ActionChip(key: Key('extra-pay-method-$m'), label: Text('extras.methods.$m'.tr()), onPressed: () => Navigator.of(ctx).pop(m)),
              ],
            ),
          ],
        ),
      ),
    );
    if (method != null) bloc.add(StaffExtraPaid(order.id, method));
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
          Text(
            widget.order.byStaff ? 'extras.refuse_text_staff'.tr() : 'extras.refuse_text'.tr(args: [formatEuros(widget.order.priceCents)]),
            style: AppText.muted(size: 13),
          ),
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
          child: Text((widget.order.byStaff ? 'extras.refuse_confirm_staff' : 'extras.refuse_confirm').tr()),
        ),
      ],
    );
  }
}
