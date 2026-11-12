import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/router/app_router.dart';
import '../../../di/locator.dart';
import '../../../shared/live_sync/live_sync.dart';
import '../../../shared/theme/theme.dart';
import '../../../shared/widgets/brand_header.dart';
import '../../../shared/widgets/segmented.dart';
import '../data/whatsapp_inbox_data_source.dart';

const _views = ['unread', 'all', 'handled', 'sent'];

/// « Messages WhatsApp » of Plazo Pro (12/11/2026, direction A of the web on a phone): the list, then the conversation
/// full screen. Unread · To handle · Handled, the newest first.
@RoutePage()
class ProWhatsappInboxPage extends StatefulWidget {
  const ProWhatsappInboxPage({super.key});

  /// The tests' data source; the locator's otherwise.
  @visibleForTesting
  static WhatsappInboxDataSource? debugSource;

  @override
  State<ProWhatsappInboxPage> createState() => _ProWhatsappInboxPageState();
}

class _ProWhatsappInboxPageState extends State<ProWhatsappInboxPage> {
  late final WhatsappInboxDataSource _source = ProWhatsappInboxPage.debugSource ?? locator<WhatsappInboxDataSource>();
  String _view = 'all';
  WaInbox? _inbox;
  List<WaSentMessage>? _sent;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final view = _view;
    try {
      // « Envoyés » reads what Plazo sent; the pills' counts still come from the conversations.
      final (inbox, sent) = await (_source.list(view == 'sent' ? 'all' : view), view == 'sent' ? _source.sent() : Future.value(null)).wait;
      if (mounted && view == _view) setState(() => (_inbox = inbox, _sent = sent, _failed = false));
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _open(WaConversation c) => _openId(c.id);

  Future<void> _openId(String id) async {
    await context.router.push(ProWhatsappConversationRoute(id: id));
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final inbox = _inbox;
    return LiveSyncListener(
      onChange: _load,
      child: Scaffold(
        appBar: BrandAppBar(pro: true, title: 'whatsapp_inbox.title'.tr()),
        body: SafeArea(
          top: false,
          child: RefreshIndicator(
            color: AppColors.accent,
            onRefresh: _load,
            child: ListView(
              key: const Key('wa-list'),
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
              children: [
                Text('whatsapp_inbox.intro'.tr(), style: AppText.muted(size: 13)),
                const SizedBox(height: 10),
                Segmented<String>(
                  key: const Key('wa-views'),
                  values: _views,
                  labels: [
                    for (final v in _views) 'whatsapp_inbox.views.$v'.tr(args: ['${inbox?.counts[v] ?? 0}']),
                  ],
                  selected: _view,
                  onChanged: (v) {
                    setState(() => (_view = v, _inbox = null, _sent = null));
                    _load();
                  },
                ),
                const SizedBox(height: 12),
                if (inbox == null && !_failed)
                  const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
                  ),
                if (_failed && inbox == null) Text('whatsapp_inbox.failed'.tr(), style: AppText.body(size: 14, color: AppColors.danger)),
                if (_view == 'sent') ...[
                  if (_sent case final sent?) ...[
                    if (sent.isEmpty) Text('whatsapp_inbox.empty.sent'.tr(), key: const Key('wa-empty'), style: AppText.muted()),
                    for (final m in sent) _SentCard(message: m, onOpen: m.conversationId == null ? null : () => _openId(m.conversationId!)),
                  ],
                ] else ...[
                  if (inbox != null && inbox.items.isEmpty) Text('whatsapp_inbox.empty.$_view'.tr(), key: const Key('wa-empty'), style: AppText.muted()),
                  if (inbox != null)
                    for (final c in inbox.items) _ConversationRow(conversation: c, onTap: () => _open(c)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// « 14:20 » today, « Hier », else « 10 nov. ».
String waWhen(DateTime at, {DateTime? now}) {
  final n = now ?? DateTime.now();
  final today = DateTime(n.year, n.month, n.day);
  final day = DateTime(at.year, at.month, at.day);
  if (day == today) return DateFormat('HH:mm').format(at);
  if (day == today.subtract(const Duration(days: 1))) return 'whatsapp_inbox.yesterday'.tr();
  return DateFormat('d MMM', 'fr_FR').format(at);
}

class _ConversationRow extends StatelessWidget {
  const _ConversationRow({required this.conversation, required this.onTap});
  final WaConversation conversation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = conversation;
    final unread = c.unread > 0;
    final name = c.name ?? c.phone;
    final booking = c.reservation;
    final sub = [
      if (booking != null) booking.externalReference ?? booking.reference else 'whatsapp_inbox.no_booking'.tr(),
      if (c.name != null && c.phone.isNotEmpty) c.phone,
    ].join(' · ');
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        child: InkWell(
          key: Key('wa-conv-${c.id}'),
          borderRadius: AppRadius.card,
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppStatus.okSoft,
                  child: Text(name.trim().isEmpty ? '?' : name.trim().characters.first.toUpperCase(), style: AppText.strong(size: 15, color: AppStatus.ok)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.body(size: 15, weight: unread ? 700 : 600),
                            ),
                          ),
                          Text(waWhen(c.lastMessageAt), style: AppText.label(size: 11, color: unread ? AppStatus.ok : AppColors.muted)),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.muted(size: 12.5)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${c.previewOut ? '${'whatsapp_inbox.you'.tr()} : ' : ''}${c.previewText}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.body(size: 13.5, weight: unread ? 600 : 400, color: unread ? AppColors.ink : AppColors.muted),
                            ),
                          ),
                          if (unread)
                            Container(
                              key: Key('wa-unread-${c.id}'),
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: const BoxDecoration(color: AppStatus.ok, borderRadius: AppRadius.pill),
                              child: Text('${c.unread}', style: AppText.strong(size: 11.5, color: Colors.white)),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SentCard extends StatelessWidget {
  const _SentCard({required this.message, required this.onOpen});
  final WaSentMessage message;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    final m = message;
    final kindKey = 'whatsapp_inbox.sent_kind.${m.sent.kind}';
    final kind = kindKey.tr() == kindKey ? 'whatsapp_inbox.sent_kind.other'.tr() : kindKey.tr();
    final statusKey = 'whatsapp_inbox.sent_status.${m.sent.status}';
    final status = statusKey.tr() == statusKey ? m.sent.status : statusKey.tr();
    final fallback = m.smsFallback && m.sent.status != 'fallback' ? ' · ${'whatsapp_inbox.sent_sms_fallback'.tr()}' : '';
    final at = m.sent.at;
    final when = waWhen(at).contains(':') ? waWhen(at) : '${waWhen(at)} ${DateFormat('HH:mm').format(at)}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        key: Key('wa-sent-${m.sent.id}'),
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        child: InkWell(
          borderRadius: AppRadius.card,
          onTap: onOpen,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(kind, style: AppText.strong(size: 14))),
                    Text(when, style: AppText.label(size: 11)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  [m.customerName ?? m.phone, ?m.reference, if (m.customerName != null) m.phone].join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.muted(size: 12.5),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(10, 7, 10, 6),
                  decoration: const BoxDecoration(color: Color(0xFFDCF8C6), borderRadius: AppRadius.chip),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (m.sent.text != null)
                        Text(m.sent.text!, style: AppText.body(size: 14))
                      else
                        Text('whatsapp_inbox.sent_no_text'.tr(), style: AppText.muted(size: 13)),
                      const SizedBox(height: 2),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text('$status$fallback', style: AppText.muted(size: 11)),
                      ),
                    ],
                  ),
                ),
                if (onOpen != null) ...[
                  const SizedBox(height: 6),
                  Text('whatsapp_inbox.open_conversation'.tr(), style: AppText.strong(size: 13, color: AppColors.accent)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
