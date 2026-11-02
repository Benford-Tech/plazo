import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/router/app_router.dart';
import '../../../di/locator.dart';
import '../../../shared/live_sync/live_sync.dart';
import '../../../shared/theme/theme.dart';
import '../data/bell_data_source.dart';

/// 02/11/2026 (« Mes notifications »): the bell in the bar of Plazo Pro's tabs, its unread count read every 30 s (and on
/// the live sync), a touch opens the list.
class BellButton extends StatefulWidget {
  const BellButton({super.key});

  /// Off in the tests (no periodic timer left behind, no data source registered).
  static bool enabled = true;

  @override
  State<BellButton> createState() => _BellButtonState();
}

class _BellButtonState extends State<BellButton> {
  int _unread = 0;
  Timer? _timer;
  StreamSubscription<int>? _changes;

  BellDataSource? get _source => locator.isRegistered<BellDataSource>() ? locator<BellDataSource>() : null;

  @override
  void initState() {
    super.initState();
    final source = _source;
    if (source == null) return;
    _changes = source.unreadChanges.listen((n) {
      if (mounted) setState(() => _unread = n);
    });
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _refresh());
  }

  Future<void> _refresh() async {
    try {
      final n = await _source?.count();
      if (mounted && n != null) setState(() => _unread = n);
    } catch (_) {
      // Offline or signed out: the badge keeps its last count.
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _changes?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final label = _unread > 0 ? 'bell.open_unread'.tr(args: ['$_unread']) : 'bell.open'.tr();
    return LiveSyncListener(
      onChange: _refresh,
      child: Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Semantics(
          button: true,
          label: label,
          child: IconButton(
            key: const Key('pro-bell'),
            tooltip: label,
            style: IconButton.styleFrom(backgroundColor: AppColors.tint, minimumSize: const Size(44, 44)),
            onPressed: () async {
              await context.router.push(const ProBellRoute());
              await _refresh();
            },
            icon: Badge(
              isLabelVisible: _unread > 0,
              label: Text(_unread > 99 ? '99+' : '$_unread', key: const Key('pro-bell-count')),
              backgroundColor: AppColors.danger,
              child: const Icon(Icons.notifications_none_rounded, color: AppColors.accent),
            ),
          ),
        ),
      ),
    );
  }
}
