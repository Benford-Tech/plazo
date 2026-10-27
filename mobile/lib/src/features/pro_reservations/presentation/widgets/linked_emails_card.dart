import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../data/datasources/linked_emails_data_source.dart';

String _when(DateTime at) => DateFormat('d MMM HH:mm', 'fr_FR').format(at.toLocal());

/// A changed value as the staff read it: a price in euros, a local date « 2026-12-13 20:30 », « — » for nothing.
String _changeValue(String field, String? value) {
  if (value == null || value.isEmpty) return '—';
  if (field == 'priceCents') {
    final cents = int.tryParse(value);
    if (cents != null) return '${(cents / 100).toStringAsFixed(2).replaceAll('.', ',')} €';
  }
  if (field == 'status') {
    final key = 'pro.status.$value';
    final label = key.tr();
    return label == key ? value : label;
  }
  return value.replaceFirst('T', ' ');
}

String _fieldLabel(String field) {
  final key = 'res.mails.field.$field';
  final label = key.tr();
  return label == key ? field : label;
}

(Color, Color) _tone(String role) => switch (role) {
  'created' => (AppStatus.okSoft, AppStatus.okText),
  'change' => (AppStatus.infoSoft, AppStatus.info),
  'cancellation' => (AppStatus.badSoft, AppStatus.badText),
  'duplicate' => (AppStatus.warnSoft, AppStatus.warnText),
  _ => (AppColors.canvas, AppColors.muted),
};

class _RolePill extends StatelessWidget {
  const _RolePill(this.role);
  final String role;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _tone(role);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.pill),
      child: Text('res.mails.role.$role'.tr(), style: AppText.body(size: 11, weight: 700, color: fg)),
    );
  }
}

/// Plazo Pro, on a booking's sheet: « Mails liés » (27/10/2026, direction C): the mails that made, changed, cancelled or
/// repeated the booking, oldest first; a tap opens the mail in a sheet. Hidden when the booking has none.
class LinkedEmailsCard extends StatefulWidget {
  const LinkedEmailsCard({super.key, required this.reservationId});
  final String reservationId;

  @override
  State<LinkedEmailsCard> createState() => _LinkedEmailsCardState();
}

class _LinkedEmailsCardState extends State<LinkedEmailsCard> {
  List<LinkedEmailModel> _emails = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!locator.isRegistered<LinkedEmailsDataSource>()) return;
    try {
      final emails = await locator<LinkedEmailsDataSource>().fetch(widget.reservationId);
      if (mounted) setState(() => _emails = emails);
    } catch (_) {
      // Nothing to show: the booking's page stays as it was.
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_emails.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('res.mails.title'.tr(args: ['${_emails.length}']).toUpperCase(), style: AppText.label(size: 11)),
          const SizedBox(height: 6),
          AppCard(
            key: const Key('linked-emails'),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Column(
              children: [
                for (final (i, e) in _emails.indexed) ...[
                  if (i > 0) const Divider(height: 1, color: AppColors.line),
                  InkWell(
                    key: Key('linked-email-${e.id}'),
                    onTap: () => showLinkedEmail(context, e),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          _RolePill(e.role),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  e.subject ?? 'res.mails.no_subject'.tr(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.body(size: 14, weight: 600),
                                ),
                                Text(
                                  [e.provider ?? e.fromName ?? e.fromAddress ?? 'res.mails.unknown_sender'.tr(), _when(e.receivedAt)].join(' · '),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.muted(size: 12),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The mail in a sheet: subject, sender, date, what Plazo understood or changed, and its text (or that it was cleared).
Future<void> showLinkedEmail(BuildContext context, LinkedEmailModel e) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(18))),
    builder: (context) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      builder: (context, controller) => ListView(
        key: const Key('linked-email-sheet'),
        controller: controller,
        padding: EdgeInsets.fromLTRB(18, 14, 18, 18 + MediaQuery.paddingOf(context).bottom),
        children: [
          Row(
            children: [
              _RolePill(e.role),
              const Spacer(),
              IconButton(
                tooltip: 'res.mails.close'.tr(),
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          Text(e.subject ?? 'res.mails.no_subject'.tr(), style: AppText.title(size: 20)),
          const SizedBox(height: 8),
          Text('res.mails.from'.tr(args: [e.fromName ?? e.fromAddress ?? 'res.mails.unknown_sender'.tr()]), style: AppText.muted(size: 13)),
          Text('res.mails.received'.tr(args: [_when(e.receivedAt)]), style: AppText.muted(size: 13)),
          if (e.provider != null) Text('res.mails.recognised'.tr(args: [e.provider!]), style: AppText.body(size: 13, weight: 600, color: AppColors.accent)),
          if (e.summary != null) ...[const SizedBox(height: 8), Text(e.summary!, style: AppText.body(size: 13.5))],
          if (e.changes.isNotEmpty) ...[
            const SizedBox(height: 10),
            for (final c in e.changes)
              Text('${_fieldLabel(c.field)} : ${_changeValue(c.field, c.from)} → ${_changeValue(c.field, c.to)}', style: AppText.body(size: 13)),
          ],
          const Divider(height: 24, color: AppColors.line),
          if (e.textBody != null)
            SelectableText(e.textBody!.trim(), key: const Key('linked-email-body'), style: AppText.body(size: 14.5))
          else
            Text('res.mails.text_gone'.tr(), style: AppText.muted(size: 13.5)),
        ],
      ),
    ),
  );
}
