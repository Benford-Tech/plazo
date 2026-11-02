import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../di/locator.dart';
import '../../../shared/theme/theme.dart';
import '../../../shared/widgets/app_card.dart';
import '../data/bell_data_source.dart';

/// The events whose phone switch is already above (their older settings).
const _phoneAbove = {'booking_new', 'arrival', 'return', 'shuttle', 'platform'};

/// 02/11/2026 (« Mes notifications »): in Plus › Notifications, per event, the phone and the bell; and a test.
class ChannelsSection extends StatefulWidget {
  const ChannelsSection({super.key, this.source, this.readOnly = false});
  final BellDataSource? source;
  final bool readOnly;

  @override
  State<ChannelsSection> createState() => _ChannelsSectionState();
}

class _ChannelsSectionState extends State<ChannelsSection> {
  late final BellDataSource? _source = widget.source ?? (locator.isRegistered<BellDataSource>() ? locator<BellDataSource>() : null);
  NotificationChannels? _data;
  bool _testing = false;

  @override
  void initState() {
    super.initState();
    _source?.channels().then((d) {
      if (mounted) setState(() => _data = d);
    }, onError: (_) {});
  }

  Future<void> _set(String event, String channel, bool value) async {
    try {
      final d = await _source!.setChannel(event, channel, value);
      if (mounted) setState(() => _data = d);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('notif_channels.failed'.tr())));
    }
  }

  Future<void> _test() async {
    setState(() => _testing = true);
    try {
      final r = await _source!.test();
      if (!mounted) return;
      final text = !r.phonesConfigured
          ? 'notif_channels.test_not_configured'.tr()
          : r.phones == 0
          ? 'notif_channels.test_no_phone'.tr()
          : 'notif_channels.test_sent'.tr(args: ['${r.phones}']);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('notif_channels.failed'.tr())));
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;
    if (data == null) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('notif_channels.title'.tr(), style: AppText.strong(size: 16)),
        const SizedBox(height: 4),
        Text('notif_channels.intro'.tr(), style: AppText.muted(size: 13)),
        const SizedBox(height: 10),
        AppCard(
          key: const Key('notif-channels'),
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 4),
                child: Row(
                  children: [
                    const Spacer(),
                    SizedBox(
                      width: 72,
                      child: Text('notif_channels.phone'.tr(), textAlign: TextAlign.center, style: AppText.label(size: 11)),
                    ),
                    SizedBox(
                      width: 60,
                      child: Text('notif_channels.bell'.tr(), textAlign: TextAlign.center, style: AppText.label(size: 11)),
                    ),
                  ],
                ),
              ),
              for (final entry in data.channels.entries)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 2, 4, 2),
                  child: Row(
                    children: [
                      Expanded(child: Text('notif_channels.events.${entry.key}'.tr(), style: AppText.body(size: 14))),
                      SizedBox(
                        width: 72,
                        child: _phoneAbove.contains(entry.key)
                            ? Text('notif_channels.phone_above'.tr(), textAlign: TextAlign.center, style: AppText.muted(size: 11))
                            : Checkbox(
                                key: Key('channel-${entry.key}-phone'),
                                value: entry.value.phone,
                                activeColor: AppColors.accent,
                                onChanged: widget.readOnly ? null : (v) => _set(entry.key, 'phone', v ?? false),
                              ),
                      ),
                      SizedBox(
                        width: 60,
                        child: Checkbox(
                          key: Key('channel-${entry.key}-bell'),
                          value: entry.value.bell,
                          activeColor: AppColors.accent,
                          onChanged: widget.readOnly ? null : (v) => _set(entry.key, 'bell', v ?? false),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          key: const Key('notif-test'),
          onPressed: widget.readOnly || _testing ? null : _test,
          icon: const Icon(Icons.notifications_active_outlined),
          label: Text('notif_channels.test'.tr()),
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48), foregroundColor: AppColors.accent),
        ),
      ],
    );
  }
}
