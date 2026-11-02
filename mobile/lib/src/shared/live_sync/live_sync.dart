import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/widgets.dart';

import '../../di/locator.dart';

/// Reads the operator's version (`GET /internal/sync`).
typedef LiveSyncFetch = Future<String?> Function();

/// 02/11/2026 (« les actions doivent être synchronisées entre l'espace admin et l'application », « tout, en direct »): the
/// operator's version is read every 5 s while a screen listens and the app is in the foreground; when it moves (a status,
/// keys, a place, a file, a shuttle trip… changed on the web, on another phone or by the server), [changes] fires and the
/// screens read their data again, without waiting for their own timers.
class LiveSync with WidgetsBindingObserver {
  LiveSync(this._fetch, {this.interval = const Duration(seconds: 5)});

  factory LiveSync.dio(Dio dio) => LiveSync(() async {
    final res = await dio.get<Map<String, dynamic>>('internal/sync');
    return res.data?['version'] as String?;
  });

  /// Off in widget tests (no timer left behind), like the tutorials.
  static bool enabled = true;

  final LiveSyncFetch _fetch;
  final Duration interval;
  late final StreamController<void> _changes = StreamController<void>.broadcast(onListen: _start, onCancel: _stop);
  Timer? _timer;
  String? _version;
  bool _busy = false;
  bool _foreground = true;

  Stream<void> get changes => _changes.stream;

  void _start() {
    WidgetsBinding.instance.addObserver(this);
    _version = null;
    _schedule();
    unawaited(check());
  }

  void _stop() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _timer = null;
  }

  void _schedule() {
    _timer?.cancel();
    _timer = _foreground ? Timer.periodic(interval, (_) => unawaited(check())) : null;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final foreground = state == AppLifecycleState.resumed;
    if (foreground == _foreground) return;
    _foreground = foreground;
    _schedule();
    if (foreground) unawaited(check());
  }

  /// One read; fires [changes] when the version moved since the last one (never on the first).
  Future<void> check() async {
    if (_busy || !_changes.hasListener) return;
    _busy = true;
    try {
      final version = await _fetch();
      if (version == null) return;
      final previous = _version;
      _version = version;
      if (previous != null && previous != version && _changes.hasListener) _changes.add(null);
    } catch (_) {
      // Offline or signed out: the screens keep their own timers; the next read tries again.
    } finally {
      _busy = false;
    }
  }
}

/// Calls [onChange] whenever the operator's data moved elsewhere (see [LiveSync]).
class LiveSyncListener extends StatefulWidget {
  const LiveSyncListener({super.key, required this.onChange, required this.child});

  final VoidCallback onChange;
  final Widget child;

  @override
  State<LiveSyncListener> createState() => _LiveSyncListenerState();
}

class _LiveSyncListenerState extends State<LiveSyncListener> {
  StreamSubscription<void>? _sub;

  @override
  void initState() {
    super.initState();
    if (LiveSync.enabled && locator.isRegistered<LiveSync>()) {
      _sub = locator<LiveSync>().changes.listen((_) {
        if (mounted) widget.onChange();
      });
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
