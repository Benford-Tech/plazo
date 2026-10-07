import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/helpers/money.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../../../shared/widgets/shuttle_icon.dart';
import '../../data/models/public_models.dart';

/// The results on the IGN plan (as the site's map): the terminals, and each parking as a price pill
/// ("45 €", "Complet"). Tapping a pill selects its card.
class ResultsMap extends StatelessWidget {
  const ResultsMap({super.key, required this.airport, required this.results, required this.selected, required this.onSelect});

  final AirportModel airport;
  final List<SearchResultModel> results;
  final String? selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final located = results.where((r) => r.location != null).toList();
    final terminals = airport.location == null ? null : LatLng(airport.location!.lat, airport.location!.lng);
    final points = [?terminals, for (final r in located) LatLng(r.location!.lat, r.location!.lng)];
    final center = points.isEmpty ? const LatLng(45.7256, 5.0811) : points.first;
    return Stack(
      children: [
        Positioned.fill(child: Container(color: const Color(0xFFECEFE6))),
        FlutterMap(
          options: MapOptions(
            initialCenter: center,
            initialZoom: 13,
            initialCameraFit: points.length > 1
                ? CameraFit.bounds(bounds: LatLngBounds.fromPoints(points), padding: const EdgeInsets.fromLTRB(60, 60, 60, 60), maxZoom: 15)
                : null,
            interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
          ),
          children: [
            if (IgnMap.tilesEnabled)
              TileLayer(urlTemplate: AppConstants.ignPlanTilesUrl, userAgentPackageName: 'com.benfordtech.parking_app', maxNativeZoom: 19),
            MarkerLayer(
              markers: [
                if (terminals != null)
                  Marker(
                    point: terminals,
                    width: 120,
                    height: 36,
                    child: Center(
                      child: _Pill(label: 'results.map_terminals'.tr(), color: AppColors.dark, textColor: Colors.white),
                    ),
                  ),
                for (final r in located)
                  Marker(
                    point: LatLng(r.location!.lat, r.location!.lng),
                    width: r.liveShuttle ? 124 : 104,
                    height: 48,
                    child: Center(
                      child: _PricePill(result: r, selected: r.slug == selected, onTap: () => onSelect(r.slug)),
                    ),
                  ),
              ],
            ),
          ],
        ),
        Positioned(
          right: 6,
          top: 4,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            color: Colors.white.withValues(alpha: 0.8),
            child: Text(AppConstants.ignAttribution, style: AppText.body(size: 10, color: AppColors.muted)),
          ),
        ),
        if (located.length < results.length)
          Positioned(
            left: 10,
            top: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.95), borderRadius: BorderRadius.circular(14)),
              child: Text('results.map_no_position'.tr(args: ['${results.length - located.length}']), style: AppText.muted(size: 12)),
            ),
          ),
      ],
    );
  }
}

class _PricePill extends StatelessWidget {
  const _PricePill({required this.result, required this.selected, required this.onTap});

  final SearchResultModel result;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = result.bookable ? formatShortEuros(result.priceCents!) : (result.priceCents == null ? 'results.no_price'.tr() : 'results.full'.tr());
    final bookable = result.bookable;
    return Semantics(
      button: true,
      selected: selected,
      label: (result.liveShuttle ? 'results.map_pill_live_a11y' : 'results.map_pill_a11y').tr(args: [result.title, label]),
      excludeSemantics: true,
      child: GestureDetector(
        key: Key('pill-${result.slug}'),
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: SizedBox(
          height: 48,
          child: Center(
            child: AnimatedScale(
              scale: selected ? 1.12 : 1,
              duration: const Duration(milliseconds: 150),
              child: _Pill(
                label: label,
                live: result.liveShuttle,
                color: selected ? AppColors.dark : (bookable ? AppColors.accent : Colors.white),
                textColor: bookable || selected ? Colors.white : AppColors.muted,
                border: bookable || selected ? null : AppColors.line,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.color, required this.textColor, this.border, this.live = false});

  final String label;

  /// I-C: the parking's shuttles are followed live (a minibus before the price).
  final bool live;
  final Color color;
  final Color textColor;
  final Color? border;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(14),
      border: border == null ? null : Border.all(color: border!),
      boxShadow: const [BoxShadow(color: Color(0x66000000), blurRadius: 14, offset: Offset(0, 6), spreadRadius: -6)],
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (live) ...[ShuttleIcon(size: 14, color: textColor), const SizedBox(width: 4)],
        Flexible(child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.strong(size: 13.5, color: textColor))),
      ],
    ),
  );
}
