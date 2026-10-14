import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/highlights.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/live_dot.dart';
import '../../domain/logic/shuttle_rail.dart';

String _t(String key, {List<String>? args}) => 'highlights.shuttle_box.$key'.tr(args: args);

/// « Terminal 1 » at Lyon Saint-Exupéry (Terminal 2 closed on 01/04/2026), « Aéroport » elsewhere.
String railDestination(String? airportCode) => airportCode?.toUpperCase() == 'LYS' ? _t('terminal1') : _t('airport');

/// The same place inside a sentence read out: « le Terminal 1 », « l'aéroport ».
String railDestinationInText(String? airportCode) => airportCode?.toUpperCase() == 'LYS' ? _t('terminal1_in_text') : _t('airport_in_text');

/// « Terminal 1 · 5 min », or the place alone without a ride time.
String railDestinationLabel(String destination, int? rideMinutes) =>
    rideMinutes == null ? destination : _t('destination_min', args: [destination, '$rideMinutes']);

/// What the box says to assistive technology (the card reads it out in its own label). [destination] is the place
/// inside a sentence ([railDestinationInText]).
String shuttleBoxDescription(ShuttleFacts facts, {RailState? rail, String? destination}) {
  final parts = [
    _t('title'),
    if (facts.rideMinutes != null) _t('ride_a11y', args: ['${facts.rideMinutes}']),
    if (facts.waitMinutes != null) _t('wait_a11y', args: ['${facts.waitMinutes}']),
  ];
  // Before the screen's first live answer nothing is known yet: the card's own live hint says the rest.
  if (facts.live && rail != null) parts.add(_railDescription(rail, destination ?? _t('airport_in_text')));
  return parts.join(', ');
}

/// Counts the shuttles on the road, with or without a position (a minibus is drawn only for the located ones).
String _railDescription(RailState rail, String destination) {
  final n = rail.running;
  if (n == 0) return _t('rail_none');
  return n == 1 ? _t('rail_one', args: [destination]) : _t('rail_many', args: ['$n', destination]);
}

/// Direction C (14/10/2026), the « encart navette » of a result card: the minibus and « Navette gratuite », then the
/// ride and the declared average wait as two figures (a figure without data is left out). For a parking whose
/// shuttles are shown live, the box carries the live rail (L3, [LiveShuttleRail]) under a hairline. [compact] (the
/// card laid over the results map): one line, no rail, « Navette en direct » with its dot for a live parking, so the
/// card leaves the map in view.
class ShuttleBox extends StatelessWidget {
  const ShuttleBox({super.key, required this.facts, this.narrow = true, this.compact = false, this.rail, this.receivedAt, this.airportCode});

  final ShuttleFacts facts;

  /// A phone-width card: « ATTENTE » instead of « ATTENTE MOY. ».
  final bool narrow;

  /// On the map: one line, without the rail.
  final bool compact;

  /// The parking's rail from the screen's shared live answer; null until the first one.
  final RailState? rail;

  /// When the screen received that answer: the positions' ages run on from there.
  final DateTime? receivedAt;

  /// Names the end of the rail (« Terminal 1 » at LYS).
  final String? airportCode;

  @override
  Widget build(BuildContext context) {
    if (compact) return _CompactShuttleBox(facts: facts);
    final figures = [
      if (facts.rideMinutes != null) _Figure(key: const Key('shuttle-ride'), value: facts.rideMinutes!, label: _t('ride')),
      if (facts.waitMinutes != null)
        _Figure(key: const Key('shuttle-wait'), value: facts.waitMinutes!, label: narrow ? _t('wait_short') : _t('wait')),
    ];
    return Container(
      key: const Key('shuttle-box'),
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 9, 12, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.line),
        borderRadius: AppRadius.chip,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // The figures sit at the right of the title while they fit, under it otherwise.
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 16,
            runSpacing: 8,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.airport_shuttle_rounded, size: 17, color: AppColors.success),
                  const SizedBox(width: 8),
                  Text(_t('title'), style: AppText.strong(size: 13.5)),
                ],
              ),
              if (figures.isNotEmpty)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final (i, f) in figures.indexed) ...[if (i > 0) const SizedBox(width: 16), f],
                  ],
                ),
            ],
          ),
          if (facts.live) ...[
            const SizedBox(height: 10),
            const Divider(height: 1, thickness: 1, color: AppColors.line),
            const SizedBox(height: 9),
            LiveShuttleRail(rail: rail, receivedAt: receivedAt, destination: railDestinationLabel(railDestination(airportCode), facts.rideMinutes)),
          ],
        ],
      ),
    );
  }
}

