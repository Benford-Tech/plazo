import 'dart:async';

import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:parking_app/src/core/helpers/formatters.dart';
import 'package:flutter/material.dart';

import '../../core/utils/error_message_handler.dart';
import '../../di/locator.dart';
import '../../shared/theme/theme.dart';
import '../../shared/widgets/app_card.dart';
import 'parking_messages_data_source.dart';

/// « Écrire au parking » on Ma réservation (12/11/2026, « après avoir importé ma réservation je peux écrire directement
/// au parking et ça arrive en conversation WhatsApp de Plazo Pro »): the booking's thread with the parking's team, read
/// again every 15 s while the page is open; the team's reply comes with a push.
class ParkingMessagesCard extends StatefulWidget {
  const ParkingMessagesCard({super.key, required this.reference, this.parkingName});
  final String reference;
  final String? parkingName;

  /// Every status but a payment still pending (nobody has the booking yet) or a cancellation.
  static bool relevant(String status) => status != 'pending_payment' && status != 'cancelled';

  /// Off in the tests (no polling timer left running).
  static bool pollingEnabled = true;

  @override
  State<ParkingMessagesCard> createState() => _ParkingMessagesCardState();
}

class _ParkingMessagesCardState extends State<ParkingMessagesCard> {
  final _text = TextEditingController();
  ParkingThread? _thread;
  bool _sending = false;
  String? _error;
  Timer? _timer;

  ParkingMessagesDataSource get _source => locator<ParkingMessagesDataSource>();

  @override
  void initState() {
    super.initState();
    _load();
    if (ParkingMessagesCard.pollingEnabled) _timer = Timer.periodic(const Duration(seconds: 15), (_) => _load());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _text.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!locator.isRegistered<ParkingMessagesDataSource>()) return;
    try {
      final thread = await _source.fetch(widget.reference);
      if (mounted) setState(() => _thread = thread);
    } catch (_) {
      // Nothing to show: the card stays as it was.
    }
  }

  Future<void> _send() async {
    final text = _text.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => (_sending = true, _error = null));
    try {
      final message = await _source.write(widget.reference, text);
      _text.clear();
      if (mounted) {
        setState(() => _thread = ParkingThread(messages: [...?_thread?.messages, message], canWrite: _thread?.canWrite ?? true));
      }
    } on DioException catch (e) {
      final key = 'parking_messages.errors.${e.errorCode}';
      if (mounted) setState(() => _error = key.tr() != key ? key.tr() : 'parking_messages.errors.unknown'.tr());
    } catch (_) {
      if (mounted) setState(() => _error = 'parking_messages.errors.unknown'.tr());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final thread = _thread;
    if (thread == null) return const SizedBox.shrink();
    final messages = thread.messages;
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: AppCard(
        key: const Key('parking-messages-card'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('parking_messages.title'.tr(), style: AppText.strong()),
            const SizedBox(height: 2),
            Text(
              messages.isEmpty ? 'parking_messages.intro'.tr(args: [widget.parkingName ?? 'parking_messages.the_parking'.tr()]) : 'parking_messages.hint'.tr(),
              style: AppText.muted(size: 13),
            ),
            if (messages.isNotEmpty) ...[
              const SizedBox(height: 10),
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 340),
                child: ListView(
                  key: const Key('parking-messages-thread'),
                  shrinkWrap: true,
                  reverse: true,
                  children: [for (final m in messages.reversed) _Bubble(message: m)],
                ),
              ),
            ],
            if (thread.canWrite) ...[
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      key: const Key('parking-messages-input'),
                      controller: _text,
                      minLines: 1,
                      maxLines: 5,
                      maxLength: 2000,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(hintText: 'parking_messages.placeholder'.tr(), counterText: '', isDense: true),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton.filled(
                    key: const Key('parking-messages-send'),
                    tooltip: 'parking_messages.send'.tr(),
                    onPressed: _sending ? null : _send,
                    style: IconButton.styleFrom(backgroundColor: AppColors.action, foregroundColor: Colors.white),
                    icon: _sending
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ],
            if (_error != null) ...[const SizedBox(height: 6), Text(_error!, style: AppText.body(size: 13, color: AppColors.danger))],
          ],
        ),
      ),
    );
  }
}

String _kindLabel(String kind) {
  final key = 'parking_messages.sent_kind.$kind';
  return key.tr() == key ? 'parking_messages.sent_kind.other'.tr() : key.tr();
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message});
  final ParkingMessage message;

  @override
  Widget build(BuildContext context) {
    final m = message;
    final now = DateTime.now();
    final today = m.at.year == now.year && m.at.month == now.month && m.at.day == now.day;
    final when = today ? DateFormat('HH:mm').format(m.at) : DateFormat('d MMM HH:mm', appLocale).format(m.at);
    return Align(
      alignment: m.mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        key: Key(m.mine ? 'parking-message-mine' : (m.kind != null ? 'parking-message-plazo' : 'parking-message-parking')),
        margin: const EdgeInsets.symmetric(vertical: 3),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.72),
        padding: const EdgeInsets.fromLTRB(11, 8, 11, 6),
        decoration: BoxDecoration(color: m.mine ? AppColors.tint : AppColors.canvas, borderRadius: AppRadius.chip),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (m.kind != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Text(_kindLabel(m.kind!), style: AppText.strong(size: 12, color: AppColors.muted)),
              ),
            if (m.text.isNotEmpty) SelectableText(m.text, style: AppText.body(size: 14.5)),
            const SizedBox(height: 2),
            Text([if (!m.mine && m.by != null) m.by!, when, if (m.whatsapp) 'parking_messages.whatsapp'.tr()].join(' · '), style: AppText.muted(size: 11)),
          ],
        ),
      ),
    );
  }
}
