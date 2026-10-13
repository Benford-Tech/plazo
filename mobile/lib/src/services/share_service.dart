import 'package:share_plus/share_plus.dart';

/// The phone's share sheet (SMS, WhatsApp, mail…): « Partager » of the code du jour (13/10/2026).
abstract class ShareService {
  Future<void> shareText(String text, {String? subject});
}

class SystemShareService implements ShareService {
  @override
  Future<void> shareText(String text, {String? subject}) => SharePlus.instance.share(ShareParams(text: text, subject: subject));
}