/// « Navette gratuite  ● EN DIRECT  5 min trajet · 5 min attente » on one line (what does not fit goes under).
class _CompactShuttleBox extends StatelessWidget {
  const _CompactShuttleBox({required this.facts});

  final ShuttleFacts facts;

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final figure = AppText.tabular(size: 13);
    final word = AppText.body(size: 12, weight: 600, color: AppColors.muted);
    final figures = [
      if (facts.rideMinutes != null) (facts.rideMinutes!, _t('ride').toLowerCase()),
      if (facts.waitMinutes != null) (facts.waitMinutes!, _t('wait_short').toLowerCase()),
    ];
    return Container(
      key: const Key('shuttle-box'),
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(10, 7, 10, 7),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.line),
        borderRadius: AppRadius.chip,
      ),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 12,
        runSpacing: 4,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.airport_shuttle_rounded, size: 16, color: AppColors.success),
              const SizedBox(width: 7),
              Flexible(child: Text(_t('title'), style: AppText.strong(size: 13.5))),
            ],
          ),
          if (facts.live)
            Row(
              key: const Key('shuttle-live'),
              mainAxisSize: MainAxisSize.min,
              children: [
                LiveDot(size: 6, animate: !still),
                const SizedBox(width: 2),
                Flexible(
                  child: Text('results.live'.tr().toUpperCase(), style: AppText.strong(size: 10, color: AppColors.ink).copyWith(letterSpacing: 1.2)),
                ),
              ],
            ),
          if (figures.isNotEmpty)
            Text.rich(
              key: const Key('shuttle-figures'),
              TextSpan(
                children: [
                  for (final (i, (value, label)) in figures.indexed) ...[
                    if (i > 0) TextSpan(text: ' · ', style: word),
                    TextSpan(
                      text: _t('minutes', args: ['$value']),
                      style: figure,
                    ),
                    TextSpan(text: ' $label', style: word),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _Figure extends StatelessWidget {
  const _Figure({super.key, required this.value, required this.label});

  final int value;
  final String label;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(_t('minutes', args: ['$value']), style: AppText.tabular(size: 16).copyWith(height: 1.1)),
      Text(label.toUpperCase(), style: AppText.strong(size: 10.5, color: AppColors.muted).copyWith(letterSpacing: 0.4, height: 1.2)),
    ],
  );
}

/// Inner track of the rail: the minibuses run between the P tile and the plane tile (20 px each).
const _tile = 20.0;
const _marker = 28.0;

/// L3 « Le trajet en direct » (14/10/2026): « ● Navette en direct » with the age of the freshest position, then a
/// dashed rail from the parking (dark P) to the terminal (plane), each running shuttle a white disc with an orange
/// ring at its real progress (at most three). It reads the screen's shared poll and never asks the API itself: before
/// the first answer, or while no shuttle runs, the rail has no minibus and says « Suivie en direct le jour J ». The
/// minibuses glide from one answer to the next; with reduced motion they jump and the dot does not breathe.
class LiveShuttleRail extends StatefulWidget {
  const LiveShuttleRail({super.key, this.rail, this.receivedAt, required this.destination});

  final RailState? rail;
  final DateTime? receivedAt;

  /// « Terminal 1 · 5 min ».
  final String destination;

  @override
  State<LiveShuttleRail> createState() => _LiveShuttleRailState();
}

class _LiveShuttleRailState extends State<LiveShuttleRail> {
  Timer? _ticker;

  /// Off while a page covers the results (or the route is offstage): a Timer, unlike a Ticker, ignores TickerMode.
  bool _inView = true;

  bool get _hasAge => widget.rail?.ageSeconds != null && widget.receivedAt != null;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _inView = TickerMode.valuesOf(context).enabled;
    _syncTicker();
  }

  @override
  void didUpdateWidget(LiveShuttleRail oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncTicker();
  }

  /// The age runs on between two answers (every 12 s), one tick a second, only while there is one to show and the
  /// rail is in view (back in view, the next build shows the right age at once).
  void _syncTicker() {
    if (_hasAge && _inView && LiveDot.animationsEnabled) {
      _ticker ??= Timer.periodic(const Duration(seconds: 1), (_) => setState(() {}));
    } else {
      _ticker?.cancel();
      _ticker = null;
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  String? _age() {
    if (!_hasAge) return null;
    final seconds = (widget.rail!.ageSeconds! + DateTime.now().difference(widget.receivedAt!).inSeconds).clamp(0, 86400);
    return seconds < 60 ? 'live.seconds'.tr(args: ['$seconds']) : 'live.minutes'.tr(args: ['${seconds ~/ 60}']);
  }

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final markers = widget.rail?.markers ?? const <RailMarker>[];
    final age = _age();
    return Column(
      key: const Key('live-rail'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Each on one line: the status at the right of the title while both fit, under it otherwise (as the site).
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 2,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                LiveDot(size: 7, animate: !still),
                const SizedBox(width: 3),
                Flexible(
                  child: Text(_t('live').toUpperCase(), style: AppText.strong(size: 10, color: AppColors.ink).copyWith(letterSpacing: 1.2)),
                ),
              ],
            ),
            Text(
              age ?? _t('day_j'),
              key: const Key('live-rail-status'),
              style: AppText.strong(
                size: 11.5,
                color: age != null ? AppColors.success : AppColors.muted,
              ).copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
            ),
          ],
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 6, 4, 2),
          child: SizedBox(
            height: 30,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final track = constraints.maxWidth - 2 * _tile;
                return Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Positioned(
                      left: 10,
                      right: 12,
                      top: 14,
                      child: CustomPaint(size: Size(double.infinity, 2), painter: _DashedLine()),
                    ),
                    Positioned(
                      left: 0,
                      top: 5,
                      child: Container(
                        width: _tile,
                        height: _tile,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(color: AppColors.dark, borderRadius: BorderRadius.circular(6)),
                        child: Text('P', style: AppText.big(size: 11, color: Colors.white)),
                      ),
                    ),
                    Positioned(
                      right: 0,
                      top: 5,
                      child: Container(
                        width: _tile,
                        height: _tile,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(6)),
                        child: const Icon(Icons.flight_rounded, size: 13, color: AppColors.dark),
                      ),
                    ),
                    for (final m in markers)
                      AnimatedPositioned(
                        key: ValueKey('rail-${m.id}'),
                        duration: still ? Duration.zero : const Duration(milliseconds: 1200),
                        curve: Curves.easeOut,
                        left: _tile + track * m.progress - _marker / 2,
                        top: 1,
                        child: _RailShuttle(towardsParking: m.towardsParking),
                      ),
                  ],
                );
              },
            ),
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(_t('parking'), style: AppText.body(size: 11, weight: 600, color: AppColors.muted)),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                widget.destination,
                textAlign: TextAlign.right,
                style: AppText.body(size: 11, weight: 600, color: AppColors.muted),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _RailShuttle extends StatelessWidget {
  const _RailShuttle({required this.towardsParking});

  final bool towardsParking;

  @override
  Widget build(BuildContext context) {
    // The minibus faces east (the terminal) at rest.
    const icon = Icon(Icons.airport_shuttle_rounded, size: 15, color: AppColors.accentDeep);
    return Container(
      key: const Key('rail-shuttle'),
      width: _marker,
      height: _marker,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.surface,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.accent, width: 2),
        boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 10, offset: Offset(0, 3))],
      ),
      child: towardsParking ? Transform.flip(flipX: true, child: icon) : icon,
    );
  }
}

class _DashedLine extends CustomPainter {
  const _DashedLine();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.muted.withValues(alpha: 0.4)
      ..strokeWidth = 2;
    const dash = 5.0, gap = 4.0;
    for (var x = 0.0; x < size.width; x += dash + gap) {
      canvas.drawLine(Offset(x, 1), Offset((x + dash).clamp(0, size.width), 1), paint);
    }
  }

  @override
  bool shouldRepaint(_DashedLine oldDelegate) => false;
}
