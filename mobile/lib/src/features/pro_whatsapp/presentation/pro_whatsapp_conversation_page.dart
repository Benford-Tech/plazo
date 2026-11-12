import 'dart:typed_data';

import 'package:auto_route/auto_route.dart';
import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/router/app_router.dart';
import '../../../di/locator.dart';
import '../../../services/link_service.dart';
import '../../../shared/live_sync/live_sync.dart';
import '../../../shared/theme/theme.dart';
import '../../../shared/widgets/brand_header.dart';
import '../data/whatsapp_inbox_data_source.dart';
import 'pro_whatsapp_inbox_page.dart';

const _bubbleIn = Color(0xFFFFFFFF);
const _bubbleOut = Color(0xFFDCF8C6);
const _threadColour = Color(0xFFEFEAE2);

/// One conversation, as WhatsApp shows it: the traveller's messages on the left, the team's replies and what Plazo sent
/// on the right; then the reply bar while Meta allows a free reply (24 h), else « Appeler ».
@RoutePage()
class ProWhatsappConversationPage extends StatefulWidget {
  const ProWhatsappConversationPage({super.key, @PathParam('id') required this.id});

  final String id;

  /// The tests' data source; the locator's otherwise.
  @visibleForTesting
  static WhatsappInboxDataSource? debugSource;

  @override
  State<ProWhatsappConversationPage> createState() => _ProWhatsappConversationPageState();
}

class _ProWhatsappConversationPageState extends State<ProWhatsappConversationPage> {
  late final WhatsappInboxDataSource _source = ProWhatsappConversationPage.debugSource ?? locator<WhatsappInboxDataSource>();
  final _text = TextEditingController();
  final _scroll = ScrollController();
  WaThread? _thread;
  bool _failed = false;
  bool _sending = false;
  bool _handling = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _text.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final thread = await _source.get(widget.id);
      if (!mounted) return;
      final grew = (_thread?.messages.length ?? -1) != thread.messages.length;
      setState(() => (_thread = thread, _failed = false));
      if (grew) WidgetsBinding.instance.addPostFrameCallback((_) => _toBottom());
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  void _toBottom() {
    if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
  }

  String _error(Object e) {
    final body = e is DioException ? e.response?.data : null;
    final code = body is Map ? body['code'] as String? : null;
    final key = 'whatsapp_inbox.errors.${code ?? 'generic'}';
    return key.tr() == key ? 'whatsapp_inbox.errors.generic'.tr() : key.tr();
  }

  Future<void> _send() async {
    final text = _text.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await _source.reply(widget.id, text);
      _text.clear();
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_error(e))));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _toggleHandled(WaConversation c) async {
    setState(() => _handling = true);
    try {
      await _source.setHandled(c.id, c.handledAt == null);
      if (!mounted) return;
      if (c.handledAt == null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('whatsapp_inbox.handled'.tr())));
        await context.router.maybePop();
        return;
      }
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_error(e))));
    } finally {
      if (mounted) setState(() => _handling = false);
    }
  }

  Future<void> _call(String phone) => locator<LinkService>().open(Uri.parse('tel:${phone.replaceAll(RegExp(r'[^\d+]'), '')}'));

  @override
  Widget build(BuildContext context) {
    final thread = _thread;
    final c = thread?.conversation;
    return LiveSyncListener(
      onChange: _load,
      child: Scaffold(
        appBar: BrandAppBar(pro: true, title: c?.name ?? c?.phone ?? 'whatsapp_inbox.title'.tr()),
        backgroundColor: _threadBg,
        body: SafeArea(
          top: false,
          child: thread == null
              ? Center(
                  child: _failed
                      ? Text('whatsapp_inbox.failed'.tr(), style: AppText.body(size: 14, color: AppColors.danger))
                      : const CircularProgressIndicator(color: AppColors.accent),
                )
              : Column(
                  children: [
                    _Header(
                      conversation: c!,
                      handling: _handling,
                      onBooking: c.reservation == null ? null : () => context.router.push(ProReservationRoute(id: c.reservation!.id)),
                      onCall: () => _call(c.phone),
                      onHandle: () => _toggleHandled(c),
                    ),
                    Expanded(
                      child: ListView(
                        key: const Key('wa-thread'),
                        controller: _scroll,
                        padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                        children: _items(thread),
                      ),
                    ),
                    _ReplyBar(conversation: c, controller: _text, sending: _sending, onSend: _send, onCall: () => _call(c.phone)),
                  ],
                ),
        ),
      ),
    );
  }

  List<Widget> _items(WaThread thread) {
    final entries = <(DateTime, Widget)>[
      for (final m in thread.messages) (m.at, _Bubble(message: m, source: _source)),
      for (final s in thread.sent) (s.at, _SentByPlazo(sent: s)),
    ]..sort((a, b) => a.$1.compareTo(b.$1));
    final out = <Widget>[];
    DateTime? lastDay;
    for (final (at, widget) in entries) {
      final day = DateTime(at.year, at.month, at.day);
      if (day != lastDay) {
        out.add(_DaySeparator(day: day));
        lastDay = day;
      }
      out.add(widget);
    }
    return out;
  }
}

