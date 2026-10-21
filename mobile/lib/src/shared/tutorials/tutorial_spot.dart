import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

import 'coach_marks.dart';
import 'tutorial_catalog.dart';
import 'tutorial_service.dart';
import 'welcome_carousel.dart';

/// Shows [tutorial] over [child] when it is due (never seen on this phone, or asked again from Plus › Tutoriels)
/// and the page is the one on screen: the shells carry the welcome carousel, the main pages their bubbles. The
/// bubbles wait for the carousel, and for their targets (a page still loading shows them once its content is in).
class TutorialSpot extends StatefulWidget {
  const TutorialSpot({super.key, required this.tutorial, required this.child});

  final Tutorial tutorial;
  final Widget child;

  @override
  State<TutorialSpot> createState() => _TutorialSpotState();
}

class _TutorialSpotState extends State<TutorialSpot> {
  final _service = TutorialService.instance;
  Timer? _timer;

  /// Checks without a target on screen: the page gives up after a while (it tries again when opened again).
  int _misses = 0;
  static const _maxMisses = 20;

  @override
  void initState() {
    super.initState();
    if (!TutorialService.enabled) return;
    _claimWelcome();
    _service.addListener(_schedule);
    _service.load();
    _schedule();
  }

  @override
  void didUpdateWidget(TutorialSpot old) {
    super.didUpdateWidget(old);
    if (!TutorialService.enabled || old.tutorial.id == widget.tutorial.id) return;
    // Plazo Pro: another post, another carousel.
    _claimWelcome();
    _misses = 0;
    _schedule();
  }

  void _claimWelcome() {
    if (widget.tutorial.kind == TutorialKind.carousel) _service.welcomeId = widget.tutorial.id;
  }

  @override
  void dispose() {
    _timer?.cancel();
    if (TutorialService.enabled) _service.removeListener(_schedule);
    super.dispose();
  }

  /// Checks now and then every second while due: the page may be under another one, in a tab not shown, or loading.
  void _schedule() {
    if (!mounted) return;
    if (!_service.ready || !_service.isDue(widget.tutorial.id) || _misses >= _maxMisses) {
      _timer?.cancel();
      _timer = null;
      return;
    }
    _timer ??= Timer.periodic(const Duration(seconds: 1), (_) => _check());
    WidgetsBinding.instance
      ..addPostFrameCallback((_) => _check())
      ..scheduleFrame();
  }

  bool _onScreen() {
    final route = ModalRoute.of(context);
    if (route != null && !route.isCurrent) return false;
    if (!TickerMode.valuesOf(context).enabled) return false;
    try {
      // A tab page: shown only when its tab is the active one.
      if (!RouteData.of(context).isActive) return false;
    } catch (_) {
      // Outside the app's router (a widget test).
    }
    return true;
  }

  Future<void> _check() async {
    final t = widget.tutorial;
    if (!mounted || !_service.ready || _service.busy || !_service.isDue(t.id)) return _schedule();
    if (t.kind == TutorialKind.bubbles && !_service.welcomeDone) return;
    if (!_onScreen()) return;
    if (t.kind == TutorialKind.bubbles && !t.steps.any((s) => findTutorialTarget(context, s.targets) != null)) {
      _misses++;
      if (_misses >= _maxMisses) _schedule();
      return;
    }
    _service.busy = true;
    _timer?.cancel();
    _timer = null;
    try {
      if (t.kind == TutorialKind.carousel) {
        await WelcomeCarousel.show(context, t);
        await _service.markSeen(t.id);
      } else {
        final shown = await CoachMarks.show(context, t);
        if (shown > 0) {
          await _service.markSeen(t.id);
        } else {
          _misses++;
        }
      }
    } finally {
      _service.busy = false;
    }
    _schedule();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
