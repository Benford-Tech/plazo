import 'dart:math' as math;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../theme/theme.dart';
import 'tutorial_catalog.dart';

/// Finds the widget a bubble points at: the first of [keys] (string `Key`s already on the screens) that is laid out
/// with a size and not hidden offstage, under [root] (the page). The shell's tab bar is outside the page: a tab's key
/// (`tab-…`, `ptab-…`) is looked up in the whole app.
Element? findTutorialTarget(BuildContext root, List<String> keys) {
  for (final key in keys) {
    final tab = key.startsWith('tab-') || key.startsWith('ptab-');
    final found = _find(tab ? WidgetsBinding.instance.rootElement : root as Element, Key(key));
    if (found != null) return found;
  }
  return null;
}

Element? _find(Element? from, Key key) {
  if (from == null) return null;
  Element? hit;
  void visit(Element e) {
    if (hit != null) return;
    final widget = e.widget;
    // Hidden pages (an inactive tab kept in an Offstage, a route below) never hold the target.
    if (widget is Offstage && widget.offstage) return;
    if (widget is Visibility && !widget.visible) return;
    if (widget.key == key && _laidOut(e)) {
      hit = e;
      return;
    }
    e.visitChildElements(visit);
  }

  visit(from);
  return hit;
}

bool _laidOut(Element e) {
  final box = e.findRenderObject();
  return box is RenderBox && box.attached && box.hasSize && box.size.width > 1 && box.size.height > 1;
}

/// B: the guided bubbles, one at a time, on the real screen: the rest darkened, the target outlined, a bubble
/// with « 1 sur 4 », « Passer » and « Suivant ». Returns how many bubbles were shown (0: none of the targets was on
/// screen, the tutorial stays due).
class CoachMarks {
  static Future<int> show(BuildContext context, Tutorial tutorial) async {
    final shown = await Navigator.of(context, rootNavigator: true).push<int>(
      PageRouteBuilder<int>(
        opaque: false,
        barrierDismissible: false,
        transitionDuration: const Duration(milliseconds: 200),
        reverseTransitionDuration: const Duration(milliseconds: 160),
        pageBuilder: (_, _, _) => _CoachMarksView(tutorial: tutorial, root: context),
        transitionsBuilder: (_, animation, _, child) => FadeTransition(opacity: animation, child: child),
      ),
    );
    return shown ?? 0;
  }
}

class _CoachMarksView extends StatefulWidget {
  const _CoachMarksView({required this.tutorial, required this.root});

  final Tutorial tutorial;

  /// The page the bubbles belong to (its targets are looked up there first).
  final BuildContext root;

  @override
  State<_CoachMarksView> createState() => _CoachMarksViewState();
}

class _Spot {
  const _Spot(this.step, this.rect);
  final int step;
  final Rect rect;
}

class _CoachMarksViewState extends State<_CoachMarksView> {
  /// The steps whose target is on screen, decided once at the start so that « 1 sur 3 » holds to the end.
  List<int> _steps = const [];
  int _at = 0;
  Rect? _rect;
  int _shown = 0;

  static const _pro = AppConstants.isPro;

