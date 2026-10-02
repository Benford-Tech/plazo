import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../core/constants/app_constants.dart';
import '../theme/theme.dart';

/// A small map on IGN's "Plan IGN v2" tiles (Géoplateforme, no key): the traveller and the meeting
/// point. Used by the traveller (sharing in progress) and by the staff (approaching card).
class IgnMap extends StatefulWidget {
  const IgnMap({
    super.key,
    required this.meeting,
    required this.meetingLabel,
    this.me,
    this.height = 250,
    this.interactive = false,
    this.dashedLine = false,
    this.accent = AppColors.violet,
  });

  /// Widget tests run without network: they switch the tiles off.
  static bool tilesEnabled = true;

  final LatLng meeting;
  final String meetingLabel;
  final LatLng? me;
  final double height;
  final bool interactive;
  final bool dashedLine;
  final Color accent;

  @override
  State<IgnMap> createState() => _IgnMapState();
}

class _IgnMapState extends State<IgnMap> {
  final _controller = MapController();
  bool _ready = false;

  /// Both points in view (or the meeting point alone).
  CameraFit? _fit() {
    final me = widget.me;
    if (me == null || (me.latitude == widget.meeting.latitude && me.longitude == widget.meeting.longitude)) return null;
    // Room for the meeting point's label, in proportion to the map's height (small on a card).
    final v = widget.height * 0.16;
    return CameraFit.bounds(bounds: LatLngBounds(me, widget.meeting), padding: EdgeInsets.fromLTRB(70, v + 8, 70, v), maxZoom: 17);
  }

  @override
  void didUpdateWidget(IgnMap old) {
    super.didUpdateWidget(old);
    // A new position (the first one, or the traveller moved): keep both points in view.
    if (_ready && (old.me != widget.me || old.meeting != widget.meeting)) {
      final fit = _fit();
      if (fit != null) {
        _controller.fitCamera(fit);
      } else {
        _controller.move(widget.meeting, 15);
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final me = widget.me;
    final meeting = widget.meeting;
    final interactive = widget.interactive;
    final dashedLine = widget.dashedLine;
    final accent = widget.accent;
    final meetingLabel = widget.meetingLabel;
    final height = widget.height;
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: height,
        child: Stack(
          children: [
            Positioned.fill(child: Container(color: const Color(0xFFECEFE6))),
            FlutterMap(
              mapController: _controller,
              options: MapOptions(
                initialCenter: me ?? meeting,
                initialZoom: 15,
                initialCameraFit: _fit(),
                onMapReady: () => _ready = true,
                interactionOptions: InteractionOptions(flags: interactive ? InteractiveFlag.all & ~InteractiveFlag.rotate : InteractiveFlag.none),
              ),
              children: [
                if (IgnMap.tilesEnabled)
                  TileLayer(urlTemplate: AppConstants.ignPlanTilesUrl, userAgentPackageName: 'com.benfordtech.parking_app', maxNativeZoom: 19),
                if (dashedLine && me != null)
                  PolylineLayer(
                    polylines: [
                      Polyline(points: [me, meeting], color: accent, strokeWidth: 3, pattern: StrokePattern.dashed(segments: const [8, 6])),
                    ],
                  ),
                MarkerLayer(
                  markers: [
                    Marker(point: meeting, width: 140, height: 34, child: Center(child: _MeetingPin(label: meetingLabel))),
                    if (me != null) Marker(point: me, width: 40, height: 40, child: _MeDot(color: accent)),
                  ],
                ),
              ],
            ),
            Positioned(
              right: 6,
              bottom: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                color: Colors.white.withValues(alpha: 0.8),
                child: Text(AppConstants.ignAttribution, style: AppText.body(size: 10, color: AppColors.muted)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MeetingPin extends StatelessWidget {
  const _MeetingPin({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    decoration: BoxDecoration(color: AppColors.prune, borderRadius: BorderRadius.circular(14)),
    child: Text('P  $label', maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.strong(size: 12, color: Colors.white)),
  );
}

class _MeDot extends StatelessWidget {
  const _MeDot({required this.color});
  final Color color;

  @override
  Widget build(BuildContext context) => Center(
    child: Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: 0.2)),
      alignment: Alignment.center,
      child: Container(
        width: 18,
        height: 18,
        decoration: BoxDecoration(shape: BoxShape.circle, color: color, border: Border.all(color: Colors.white, width: 3)),
      ),
    ),
  );
}
