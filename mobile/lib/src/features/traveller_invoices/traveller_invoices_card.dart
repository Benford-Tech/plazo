import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:pdfrx/pdfrx.dart';

import '../../core/utils/error_message_handler.dart';
import '../../di/locator.dart';
import '../../services/share_service.dart';
import '../../shared/theme/theme.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/gradient_button.dart';
import 'traveller_invoices_data_source.dart';

String _euros(int cents) {
  final abs = cents.abs();
  final whole = (abs ~/ 100).toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ' ');
  return '${cents < 0 ? '-' : ''}$whole,${(abs % 100).toString().padLeft(2, '0')} €';
}

String _day(DateTime at) => DateFormat('d MMMM yyyy', 'fr_FR').format(at.toLocal());

/// « Facture » on Ma réservation (07/11/2026, « Le client peut retrouver ses factures dans Plazo », A + C): the invoices
/// the parking issued for this stay, read in the app and shared from the phone's sheet, or « Demander la facture »
/// (company and address optional) when there is none yet. Hidden while there is nothing to show nor to ask.
class TravellerInvoicesCard extends StatefulWidget {
  const TravellerInvoicesCard({super.key, required this.reference});
  final String reference;

  @override
  State<TravellerInvoicesCard> createState() => _TravellerInvoicesCardState();
}

class _TravellerInvoicesCardState extends State<TravellerInvoicesCard> {
  TravellerInvoicesModel? _data;
  bool _busy = false;
  String? _error;
  final _company = TextEditingController();
  final _address = TextEditingController();

  TravellerInvoicesDataSource get _source => locator<TravellerInvoicesDataSource>();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _company.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!locator.isRegistered<TravellerInvoicesDataSource>()) return;
    try {
      final data = await _source.fetch(widget.reference);
      if (mounted) setState(() => _data = data);
    } catch (_) {
      // Nothing to show: the page stays as it was.
    }
  }

  Future<void> _ask() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final data = await _source.request(widget.reference, company: _company.text, address: _address.text);
      if (mounted) setState(() => _data = data);
    } on DioException catch (e) {
      final key = 'traveller_invoices.errors.${e.errorCode}';
      final text = key.tr();
      if (mounted) setState(() => _error = text != key ? text : 'traveller_invoices.errors.unknown'.tr());
    } catch (_) {
      if (mounted) setState(() => _error = 'traveller_invoices.errors.unknown'.tr());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;
    if (data == null || data.empty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: AppCard(
        key: const Key('traveller-invoices-card'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text('traveller_invoices.title'.tr(), style: AppText.strong())),
                if (data.request != null)
                  Container(
                    key: const Key('traveller-invoice-requested'),
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                    decoration: BoxDecoration(color: AppStatus.warnSoft, borderRadius: BorderRadius.circular(99)),
                    child: Text('traveller_invoices.requested_pill'.tr(), style: AppText.body(size: 11.5, weight: 700, color: AppStatus.warnText)),
                  ),
              ],
            ),
            for (final invoice in data.invoices) _Row(key: Key('traveller-invoice-${invoice.number}'), reference: widget.reference, invoice: invoice),
            if (data.request != null) ...[
              const SizedBox(height: 6),
              Text('traveller_invoices.requested'.tr(namedArgs: {'date': _day(data.request!.at)}), style: AppText.muted(size: 13)),
            ],
            if (data.canRequest) ...[
              if (data.invoices.isEmpty) ...[const SizedBox(height: 4), Text('traveller_invoices.none'.tr(), style: AppText.muted(size: 13))],
              const SizedBox(height: 10),
              TextField(
                key: const Key('traveller-invoice-company'),
                controller: _company,
                maxLength: 120,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(labelText: 'traveller_invoices.company'.tr(), counterText: ''),
              ),
              const SizedBox(height: 8),
              TextField(
                key: const Key('traveller-invoice-address'),
                controller: _address,
                maxLength: 300,
                decoration: InputDecoration(labelText: 'traveller_invoices.address'.tr(), counterText: ''),
              ),
              const SizedBox(height: 10),
              GradientButton(key: const Key('traveller-invoice-request'), label: 'traveller_invoices.request'.tr(), busy: _busy, onPressed: _ask),
            ],
            if (data.invoices.isEmpty && data.request == null && data.refusal == 'no_price') ...[
              const SizedBox(height: 4),
              Text('traveller_invoices.no_price'.tr(), style: AppText.muted(size: 13)),
            ],
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(
                _error!,
                key: const Key('traveller-invoice-error'),
                style: AppText.body(size: 13, weight: 600, color: AppStatus.badText),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({super.key, required this.reference, required this.invoice});
  final String reference;
  final TravellerInvoiceModel invoice;

  @override
  Widget build(BuildContext context) {
    final title = (invoice.isCreditNote ? 'traveller_invoices.credit_note' : 'traveller_invoices.invoice').tr(namedArgs: {'number': invoice.number});
    final detail = [
      'traveller_invoices.issued'.tr(namedArgs: {'amount': _euros(invoice.totalTtcCents), 'date': _day(invoice.issuedAt), 'issuer': invoice.issuer}),
      if (invoice.creditedBy != null) 'traveller_invoices.credited_by'.tr(namedArgs: {'number': invoice.creditedBy!}),
      if (invoice.creditOf != null) 'traveller_invoices.credit_of'.tr(namedArgs: {'number': invoice.creditOf!}),
    ].join(' · ');
    final current = !invoice.isCreditNote && invoice.creditedBy == null;
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 42,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.08),
                  border: Border.all(color: AppColors.accent.withValues(alpha: 0.35), width: 1.5),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('PDF', style: AppText.body(size: 9, weight: 800, color: AppColors.accent)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppText.strong(size: 14)),
                    Text(detail, style: AppText.muted(size: 12.5)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (current)
            GradientButton(
              key: Key('traveller-invoice-open-${invoice.number}'),
              label: 'traveller_invoices.open'.tr(),
              onPressed: () => TravellerInvoicePdfPage.open(context, reference, invoice),
            )
          else
            OutlineAction(
              key: Key('traveller-invoice-open-${invoice.number}'),
              label: 'traveller_invoices.open'.tr(),
              onPressed: () => TravellerInvoicePdfPage.open(context, reference, invoice),
            ),
        ],
      ),
    );
  }
}

