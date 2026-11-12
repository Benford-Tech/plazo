import 'package:flutter/material.dart';

import '../../../di/locator.dart';
import '../../../shared/live_sync/live_sync.dart';
import '../../../shared/theme/theme.dart';
import '../data/whatsapp_inbox_data_source.dart';

/// The number of unread WhatsApp messages on « Messages WhatsApp » of Plus (12/11/2026), read again on a live change;
/// nothing when there are none.
class WhatsappUnreadBadge extends StatefulWidget {
  const WhatsappUnreadBadge({super.key});

  /// Off in the tests (no network).
  static bool enabled = true;

  @override
  State<WhatsappUnreadBadge> createState() => _WhatsappUnreadBadgeState();
}

class _WhatsappUnreadBadgeState extends State<WhatsappUnreadBadge> {
  int _count = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!WhatsappUnreadBadge.enabled || !locator.isRegistered<WhatsappInboxDataSource>()) return;
    try {
      final count = await locator<WhatsappInboxDataSource>().unreadCount();
      if (mounted) setState(() => _count = count);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => LiveSyncListener(
    onChange: _load,
    child: _count == 0
        ? const SizedBox.shrink()
        : Container(
            key: const Key('pmore-whatsapp-count'),
            margin: const EdgeInsets.only(right: 6),
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: const BoxDecoration(color: AppStatus.warn, borderRadius: AppRadius.pill),
            child: Text('$_count', style: AppText.strong(size: 11.5, color: Colors.white)),
          ),
  );
}