const _threadBg = _threadColour;

class _Header extends StatelessWidget {
  const _Header({required this.conversation, required this.handling, required this.onBooking, required this.onCall, required this.onHandle});
  final WaConversation conversation;
  final bool handling;
  final VoidCallback? onBooking;
  final VoidCallback onCall;
  final VoidCallback onHandle;

  @override
  Widget build(BuildContext context) {
    final c = conversation;
    final booking = c.reservation;
    final dates = booking?.arrivalAt == null
        ? ''
        : ' · ${DateFormat('d MMM', 'fr_FR').format(booking!.arrivalAt!)}${booking.returnAt == null ? '' : ' → ${DateFormat('d MMM', 'fr_FR').format(booking.returnAt!)}'}';
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  booking == null ? 'whatsapp_inbox.no_booking'.tr() : '${booking.externalReference ?? booking.reference}$dates',
                  style: AppText.body(size: 13.5, weight: 600),
                ),
              ),
              if (c.phone.isNotEmpty)
                IconButton(
                  key: const Key('wa-call'),
                  tooltip: 'whatsapp_inbox.call'.tr(args: [c.phone]),
                  onPressed: onCall,
                  icon: const Icon(Icons.call_rounded, color: AppColors.accent),
                ),
            ],
          ),
          if (c.phone.isNotEmpty) Text(c.phone, style: AppText.muted(size: 12.5)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              if (onBooking != null) OutlinedButton(key: const Key('wa-open-booking'), onPressed: onBooking, child: Text('whatsapp_inbox.open_booking'.tr())),
              FilledButton(
                key: const Key('wa-handle'),
                onPressed: handling ? null : onHandle,
                child: Text((c.handledAt == null ? 'whatsapp_inbox.handle' : 'whatsapp_inbox.unhandle').tr()),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DaySeparator extends StatelessWidget {
  const _DaySeparator({required this.day});
  final DateTime day;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final label = day == today
        ? 'whatsapp_inbox.today'.tr()
        : day == today.subtract(const Duration(days: 1))
        ? 'whatsapp_inbox.yesterday'.tr()
        : DateFormat('EEEE d MMMM', 'fr_FR').format(day);
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: AppColors.surface.withValues(alpha: 0.9), borderRadius: AppRadius.small),
        child: Text(label, style: AppText.label(size: 11)),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.source});
  final WaMessage message;
  final WhatsappInboxDataSource source;

  @override
  Widget build(BuildContext context) {
    final m = message;
    final status = m.out && m.status != null ? ' · ${'whatsapp_inbox.reply_status.${m.status}'.tr()}' : '';
    final by = m.out && m.by != null ? '${m.by} · ' : '';
    return Align(
      alignment: m.out ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        key: Key(m.out ? 'wa-out' : 'wa-in'),
        margin: const EdgeInsets.symmetric(vertical: 3),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.8),
        padding: const EdgeInsets.fromLTRB(10, 7, 10, 6),
        decoration: BoxDecoration(color: m.out ? _bubbleOut : _bubbleIn, borderRadius: AppRadius.chip),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (m.app)
              Container(
                key: const Key('wa-app'),
                margin: const EdgeInsets.only(bottom: 3),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: const BoxDecoration(color: AppColors.tint, borderRadius: AppRadius.pill),
                child: Text('whatsapp_inbox.app_badge'.tr(), style: AppText.strong(size: 10.5, color: AppColors.accent)),
              ),
            if (m.hasMedia) _Media(message: m, source: source),
            if (m.type == 'location') Text('whatsapp_inbox.location'.tr(), style: AppText.label(size: 11)),
            if (m.text != null) SelectableText(m.text!, style: AppText.body(size: 14.5)),
            const SizedBox(height: 2),
            Text('$by${DateFormat('HH:mm').format(m.at)}$status', style: AppText.muted(size: 11)),
          ],
        ),
      ),
    );
  }
}

/// A photo opens inside the app; a voice note, video or document is read on the web (no player here).
class _Media extends StatelessWidget {
  const _Media({required this.message, required this.source});
  final WaMessage message;
  final WhatsappInboxDataSource source;

