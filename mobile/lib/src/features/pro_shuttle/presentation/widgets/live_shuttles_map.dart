import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../data/models/shuttle_models.dart';

/// P-A (05/10/2026): the operator's shuttles on the road, on IGN's plan: the parking ("P"), the stops
/// served (airport, station…) and one bus per running trip, the signed-in driver's own in accent.
/// Shuttles without a position yet are listed below the map, not drawn.
class LiveShuttlesMap extends StatefulWidget {
  const LiveShuttlesMap({super.key, required this.data, this.myStaffId, this.height = 190});

  final LiveShuttlesModel data;
  final String? myStaffId;
  final double height;

  @override
  State<LiveShuttlesMap> createState() => _LiveShuttlesMapState();
}

class _LiveShuttlesMapState extends State<LiveShuttlesMap> {
  final _controller = MapController();
  bool _ready = false;

  List<LatLng> _points() {
    final d = widget.data;
    return [
      if (d.parking.lat != null && d.parking.lng != null) LatLng(d.parking.lat!, d.parking.lng!),
      for (final t in d.trips)
        if (t.position != null) LatLng(t.position!.lat, t.position!.lng),
      for (final t in d.trips)
        if (t.position != null && t.stop != null) LatLng(t.stop!.lat, t.stop!.lng),
    ];
  }

  CameraFit? _fit() {
    final points = _points();
    if (points.length < 2) return null;
    return CameraFit.bounds(bounds: LatLngBounds.fromPoints(points), padding: const EdgeInsets.fromLTRB(40, 36, 40, 24), maxZoom: 16);
  }

  @override
  void didUpdateWidget(LiveShuttlesMap old) {
    super.didUpdateWidget(old);
    if (!_ready) return;
    final fit = _fit();
    if (fit != null) _controller.fitCamera(fit);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.data;
    final points = _points();
    final center = points.firstOrNull ?? const LatLng(45.7256, 5.0811);
    return ClipRRect(
      borderRadius: AppRadius.card,
      child: SizedBox(
        height: widget.height,
        child: Stack(
          children: [
            Positioned.fill(child: Container(color: const Color(0xFFECEFE6))),
            FlutterMap(
              mapController: _controller,
              options: MapOptions(
                initialCenter: center,
                initialZoom: 13,
                initialCameraFit: _fit(),
                onMapReady: () => _ready = true,
                interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
              ),
              children: [
                if (IgnMap.tilesEnabled) TileLayer(urlTemplate: AppConstants.ignPlanTilesUrl, userAgentPackageName: 'com.benfordtech.parking_app', maxNativeZoom: 19),
                MarkerLayer(
                  markers: [
                    if (d.parking.lat != null && d.parking.lng != null)
                      Marker(point: LatLng(d.parking.lat!, d.parking.lng!), width: 150, height: 30, child: const Center(child: _Pin(label: 'P', icon: null))),
                    for (final s in {for (final t in d.trips) if (t.position != null && t.stop != null) t.stop!.name: t.stop!}.values)
                      Marker(
                        point: LatLng(s.lat, s.lng),
                        width: 190,
                        height: 30,
                        child: Center(child: _Pin(label: s.name, icon: s.kind == 'station' ? Icons.train_rounded : Icons.flight_rounded)),
                      ),
                    for (final t in d.trips)
                      if (t.position != null)
                        Marker(
                          key: Key('live-bus-${t.id}'),
                          point: LatLng(t.position!.lat, t.position!.lng),
                          width: 36,
                          height: 36,
                          child: _Bus(mine: t.driverId == widget.myStaffId),
                        ),
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

class _Pin extends StatelessWidget {
  const _Pin({required this.label, required this.icon});
  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(color: AppColors.dark, borderRadius: BorderRadius.circular(12)),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[Icon(icon, size: 13, color: Colors.white), const SizedBox(width: 4)],
        Flexible(child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.strong(size: 12, color: Colors.white))),
      ],
    ),
  );
}

class _Bus extends StatelessWidget {
  const _Bus({required this.mine});
  final bool mine;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: mine ? AppColors.accent : AppColors.peach,
      shape: BoxShape.circle,
      border: Border.all(color: Colors.white, width: 2),
      boxShadow: const [BoxShadow(color: Color(0x55000000), blurRadius: 6, offset: Offset(0, 2))],
    ),
    child: Icon(Icons.directions_bus_rounded, size: 18, color: mine ? AppColors.onAccent : const Color(0xFF2C1A0E)),
  );
}
