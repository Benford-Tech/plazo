import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../theme/theme.dart';
import 'tutorial_catalog.dart';

/// A: the welcome carousel, full screen, four pages, « Passer » at any time. Plazo Pro shows the one of the post
/// of the day (« CHAUFFEUR · 2 / 4 »).
class WelcomeCarousel extends StatefulWidget {
  const WelcomeCarousel({super.key, required this.tutorial});

  final Tutorial tutorial;

  /// Shows it above everything; completes when it is closed (finished or skipped).
  static Future<void> show(BuildContext context, Tutorial tutorial) => Navigator.of(context, rootNavigator: true).push<void>(
    PageRouteBuilder<void>(
      fullscreenDialog: true,
      transitionDuration: const Duration(milliseconds: 260),
      reverseTransitionDuration: const Duration(milliseconds: 200),
      pageBuilder: (_, _, _) => WelcomeCarousel(tutorial: tutorial),
      transitionsBuilder: (_, animation, _, child) => FadeTransition(opacity: animation, child: child),
    ),
  );

  @override
  State<WelcomeCarousel> createState() => _WelcomeCarouselState();
}

class _WelcomeCarouselState extends State<WelcomeCarousel> {
  final _pages = PageController();
  int _index = 0;

  static const _pro = AppConstants.isPro;

  /// The illustration band: the brand orange for Plazo, the darkest green for Plazo Pro.
  static const _band = _pro ? Color(0xFF0F2A14) : AppColors.action;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  void _next() {
    final last = _index == widget.tutorial.steps.length - 1;
    if (last) {
      Navigator.of(context).pop();
    } else {
      _pages.nextPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOutCubic);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.tutorial;
    final count = t.steps.length;
    final last = _index == count - 1;
    final kicker = t.post == null ? 'tutorials.step_of'.tr(args: ['${_index + 1}', '$count']) : '${'post.name.${t.post}'.tr()} · ${_index + 1} / $count';
    return Scaffold(
      key: Key('tutorial-carousel-${t.id}'),
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        kicker.toUpperCase(),
                        key: const Key('tutorial-kicker'),
                        style: _pro ? AppText.tabular(size: 12, weight: 500, color: AppColors.accent) : AppText.label(size: 13, color: AppColors.dark),
                      ),
                    ),
                  ),
                  TextButton(
                    key: const Key('tutorial-skip'),
                    style: TextButton.styleFrom(minimumSize: const Size(48, 48), foregroundColor: AppColors.ink),
                    onPressed: () => Navigator.of(context).pop(),
                    child: Text('tutorials.skip'.tr(), style: AppText.strong(size: 15)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: PageView.builder(
                  controller: _pages,
                  itemCount: count,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemBuilder: (context, i) => _Page(tutorial: t, index: i, band: _band),
                ),
              ),
              const SizedBox(height: 18),
              ExcludeSemantics(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var i = 0; i < count; i++)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: i == _index ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(color: i == _index ? AppColors.dark : AppColors.line, borderRadius: BorderRadius.circular(4)),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              FilledButton(
                key: const Key('tutorial-next'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.action,
                  foregroundColor: AppColors.onAccent,
                  minimumSize: const Size.fromHeight(56),
                  shape: const RoundedRectangleBorder(borderRadius: AppRadius.field),
                ),
                onPressed: _next,
                child: Text((last ? 'tutorials.start' : 'tutorials.next').tr(), style: AppText.strong(size: 17, color: AppColors.onAccent)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Page extends StatelessWidget {
  const _Page({required this.tutorial, required this.index, required this.band});

  final Tutorial tutorial;
  final int index;
  final Color band;

  @override
  Widget build(BuildContext context) {
    final step = tutorial.steps[index];
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: AppConstants.isPro ? Border.all(color: AppColors.line) : null,
        boxShadow: AppConstants.isPro ? null : const [BoxShadow(color: Color(0x142C1A0E), blurRadius: 30, offset: Offset(0, 10))],
      ),
      child: LayoutBuilder(
        builder: (context, box) => SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: box.maxHeight),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  height: (box.maxHeight * 0.42).clamp(150, 300),
                  color: band,
                  alignment: Alignment.center,
                  child: ExcludeSemantics(
                    child: Container(
                      width: 112,
                      height: 112,
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(AppConstants.isPro ? 24 : 32)),
                      child: Icon(step.icon, size: 56, color: AppColors.accent),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 22, 22, 22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Semantics(
                        header: true,
                        child: Text(
                          tutorial.titleKey(index).tr(),
                          style: AppText.title(size: AppConstants.isPro ? 28 : 30, color: AppColors.brownOrInk).copyWith(height: 1.1),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(tutorial.bodyKey(index).tr(), style: AppText.body(size: 16, color: AppColors.muted, height: 1.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
