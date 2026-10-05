import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/helpers/geo_rect.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../data/models/plan_models.dart';

/// The IGN aerial photo with the outline being drawn and, once generated, the spots.
/// Z-A: the stay zones on the plan, from the aisle (light) to the back of the file (deep).
Color stayFill(String? stayClass) => switch (stayClass) {
  'short' => const Color(0x99FFF3B0),
  'medium' => const Color(0x8CF5C400),
  'long' => const Color(0xA6B58900),
  _ => const Color(0x8CF5C400),
};

class PlanMap extends StatefulWidget {
  const PlanMap({
    super.key,
    required this.center,
    this.corners = const [],
    this.spots = const [],
    this.onTap,
    this.onLongPress,
    this.onMoved,
    this.zoom = 18,
    this.showCrosshair = false,
    this.polygons,
  });

  final LatLng center;
  final List<LatLng> corners;
  final List<SpotModel> spots;
  final void Function(LatLng point)? onTap;
  final void Function(LatLng point)? onLongPress;
  final void Function(LatLng center)? onMoved;
  final double zoom;
  final bool showCrosshair;

  /// Ready-made polygons (the occupation's coloured spots), drawn instead of [spots].
  final List<Polygon>? polygons;

  @override
  State<PlanMap> createState() => _PlanMapState();
}

class _PlanMapState extends State<PlanMap> {
  final _controller = MapController();

  @override
  void didUpdateWidget(PlanMap old) {
    super.didUpdateWidget(old);
    if (old.center != widget.center && widget.onMoved == null) _controller.move(widget.center, _controller.camera.zoom);
    if (old.center != widget.center && widget.onMoved != null && distanceM(old.center, widget.center) > 50) _controller.move(widget.center, widget.zoom);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ring = widget.corners;
    return Stack(
      children: [
        FlutterMap(
          mapController: _controller,
          options: MapOptions(
            initialCenter: widget.center,
            initialZoom: widget.zoom,
            maxZoom: 20,
            onTap: widget.onTap == null ? null : (_, point) => widget.onTap!(point),
            onLongPress: widget.onLongPress == null ? null : (_, point) => widget.onLongPress!(point),
            onPositionChanged: widget.onMoved == null ? null : (camera, hasGesture) => hasGesture ? widget.onMoved!(camera.center) : null,
            interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
          ),
          children: [
            if (IgnMap.tilesEnabled)
              TileLayer(urlTemplate: AppConstants.ignOrthoTilesUrl, userAgentPackageName: 'com.benfordtech.parking_app', maxNativeZoom: 19),
            if (widget.polygons != null) PolygonLayer(polygons: widget.polygons!),
            if (widget.polygons == null && widget.spots.isNotEmpty)
              PolygonLayer(
                polygons: [
                  for (final s in widget.spots)
                    Polygon(
                      points: s.geometry.map((p) => LatLng(p[1], p[0])).toList(),
                      color: s.active ? stayFill(s.stayClass) : const Color(0x26F3F3F0),
                      borderColor: s.active ? const Color(0xFFA3E635) : const Color(0xFF9A9A94),
                      borderStrokeWidth: 1,
                    ),
                ],
              ),
            if (ring.length >= 2)
              PolygonLayer(
                polygons: [Polygon(points: ring, color: const Color(0x2EFF8A3D), borderColor: AppColors.accent, borderStrokeWidth: 2.5)],
              ),
            if (ring.isNotEmpty && widget.spots.isEmpty)
              MarkerLayer(
                markers: [
                  for (var i = 0; i < ring.length; i++)
                    Marker(
                      point: ring[i],
                      width: 22,
                      height: 22,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.accent, width: 3),
                        ),
                      ),
                    ),
                ],
              ),
          ],
        ),
        if (widget.showCrosshair) const IgnoreCanvas(),
        Positioned(
          left: 8,
          bottom: 6,
          child: Text(AppConstants.ignOrthoAttribution, style: AppText.body(size: 10, color: Colors.white.withValues(alpha: 0.85))),
        ),
      ],
    );
  }
}

/// A pin in the middle of the map, for the "where" step.
class IgnoreCanvas extends StatelessWidget {
  const IgnoreCanvas({super.key});

  @override
  Widget build(BuildContext context) {
    return const IgnorePointer(
      child: Center(
        child: Padding(
          padding: EdgeInsets.only(bottom: 30),
          child: Icon(Icons.location_on_rounded, size: 40, color: AppColors.brand),
        ),
      ),
    );
  }
}
