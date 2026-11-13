import 'package:auto_route/auto_route.dart';
import 'package:dio/dio.dart';
import 'package:parking_app/src/core/helpers/formatters.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/router/app_router.dart';
import '../../../di/locator.dart';
import '../../../shared/theme/theme.dart';
import '../data/whatsapp_inbox_data_source.dart';

/// « Écrire au client » (13/11/2026, « Ajoute l'envoi par WhatsApp et par le numéro Plazo dans l'app pro », choix « Écrire
/// depuis Plazo »): the team writes to the booking's traveller from Plazo's WhatsApp number (the parking's SMS as the
/// fallback); the answer lands in « Messages WhatsApp » (the driver and the valet too, 13/11/2026).
Future<void> showWriteToTraveller(BuildContext context, {required String reservationId}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  backgroundColor: AppColors.surface,
  builder: (_) => WriteToTravellerSheet(reservationId: reservationId),
);

class WriteToTravellerSheet extends StatefulWidget {
  const WriteToTravellerSheet({super.key, required this.reservationId});
  final String reservationId;

  /// The tests' data source; the locator's otherwise.
  @visibleForTesting
  static WhatsappInboxDataSource? debugSource;

  @override
  State<WriteToTravellerSheet> createState() => _WriteToTravellerSheetState();
}

class _WriteToTravellerSheetState extends State<WriteToTravellerSheet> {
  late final WhatsappInboxDataSource _source = WriteToTravellerSheet.debugSource ?? locator<WhatsappInboxDataSource>();
  final _text = TextEditingController();
  WriteStatus? _status;
  bool _failed = false;
  bool _sending = false;
  String _channel = 'whatsapp';
  String? _error;

  @override
  void initState() {
    super.initState();
    _text.addListener(() => setState(() {}));
    _load();
  }

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final status = await _source.writeStatus(widget.reservationId);
      if (mounted) setState(() => (_status = status, _channel = status.whatsapp ? 'whatsapp' : 'sms'));
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _send() async {
    final text = _text.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => (_sending = true, _error = null));
    try {
      final result = await _source.write(widget.reservationId, text, _channel);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      StackRouter? router;
      try {
        router = context.router;
      } catch (_) {
        // A sheet shown outside the app's router (tests): no « Voir ».
      }
      Navigator.of(context).pop();
      final notice = result.channel == 'sms'
          ? (result.fallback ? 'write_traveller.sent_sms_fallback' : 'write_traveller.sent_sms')
          : 'write_traveller.sent_whatsapp';
      messenger.showSnackBar(
        SnackBar(
          content: Text(notice.tr()),
          action: router != null && result.channel == 'whatsapp' && result.conversationId != null
              ? SnackBarAction(
                  label: 'write_traveller.open'.tr(),
                  onPressed: () => router!.push(ProWhatsappConversationRoute(id: result.conversationId!)),
                )
              : null,
        ),
      );
    } on DioException catch (e) {
      final body = e.response?.data;
      final code = body is Map ? body['code'] as String? : null;
      final key = 'write_traveller.errors.${code ?? 'generic'}';
      if (mounted) setState(() => _error = key.tr() == key ? 'write_traveller.errors.generic'.tr() : key.tr());
    } catch (_) {
      if (mounted) setState(() => _error = 'write_traveller.errors.generic'.tr());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = _status;
    final bottom = MediaQuery.viewInsetsOf(context).bottom + MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(18, 0, 18, 16 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('write_traveller.title'.tr(), style: AppText.title(size: 20)),
          const SizedBox(height: 2),
          Text('write_traveller.from_plazo'.tr(), style: AppText.muted(size: 13)),
          const SizedBox(height: 12),
          if (s == null && !_failed)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(color: AppColors.accent),
              ),
            ),
          if (_failed) Text('write_traveller.errors.generic'.tr(), style: AppText.body(size: 14, color: AppColors.danger)),
          if (s != null && !s.canWrite)
            Text(
              'write_traveller.refusal.${s.refusal ?? 'no_channel'}'.tr(),
              key: const Key('write-refusal'),
              style: AppText.body(size: 14, color: AppStatus.warnText),
            ),
          if (s != null && s.canWrite) ...[
            Wrap(
              spacing: 8,
              children: [
                if (s.whatsapp)
                  ChoiceChip(
                    key: const Key('write-channel-whatsapp'),
                    label: Text('write_traveller.whatsapp'.tr()),
                    selected: _channel == 'whatsapp',
                    showCheckmark: false,
                    onSelected: (_) => setState(() => _channel = 'whatsapp'),
                  ),
                if (s.sms)
                  ChoiceChip(
                    key: const Key('write-channel-sms'),
                    label: Text('write_traveller.sms'.tr()),
                    selected: _channel == 'sms',
                    showCheckmark: false,
                    onSelected: (_) => setState(() => _channel = 'sms'),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (_channel == 'whatsapp' && s.freeUntil == null && s.frameBefore.isNotEmpty)
              Text(s.frameBefore, key: const Key('write-frame-before'), style: AppText.muted(size: 12.5)),
            const SizedBox(height: 4),
            TextField(
              key: const Key('write-text'),
              controller: _text,
              minLines: 3,
              maxLines: 6,
              maxLength: s.maxLength,
              autofocus: true,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(hintText: 'write_traveller.placeholder'.tr()),
            ),
            if (_channel == 'whatsapp' && s.freeUntil == null && s.frameAfter.isNotEmpty) Text(s.frameAfter, style: AppText.muted(size: 12.5)),
            const SizedBox(height: 6),
            Text(
              _channel == 'sms'
                  ? 'write_traveller.hint_sms'.tr()
                  : s.freeUntil != null
                  ? 'write_traveller.hint_free'.tr(args: [DateFormat('d MMM HH:mm', appLocale).format(s.freeUntil!)])
                  : 'write_traveller.hint_template'.tr(),
              key: const Key('write-hint'),
              style: AppText.muted(size: 12),
            ),
            if (_channel == 'whatsapp' && s.sms) Text('write_traveller.hint_fallback'.tr(), style: AppText.muted(size: 12)),
            if (_error != null) ...[const SizedBox(height: 8), Text(_error!, style: AppText.body(size: 13.5, color: AppColors.danger))],
            const SizedBox(height: 12),
            FilledButton(
              key: const Key('write-send'),
              onPressed: _text.text.trim().isEmpty || _sending ? null : _send,
              child: _sending
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text((_channel == 'sms' ? 'write_traveller.send_sms' : 'write_traveller.send_whatsapp').tr()),
            ),
          ],
        ],
      ),
    );
  }
}
