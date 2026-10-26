import 'dart:typed_data';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:pdfrx/pdfrx.dart';

import '../../../../di/locator.dart';
import '../../../../services/share_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../data/datasources/paperwork_data_source.dart';

/// A contract PDF read in the app (26/10/2026, « le pdf doit s'afficher dans plazo »): the parking's own contract before
/// the signature, the PDF signed or the proof after. Pinch to zoom; « Partager » hands the file to the phone's share sheet.
class ContractPdfPage extends StatefulWidget {
  const ContractPdfPage({super.key, required this.owner, required this.kind, required this.title, required this.fileName});

  /// template | signed | proof
  final String kind;
  final PaperworkOwner owner;
  final String title;
  final String fileName;

  static Future<void> open(BuildContext context, {required PaperworkOwner owner, required String kind, required String title, required String fileName}) {
    return Navigator.of(context).push(
      MaterialPageRoute<void>(fullscreenDialog: true, builder: (_) => ContractPdfPage(owner: owner, kind: kind, title: title, fileName: fileName)),
    );
  }

  @override
  State<ContractPdfPage> createState() => _ContractPdfPageState();
}

class _ContractPdfPageState extends State<ContractPdfPage> {
  late Future<Uint8List> _bytes;

  @override
  void initState() {
    super.initState();
    _bytes = locator<PaperworkDataSource>().contractFile(widget.owner, widget.kind);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Uint8List>(
      future: _bytes,
      builder: (context, snapshot) {
        final bytes = snapshot.data;
        return Scaffold(
          backgroundColor: AppColors.canvas,
          appBar: AppBar(
            title: Text(widget.title, style: AppText.strong(size: 16)),
            actions: [
              if (bytes != null)
                IconButton(
                  key: const Key('contract-pdf-share'),
                  tooltip: 'paperwork.pdf_share'.tr(),
                  icon: const Icon(Icons.ios_share_rounded),
                  onPressed: () => locator<ShareService>().shareBytes(bytes, name: widget.fileName, mimeType: 'application/pdf'),
                ),
            ],
          ),
          body: SafeArea(
            top: false,
            child: switch (snapshot) {
              AsyncSnapshot(hasError: true) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('paperwork.file_error'.tr(), textAlign: TextAlign.center, style: AppText.body(size: 14)),
                ),
              ),
              AsyncSnapshot(data: final Uint8List data) => PdfViewer.data(
                data,
                sourceName: widget.fileName,
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
