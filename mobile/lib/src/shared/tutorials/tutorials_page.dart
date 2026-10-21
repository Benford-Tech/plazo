import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../theme/theme.dart';
import '../widgets/app_card.dart';
import '../widgets/brand_header.dart';
import 'tutorial_catalog.dart';
import 'tutorial_service.dart';
import 'welcome_carousel.dart';

/// Plus › Tutoriels: every tutorial, seen or not, to see again whenever wanted; Plazo Pro lists those of a post
/// (the post of the day first, the others the role covers).
class TutorialsPage extends StatefulWidget {
  const TutorialsPage({super.key, this.activePost = 'agent', this.posts = const []});

  /// Plazo Pro: the post of the day and the posts the role covers (in the order of the post sheet).
  final String activePost;
  final List<String> posts;

  static Future<void> open(BuildContext context, {String activePost = 'agent', List<String> posts = const []}) =>
      Navigator.of(context, rootNavigator: true).push<void>(
        MaterialPageRoute(
          builder: (_) => TutorialsPage(activePost: activePost, posts: posts),
        ),
      );

  @override
  State<TutorialsPage> createState() => _TutorialsPageState();
}

class _TutorialsPageState extends State<TutorialsPage> {
  final _service = TutorialService.instance;
  late String _post = widget.activePost;

  static const _pro = AppConstants.isPro;

  @override
  void initState() {
    super.initState();
    _service.addListener(_changed);
    _service.load();
  }

  @override
  void dispose() {
    _service.removeListener(_changed);
    super.dispose();
  }

  void _changed() => setState(() {});

  List<Tutorial> get _list => Tutorials.listFor(pro: _pro, post: _post);

  /// The tutorials of this list show on the screens in hand: Plazo's, or the post of the day's.
  bool get _current => !_pro || _post == widget.activePost;

  Future<void> _open(Tutorial t) async {
    final messenger = ScaffoldMessenger.of(context);
    if (t.kind == TutorialKind.carousel) {
      _service.busy = true;
      try {
        await WelcomeCarousel.show(context, t);
      } finally {
        _service.busy = false;
      }
      await _service.markSeen(t.id);
      return;
    }
    // Bubbles: on their tab, now; otherwise the next time their screen opens.
    final tab = t.tab;
    if (_current && tab != null && (_service.openTab?.call(tab) ?? false)) {
      _service.requestReplay(t.id);
      if (mounted) Navigator.of(context).pop();
      return;
    }
    await _service.reset([t.id]);
    messenger.showSnackBar(SnackBar(content: Text('tutorials.later.${t.slug}'.tr())));
  }

  Future<void> _all() async {
    await _service.reset(_list.map((t) => t.id));
    if (!mounted) return;
    if (_current) {
      // Back to the app: the carousel, then each screen's bubbles.
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('tutorials.all_later'.tr(args: ['post.name.$_post'.tr()]))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final list = _list;
    return Scaffold(
      appBar: BrandAppBar(pro: _pro, title: 'tutorials.title'.tr()),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
          children: [
            Text('tutorials.intro'.tr(), style: AppText.muted(size: 14.5)),
            if (_pro && widget.posts.length > 1) ...[
              const SizedBox(height: 16),
              Text('tutorials.post'.tr().toUpperCase(), style: AppText.label(size: 12)),
              const SizedBox(height: 6),
              SegmentedButton<String>(
                key: const Key('tutorials-post'),
                showSelectedIcon: false,
                style: SegmentedButton.styleFrom(
                  selectedBackgroundColor: AppColors.action,
                  selectedForegroundColor: AppColors.onAccent,
                  minimumSize: const Size(0, 48),
                  textStyle: AppText.strong(size: 13),
                ),
                segments: [
                  for (final p in widget.posts)
                    ButtonSegment(
                      value: p,
                      label: Text('post.name.$p'.tr(), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                ],
                selected: {_post},
                onSelectionChanged: (s) => setState(() => _post = s.first),
              ),
            ],
            const SizedBox(height: 16),
            AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Column(
                children: [
                  for (var i = 0; i < list.length; i++) ...[
                    if (i > 0) const Divider(height: 1, color: AppColors.line),
                    _Row(tutorial: list[i], seen: _service.isSeen(list[i].id), onOpen: () => _open(list[i])),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
            OutlinedButton(
              key: const Key('tutorials-all'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                foregroundColor: AppColors.brownOrInk,
                side: const BorderSide(color: AppColors.brownOrInk, width: 2),
                shape: const RoundedRectangleBorder(borderRadius: AppRadius.field),
              ),
              onPressed: _all,
              child: Text((_pro ? 'tutorials.all_post' : 'tutorials.all').tr(), style: AppText.strong(size: 15, color: AppColors.brownOrInk)),
            ),
            const SizedBox(height: 10),
            Text('tutorials.local'.tr(), textAlign: TextAlign.center, style: AppText.muted(size: 12.5)),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.tutorial, required this.seen, required this.onOpen});

  final Tutorial tutorial;
  final bool seen;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final t = tutorial;
    final count = t.steps.length;
    final what = t.kind == TutorialKind.carousel ? 'tutorials.screens'.tr(args: ['$count']) : 'tutorials.bubbles'.tr(args: ['$count']);
    final details = [if (t.kind == TutorialKind.bubbles) 'tutorials.where.${t.slug}'.tr(), what, if (seen) 'tutorials.seen'.tr()].join(' · ');
    final action = (seen ? 'tutorials.again' : 'tutorials.see').tr();
    return Semantics(
      button: true,
      label: '${'tutorials.name.${t.slug}'.tr()}, $details. $action',
      excludeSemantics: true,
      child: InkWell(
        key: Key('tutorial-row-${t.id}'),
        onTap: onOpen,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 64),
          child: Row(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('tutorials.name.${t.slug}'.tr(), style: AppText.strong(size: 15)),
                      const SizedBox(height: 2),
                      Text(details, style: AppText.muted(size: 13)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(action, style: AppText.strong(size: 14, color: AppColors.accentDeep)),
            ],
          ),
        ),
      ),
    );
  }
}
