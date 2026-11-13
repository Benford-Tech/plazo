import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:parking_app/src/core/helpers/formatters.dart';
import 'package:flutter/material.dart';

import '../../../core/router/app_router.dart';
import '../../../di/locator.dart';
import '../../../shared/theme/theme.dart';
import '../../../shared/widgets/brand_header.dart';
import '../data/bell_data_source.dart';

const _filters = ['all', 'bookings', 'shuttle', 'team'];

const _icons = <String, (IconData, Color, Color)>{
  'booking_new': (Icons.event_available_rounded, AppStatus.ok, AppStatus.okSoft),
  'booking_change': (Icons.sync_rounded, AppStatus.warn, AppStatus.warnSoft),
  'inbox': (Icons.alternate_email_rounded, AppStatus.warn, AppStatus.warnSoft),
  'whatsapp': (Icons.chat_rounded, AppStatus.ok, AppStatus.okSoft),
  'extra': (Icons.auto_awesome_rounded, AppColors.accent, AppColors.tint),
  'arrival': (Icons.person_add_alt_1_rounded, AppStatus.ok, AppStatus.okSoft),
  'return': (Icons.flight_land_rounded, AppStatus.info, AppStatus.infoSoft),
  'shuttle': (Icons.airport_shuttle_rounded, AppColors.muted, AppColors.canvas),
  'valet': (Icons.key_rounded, AppStatus.info, AppStatus.infoSoft),
  'team': (Icons.group_rounded, AppColors.accent, AppColors.tint),
  'platform': (Icons.notifications_rounded, AppColors.muted, AppColors.canvas),
};

/// 02/11/2026 (« Mes notifications »): the bell's list, the 30 last days; a touch opens the booking it is about.
@RoutePage()
class ProBellPage extends StatefulWidget {
  const ProBellPage({super.key});

  /// The tests' data source; the locator's otherwise.
  @visibleForTesting
  static BellDataSource? debugSource;

  @override
  State<ProBellPage> createState() => _ProBellPageState();
}

class _ProBellPageState extends State<ProBellPage> {
  late final BellDataSource _source = ProBellPage.debugSource ?? locator<BellDataSource>();
  String _filter = 'all';
  List<BellNotification> _items = const [];
  bool _hasMore = false;
  bool _loading = true;
  bool _failed = false;
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool more = false}) async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final page = await _source.list(filter: _filter, before: more && _items.isNotEmpty ? _items.last.createdAt : null);
      if (!mounted) return;
      setState(() {
        _items = more ? [..._items, ...page.items] : page.items;
        _hasMore = page.hasMore;
        _unread = page.unread;
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _failed = true;
        });
      }
    }
  }

  Future<void> _markAll() async {
    try {
      final unread = await _source.markRead();
      if (mounted) setState(() => (_items = [for (final n in _items) n.read()], _unread = unread));
    } catch (_) {}
  }

  Future<void> _open(BellNotification n) async {
    if (n.unread) {
      setState(() => (_items = [for (final x in _items) x.id == n.id ? x.read() : x], _unread = _unread > 0 ? _unread - 1 : 0));
      _source.markRead([n.id]).ignore();
    }
    final target = n.target;
    if (target == null) return;
    final booking = RegExp(r'^/reservations/([^/?]+)$').firstMatch(target);
    if (booking != null) {
      await context.router.push(ProReservationRoute(id: booking.group(1)!));
    } else if (RegExp(r'^/reservations/whatsapp\?c=([^&]+)$').firstMatch(target) case final wa?) {
      await context.router.push(ProWhatsappConversationRoute(id: wa.group(1)!));
    } else if (target.startsWith('/reservations/whatsapp')) {
      await context.router.push(const ProWhatsappInboxRoute());
    } else if (target == '/equipe') {
      await context.router.push(const ProTeamRoute());
    }
  }

  String _day(DateTime d) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final day = DateTime(d.year, d.month, d.day);
    if (day == today) return 'bell.today'.tr();
    if (day == today.subtract(const Duration(days: 1))) return 'bell.yesterday'.tr();
    return DateFormat('EEEE d MMMM', appLocale).format(d);
  }

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    String? lastDay;
    for (final n in _items) {
      final day = _day(n.createdAt);
      if (day != lastDay) {
        rows.add(
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
            child: Text(day.toUpperCase(), style: AppText.label(size: 11)),
          ),
        );
        lastDay = day;
      }
      rows.add(_Row(notification: n, onTap: () => _open(n)));
    }
    return Scaffold(
      appBar: BrandAppBar(
        pro: true,
        title: 'bell.title'.tr(),
        actions: [
          TextButton(
            key: const Key('bell-mark-all'),
            onPressed: _unread == 0 ? null : _markAll,
            child: Text('bell.mark_all'.tr(), style: AppText.strong(size: 14, color: _unread == 0 ? AppColors.muted : AppColors.accent)),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          color: AppColors.accent,
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final f in _filters)
                      ChoiceChip(
                        key: Key('bell-filter-$f'),
                        label: Text('bell.filter.$f'.tr()),
                        selected: _filter == f,
                        showCheckmark: false,
                        selectedColor: AppColors.accent,
                        labelStyle: AppText.body(size: 13.5, weight: _filter == f ? 700 : 500, color: _filter == f ? AppColors.surface : AppColors.ink),
                        onSelected: (_) {
                          setState(() => _filter = f);
                          _load();
                        },
                      ),
                  ],
                ),
              ),
              if (_failed)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('bell.failed'.tr(), style: AppText.body(size: 14, color: AppColors.danger)),
                ),
              if (!_loading && !_failed && _items.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('bell.empty'.tr(), style: AppText.muted()),
                ),
              ...rows,
              if (_loading)
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
                ),
              if (!_loading && _hasMore)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: OutlinedButton(onPressed: () => _load(more: true), child: Text('bell.more'.tr())),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.notification, required this.onTap});
  final BellNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final n = notification;
    final (icon, fg, bg) = _icons[n.event] ?? _icons['platform']!;
    return Material(
      color: n.unread ? AppColors.tintSoft : AppColors.surface,
      child: InkWell(
        key: Key('bell-item-${n.id}'),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: bg,
                child: Icon(icon, size: 18, color: fg),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(n.title, style: n.unread ? AppText.strong(size: 14) : AppText.body(size: 14)),
                    if (n.body.isNotEmpty) Text(n.body, style: AppText.muted(size: 13)),
                    Text(DateFormat('HH:mm').format(n.createdAt), style: AppText.tabular(size: 12, weight: 500, color: AppColors.muted)),
                  ],
                ),
              ),
              if (n.unread)
                Container(
                  key: Key('bell-unread-${n.id}'),
                  width: 9,
                  height: 9,
                  margin: const EdgeInsets.only(top: 6, left: 6),
                  decoration: const BoxDecoration(color: AppColors.action, shape: BoxShape.circle),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