  @override
  void initState() {
    super.initState();
    // After the frame: the element tree is not walked while it is being built.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _steps = [
        for (var i = 0; i < widget.tutorial.steps.length; i++)
          if (widget.root.mounted && findTutorialTarget(widget.root, widget.tutorial.steps[i].targets) != null) i,
      ];
      _go(0);
    });
  }

  Future<void> _go(int at) async {
    if (!mounted) return;
    if (at >= _steps.length) {
      Navigator.of(context).pop(_shown);
      return;
    }
    final spot = await _locate(_steps[at]);
    if (!mounted) return;
    if (spot == null) return _go(at + 1);
    setState(() {
      _at = at;
      _rect = spot.rect;
      _shown++;
    });
  }

  /// Scrolls the target into view, then reads where it is.
  Future<_Spot?> _locate(int step) async {
    if (!widget.root.mounted) return null;
    final target = findTutorialTarget(widget.root, widget.tutorial.steps[step].targets);
    if (target == null) return null;
    if (Scrollable.maybeOf(target) != null) {
      await Scrollable.ensureVisible(target, alignment: 0.3, duration: const Duration(milliseconds: 260), curve: Curves.easeOutCubic);
    }
    if (!mounted || !target.mounted) return null;
    final box = target.findRenderObject();
    final overlay = context.findRenderObject();
    if (box is! RenderBox || !box.attached || overlay is! RenderBox) return null;
    final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);
    final rect = topLeft & box.size;
    if (!(Offset.zero & overlay.size).overlaps(rect)) return null;
    return _Spot(step, rect);
  }

  @override
  Widget build(BuildContext context) {
    final rect = _rect;
    final size = MediaQuery.sizeOf(context);
    final padding = MediaQuery.paddingOf(context);
    final hole = rect?.inflate(6);
    final below = hole == null || hole.center.dy < size.height * 0.55;
    final t = widget.tutorial;
    final step = _steps.isEmpty ? 0 : _steps[_at];
    final last = _at == _steps.length - 1;
    return PopScope(
      canPop: false,
      // Back: the same as « Passer ».
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.of(context).pop(math.max(_shown, 1));
      },
      child: Material(
        type: MaterialType.transparency,
        child: Stack(
          children: [
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {},
                child: CustomPaint(
                  painter: _DimPainter(hole: hole, ring: AppColors.action, dim: _pro ? const Color(0xA80A140C) : const Color(0x9E140C06)),
                ),
              ),
            ),
            if (hole != null)
              Positioned(
                left: 16,
                right: 16,
                top: below ? math.min(hole.bottom + 14, size.height - padding.bottom - 240) : null,
                bottom: below ? null : math.min(size.height - hole.top + 14, size.height - padding.top - 240),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: _Bubble(
                      key: Key('tutorial-bubble-${t.id}-$step'),
                      kicker: 'tutorials.step_of'.tr(args: ['${_at + 1}', '${_steps.length}']),
                      title: t.titleKey(step).tr(),
                      body: t.bodyKey(step).tr(),
                      last: last,
                      onSkip: () => Navigator.of(context).pop(_shown),
                      onNext: () => _go(_at + 1),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({super.key, required this.kicker, required this.title, required this.body, required this.last, required this.onSkip, required this.onNext});

  final String kicker;
  final String title;
  final String body;
  final bool last;
  final VoidCallback onSkip;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    const pro = AppConstants.isPro;
    return Semantics(
      scopesRoute: true,
      namesRoute: true,
      explicitChildNodes: true,
      label: title,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(pro ? 16 : 20),
          boxShadow: const [BoxShadow(color: Color(0x4D000000), blurRadius: 40, offset: Offset(0, 16))],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              kicker.toUpperCase(),
              style: pro ? AppText.tabular(size: 12, weight: 500, color: AppColors.accent) : AppText.label(size: 12, color: AppColors.accentDeep),
            ),
            const SizedBox(height: 6),
            Semantics(
              header: true,
              liveRegion: true,
              child: Text(title, style: pro ? AppText.title(size: 22, color: AppColors.ink) : AppText.strong(size: 20)),
            ),
            const SizedBox(height: 8),
            Text(body, style: AppText.body(size: 15, color: AppColors.muted, height: 1.5)),
            const SizedBox(height: 8),
            Row(
              children: [
                if (!last)
                  TextButton(
                    key: const Key('tutorial-skip'),
                    style: TextButton.styleFrom(minimumSize: const Size(48, 48), foregroundColor: AppColors.muted),
                    onPressed: onSkip,
                    child: Text('tutorials.skip'.tr(), style: AppText.strong(size: 15, color: AppColors.muted)),
                  ),
                const Spacer(),
                FilledButton(
                  key: const Key('tutorial-next'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.action,
                    foregroundColor: AppColors.onAccent,
                    minimumSize: const Size(48, 48),
                    padding: const EdgeInsets.symmetric(horizontal: 22),
                    shape: const RoundedRectangleBorder(borderRadius: AppRadius.chip),
                  ),
                  onPressed: last ? onSkip : onNext,
                  child: Text((last ? 'tutorials.done' : 'tutorials.next').tr(), style: AppText.strong(size: 15, color: AppColors.onAccent)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// The darkened screen with a rounded hole around the target, outlined in the action colour.
class _DimPainter extends CustomPainter {
  const _DimPainter({required this.hole, required this.ring, required this.dim});

  final Rect? hole;
  final Color ring;
  final Color dim;

  @override
  void paint(Canvas canvas, Size size) {
    final screen = Path()..addRect(Offset.zero & size);
    final h = hole;
    if (h == null) {
      canvas.drawPath(screen, Paint()..color = dim);
      return;
    }
    final rrect = RRect.fromRectAndRadius(h, const Radius.circular(AppConstants.isPro ? 14 : 18));
    canvas.drawPath(Path.combine(PathOperation.difference, screen, Path()..addRRect(rrect)), Paint()..color = dim);
    canvas.drawRRect(
      rrect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..color = ring,
    );
  }

  @override
  bool shouldRepaint(_DimPainter old) => old.hole != hole || old.ring != ring || old.dim != dim;
}
