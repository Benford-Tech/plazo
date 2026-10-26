import 'dart:typed_data';

import 'package:share_plus/share_plus.dart';

/// The phone's share sheet (SMS, WhatsApp, mail…): « Partager » of the code du jour (13/10/2026).
abstract class ShareService {
  Future<void> shareText(String text, {String? subject});

  /// A file built in memory (a contract PDF, 26/10/2026): the sheet opens it, saves it or sends it.
  Future<void> shareBytes(Uint8List bytes, {required String name, required String mimeType});
}

class SystemShareService implements ShareService {
  @override
  Future<void> shareText(String text, {String? subject}) => SharePlus.instance.share(ShareParams(text: text, subject: subject));

  @override
  Future<void> shareBytes(Uint8List bytes, {required String name, required String mimeType}) =>
      SharePlus.instance.share(ShareParams(files: [XFile.fromData(bytes, mimeType: mimeType, name: name)], fileNameOverrides: [name]));
}