/// The invoice's PDF read in the app; « Partager » hands it to the phone's sheet (save, print, send).
class TravellerInvoicePdfPage extends StatefulWidget {
  const TravellerInvoicePdfPage({super.key, required this.reference, required this.invoice});
  final String reference;
  final TravellerInvoiceModel invoice;

  static Future<void> open(BuildContext context, String reference, TravellerInvoiceModel invoice) => Navigator.of(context).push(
    MaterialPageRoute<void>(
      fullscreenDialog: true,
      builder: (_) => TravellerInvoicePdfPage(reference: reference, invoice: invoice),
    ),
  );

  @override
  State<TravellerInvoicePdfPage> createState() => _TravellerInvoicePdfPageState();
}

class _TravellerInvoicePdfPageState extends State<TravellerInvoicePdfPage> {
  late final Future<Uint8List> _bytes = locator<TravellerInvoicesDataSource>().pdf(widget.reference, widget.invoice.id);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Uint8List>(
      future: _bytes,
      builder: (context, snapshot) {
        final bytes = snapshot.data;
        return Scaffold(
          backgroundColor: AppColors.canvas,
          appBar: AppBar(
            title: Text(widget.invoice.number, style: AppText.strong(size: 16)),
            actions: [
              if (bytes != null)
                IconButton(
                  key: const Key('traveller-invoice-share'),
                  tooltip: 'traveller_invoices.share'.tr(),
                  icon: const Icon(Icons.ios_share_rounded),
                  onPressed: () => locator<ShareService>().shareBytes(bytes, name: widget.invoice.fileName, mimeType: 'application/pdf'),
                ),
            ],
          ),
          body: SafeArea(
            top: false,
            child: switch (snapshot) {
              AsyncSnapshot(hasError: true) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('traveller_invoices.file_error'.tr(), textAlign: TextAlign.center, style: AppText.body(size: 14)),
                ),
              ),
              AsyncSnapshot(data: final Uint8List data) => PdfViewer.data(
                data,
                sourceName: widget.invoice.fileName,
                params: const PdfViewerParams(backgroundColor: Color(0xFFE6E8E6)),
              ),
              _ => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            },
          ),
        );
      },
    );
  }
}
