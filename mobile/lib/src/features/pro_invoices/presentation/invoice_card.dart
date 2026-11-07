import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/utils/error_message_handler.dart';
import '../../../di/locator.dart';
import '../../../shared/theme/theme.dart';
import '../../../shared/widgets/app_card.dart';
import '../data/invoice_data_source.dart';
import 'invoice_pdf_page.dart';

String _euros(int cents) {
  final abs = cents.abs();
  final whole = (abs ~/ 100).toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ' ');
  return '${cents < 0 ? '-' : ''}$whole,${(abs % 100).toString().padLeft(2, '0')} €';
}

String _when(DateTime at) => DateFormat('d MMM yyyy HH:mm', 'fr_FR').format(at.toLocal());

/// Plazo Pro, on a booking's sheet: « Facture » (06/11/2026, « une facture au nom du parking avec son logo », direction
/// A): issue the invoice in the parking's name, read it, send it by e-mail, or cancel it by a credit note. The invoicing
/// details themselves are filled on the web pro space (Parking › Réglages).
class InvoiceCard extends StatefulWidget {
  const InvoiceCard({super.key, required this.reservationId, this.readOnly = false});
  final String reservationId;

  /// The demo: nothing is issued or sent.
  final bool readOnly;

  @override
  State<InvoiceCard> createState() => _InvoiceCardState();
}

class _InvoiceCardState extends State<InvoiceCard> {
  ReservationInvoicesModel? _data;
  bool _busy = false;

  InvoiceDataSource get _source => locator<InvoiceDataSource>();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!locator.isRegistered<InvoiceDataSource>()) return;
    try {
      final data = await _source.fetch(widget.reservationId);
      if (mounted) setState(() => _data = data);
    } catch (_) {
      // Nothing to show: the booking's sheet stays as it was.
    }
  }

  void _snack(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  String _error(DioException e) {
    final code = e.errorCode;
    final key = 'invoice.errors.$code';
    final text = key.tr();
    return code != null && text != key ? text : e.errorMessage;
  }

  Future<void> _run(Future<void> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } on DioException catch (e) {
      if (mounted) _snack(_error(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _create() => _run(() async {
    final data = await _source.create(widget.reservationId);
    if (!mounted) return;
    setState(() => _data = data);
    final issued = data.invoices.where((i) => !i.isCreditNote).firstOrNull;
    if (issued != null) _snack('invoice.created'.tr(namedArgs: {'number': issued.number}));
  });

  Future<void> _send(InvoiceModel invoice) async {
    var email = invoice.customerEmail ?? _data?.customerEmail;
    if (email == null || email.isEmpty) {
      email = await _askEmail();
      if (email == null) return;
    }
    final to = email;
    await _run(() async {
      final sentTo = await _source.send(invoice.id, email: invoice.customerEmail == to ? null : to);
      if (!mounted) return;
      _snack('invoice.sent'.tr(namedArgs: {'email': sentTo}));
      await _load();
    });
  }

  Future<String?> _askEmail() async {
    final email = await showDialog<String>(context: context, builder: (_) => const _EmailDialog());
    return email == null || email.isEmpty ? null : email;
  }

  Future<void> _credit(InvoiceModel invoice) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('invoice.credit'.tr()),
        content: Text('invoice.credit_confirm'.tr(namedArgs: {'number': invoice.number})),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text('common.back'.tr())),
          TextButton(key: const Key('invoice-credit-confirm'), onPressed: () => Navigator.of(ctx).pop(true), child: Text('invoice.credit'.tr())),
        ],
      ),
    );
    if (ok != true) return;
    await _run(() async {
      final data = await _source.creditNote(invoice.id);
      if (!mounted) return;
      setState(() => _data = data);
      final note = data.invoices.where((i) => i.isCreditNote).firstOrNull;
      if (note != null) _snack('invoice.credit_done'.tr(namedArgs: {'number': note.number}));
    });
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;
    if (data == null) return const SizedBox.shrink();
    final refusal = data.refusal;
    final refusalKey = 'invoice.refusal.$refusal';
    final refusalText = refusal == null || refusal == 'invoice_exists' ? null : refusalKey.tr();
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: AppCard(
        key: const Key('invoice-card'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('invoice.title'.tr(), style: AppText.strong(size: 15)),
            if (data.requestedAt != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  data.requestedCompany == null
                      ? 'invoice.requested'.tr(namedArgs: {'date': _when(data.requestedAt!)})
                      : 'invoice.requested_company'.tr(namedArgs: {'date': _when(data.requestedAt!), 'company': data.requestedCompany!}),
                  key: const Key('invoice-requested'),
                  style: AppText.body(size: 13, weight: 600, color: AppStatus.warnText),
                ),
              ),
            for (final invoice in data.invoices)
              _InvoiceRow(
                key: Key('invoice-${invoice.number}'),
                invoice: invoice,
                busy: _busy,
                readOnly: widget.readOnly,
                onOpen: () => InvoicePdfPage.open(context, invoice),
                onSend: () => _send(invoice),
                onCredit: () => _credit(invoice),
              ),
            if (data.canCreate && !widget.readOnly)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: FilledButton(
                  key: const Key('invoice-create'),
                  onPressed: _busy ? null : _create,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.action,
                    foregroundColor: AppColors.onAccent,
                    minimumSize: const Size(0, 44),
                  ),
                  child: Text('invoice.create'.tr()),
                ),
              )
            else if (refusalText != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(refusalText, key: const Key('invoice-refusal'), style: AppText.muted(size: 13)),
              ),
          ],
        ),
      ),
    );
  }
}

