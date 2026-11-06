import 'dart:typed_data';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:pdfrx/pdfrx.dart';

import '../../../di/locator.dart';
import '../../../services/share_service.dart';
import '../../../shared/theme/theme.dart';
import '../data/invoice_data_source.dart';

/// An invoice's PDF read in Plazo Pro (06/11/2026, direction A); « Partager » hands it to the phone's share sheet.
class InvoicePdfPage extends StatefulWidget {
  const InvoicePdfPage({super.key, required this.invoice});
  final InvoiceModel invoice;

  static Future<void> open(BuildContext context, InvoiceModel invoice) =>
      Navigator.of(context).push(MaterialPageRoute<void>(fullscreenDialog: true, builder: (_) => InvoicePdfPage(invoice: invoice)));

  @override
  State<InvoicePdfPage> createState() => _InvoicePdfPageState();
}

class _InvoicePdfPageState extends State<InvoicePdfPage> {
  late final Future<Uint8List> _bytes = locator<InvoiceDataSource>().pdf(widget.invoice.id);

  String get _fileName => '${widget.invoice.isCreditNote ? 'Avoir' : 'Facture'}-${widget.invoice.number}.pdf';

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
                  key: const Key('invoice-pdf-share'),
                  tooltip: 'invoice.share'.tr(),
                  icon: const Icon(Icons.ios_share_rounded),
                  onPressed: () => locator<ShareService>().shareBytes(bytes, name: _fileName, mimeType: 'application/pdf'),
                ),
            ],
          ),
          body: SafeArea(
            top: false,
            child: switch (snapshot) {
              AsyncSnapshot(hasError: true) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('invoice.file_error'.tr(), textAlign: TextAlign.center, style: AppText.body(size: 14)),
                ),
              ),
              AsyncSnapshot(data: final Uint8List data) => PdfViewer.data(
                data,
                sourceName: _fileName,
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