  Future<void> _showImage(BuildContext context) async {
    Uint8List? bytes;
    try {
      bytes = await source.media(message.id);
    } catch (_) {}
    if (!context.mounted) return;
    if (bytes == null || bytes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('whatsapp_inbox.media_gone'.tr())));
      return;
    }
    final image = bytes;
    await showDialog<void>(
      context: context,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(12),
        child: InteractiveViewer(child: Image.memory(image, fit: BoxFit.contain)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final type = message.type;
    final label = 'whatsapp_inbox.media.${{'image', 'audio', 'video', 'document', 'sticker'}.contains(type) ? type : 'other'}'.tr();
    if (type == 'image' || type == 'sticker') {
      return TextButton.icon(
        key: Key('wa-media-${message.id}'),
        style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
        onPressed: () => _showImage(context),
        icon: const Icon(Icons.image_rounded, size: 18, color: AppColors.accent),
        label: Text(label, style: AppText.strong(size: 13.5, color: AppColors.accent)),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(type == 'audio' ? Icons.mic_rounded : Icons.attach_file_rounded, size: 18, color: AppColors.muted),
          const SizedBox(width: 6),
          Flexible(
            child: Text('$label · ${'whatsapp_inbox.media_web'.tr()}', style: AppText.body(size: 13, color: AppColors.muted)),
          ),
        ],
      ),
    );
  }
}

class _SentByPlazo extends StatelessWidget {
  const _SentByPlazo({required this.sent});
  final WaSent sent;

  @override
  Widget build(BuildContext context) {
    final kindKey = 'whatsapp_inbox.sent_kind.${sent.kind}';
    final kind = kindKey.tr() == kindKey ? 'whatsapp_inbox.sent_kind.other'.tr() : kindKey.tr();
    final statusKey = 'whatsapp_inbox.sent_status.${sent.status}';
    final status = statusKey.tr() == statusKey ? '' : ' · ${statusKey.tr()}';
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        key: const Key('wa-sent'),
        margin: const EdgeInsets.symmetric(vertical: 3),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: _bubbleOut.withValues(alpha: 0.55),
          borderRadius: AppRadius.chip,
          border: Border.all(color: AppStatus.ok.withValues(alpha: 0.35)),
        ),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'whatsapp_inbox.sent_by_plazo'.tr(args: [kind]),
              style: AppText.strong(size: 12.5, color: AppColors.muted),
            ),
            if (sent.text != null) ...[const SizedBox(height: 3), SelectableText(sent.text!, style: AppText.body(size: 14))],
            const SizedBox(height: 2),
            Text('${DateFormat('HH:mm').format(sent.at)}$status', style: AppText.muted(size: 11)),
          ],
        ),
      ),
    );
  }
}

class _ReplyBar extends StatelessWidget {
  const _ReplyBar({required this.conversation, required this.controller, required this.sending, required this.onSend, required this.onCall});
  final WaConversation conversation;
  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;
  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) {
    final until = conversation.replyUntil;
    final by = conversation.replyBy;
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(12, 8, 8, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (by == 'app')
            Text('whatsapp_inbox.reply_in_app'.tr(), key: const Key('wa-window-app'), style: AppText.muted(size: 12))
          else if (until != null)
            Text(
              'whatsapp_inbox.reply_until'.tr(args: ['${waWhen(until)}${waWhen(until).contains(':') ? '' : ' ${DateFormat('HH:mm').format(until)}'}']),
              key: const Key('wa-window'),
              style: AppText.muted(size: 12),
            )
          else ...[
            Text(
              'whatsapp_inbox.window_closed'.tr(),
              key: const Key('wa-window-closed'),
              style: AppText.body(size: 12.5, color: AppStatus.warnText),
            ),
            const SizedBox(height: 6),
            if (conversation.phone.isNotEmpty)
              OutlinedButton.icon(
                key: const Key('wa-call-bar'),
                onPressed: onCall,
                icon: const Icon(Icons.call_rounded),
                label: Text('whatsapp_inbox.call'.tr(args: [conversation.phone])),
              ),
          ],
          if (by != null) ...[
            const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    key: const Key('wa-reply'),
                    controller: controller,
                    minLines: 1,
                    maxLines: 5,
                    maxLength: 4096,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(hintText: 'whatsapp_inbox.placeholder'.tr(), counterText: '', isDense: true),
                  ),
                ),
                const SizedBox(width: 6),
                IconButton.filled(
                  key: const Key('wa-send'),
                  tooltip: 'whatsapp_inbox.send'.tr(),
                  onPressed: sending ? null : onSend,
                  style: IconButton.styleFrom(backgroundColor: AppColors.action, foregroundColor: AppColors.onAccent),
                  icon: sending ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send_rounded),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