class _InvoiceRow extends StatelessWidget {
  const _InvoiceRow({
    super.key,
    required this.invoice,
    required this.busy,
    required this.readOnly,
    required this.onOpen,
    required this.onSend,
    required this.onCredit,
  });

  final InvoiceModel invoice;
  final bool busy;
  final bool readOnly;
  final VoidCallback onOpen;
  final VoidCallback onSend;
  final VoidCallback onCredit;

  @override
  Widget build(BuildContext context) {
    final kind = (invoice.isCreditNote ? 'invoice.credit_note' : 'invoice.invoice').tr();
    final lines = [
      'invoice.issued'.tr(namedArgs: {'date': _when(invoice.issuedAt)}),
      if (invoice.sentAt != null && invoice.sentTo != null)
        'invoice.sent_to'.tr(namedArgs: {'email': invoice.sentTo!, 'date': _when(invoice.sentAt!)})
      else
        'invoice.not_sent'.tr(),
      if (invoice.creditOf != null) 'invoice.credit_of'.tr(namedArgs: {'number': invoice.creditOf!}),
      if (invoice.creditedBy != null) 'invoice.credited_by'.tr(namedArgs: {'number': invoice.creditedBy!}),
    ];
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text('$kind ${invoice.number}', style: AppText.strong(size: 14))),
              Text(_euros(invoice.totalTtcCents), style: AppText.tabular(size: 14)),
            ],
          ),
          const SizedBox(height: 2),
          Text(lines.join(' · '), style: AppText.muted(size: 12.5)),
          Wrap(
            spacing: 4,
            children: [
              TextButton(key: Key('invoice-open-${invoice.number}'), onPressed: onOpen, child: Text('invoice.open'.tr())),
              if (!readOnly)
                TextButton(
                  key: Key('invoice-send-${invoice.number}'),
                  onPressed: busy ? null : onSend,
                  child: Text((invoice.sentAt == null ? 'invoice.send' : 'invoice.resend').tr()),
                ),
              if (!readOnly && !invoice.isCreditNote && invoice.creditedBy == null)
                TextButton(key: Key('invoice-credit-${invoice.number}'), onPressed: busy ? null : onCredit, child: Text('invoice.credit'.tr())),
            ],
          ),
        ],
      ),
    );
  }
}

/// The customer's e-mail address when the booking has none; the dialog owns its field's controller.
class _EmailDialog extends StatefulWidget {
  const _EmailDialog();

  @override
  State<_EmailDialog> createState() => _EmailDialogState();
}

class _EmailDialogState extends State<_EmailDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('invoice.send_to'.tr()),
      content: TextField(
        key: const Key('invoice-email'),
        controller: _controller,
        autofocus: true,
        keyboardType: TextInputType.emailAddress,
        decoration: const InputDecoration(hintText: 'nom@exemple.fr'),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text('common.back'.tr())),
        TextButton(
          key: const Key('invoice-email-send'),
          onPressed: () => Navigator.of(context).pop(_controller.text.trim()),
          child: Text('invoice.send'.tr()),
        ),
      ],
    );
  }
}
