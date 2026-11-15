import 'package:easy_localization/easy_localization.dart';

import '../data/whatsapp_inbox_data_source.dart';

/// 15/11/2026: « SMS · remis ✓✓ » for an SMS Plazo sent, the WhatsApp state otherwise ('' when unknown).
String sentStatusLabel(WaSent sent) {
  final key = sent.sms ? 'whatsapp_inbox.sms_sent_status.${sent.status}' : 'whatsapp_inbox.sent_status.${sent.status}';
  final text = key.tr() == key ? '' : key.tr();
  if (!sent.sms) return text;
  return ['whatsapp_inbox.sms_badge'.tr(), if (text.isNotEmpty) text].join(' · ');
}
