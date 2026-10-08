import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../../../shared/widgets/live_pill.dart';
import '../bloc/return_bloc.dart';

/// "3e depuis l'allée" / "1re depuis l'allée" for a car's position in its file; null without one.
String? filePositionLabel(int? position) => switch (position) {
  null => null,
  1 => 'find_car.position_first'.tr(),
  final p => 'find_car.position'.tr(args: ['$p']),
};

/// "Retrouver ma voiture" (T-A, 05/10/2026): the mockup's dark screen. The plate, the spot the valet
/// placed the vehicle on and its zone (or its file and position, S-C), the parking on the plan, and
/// the walking directions.
@RoutePage()
class FindCarPage extends StatelessWidget implements AutoRouteWrapper {
  const FindCarPage({super.key, @PathParam('reference') required this.reference});

  final String reference;

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ReturnBloc>()..add(ReturnOpened(reference)), child: this);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF141311),
      appBar: AppBar(
        backgroundColor: const Color(0xFF141311),
        foregroundColor: Colors.white,
        title: Text('find_car.title'.tr(), style: AppText.strong(size: 16, color: Colors.white)),
      ),
      body: BlocBuilder<ReturnBloc, ReturnState>(
        builder: (context, state) {
          final d = state.data;
          if (d == null) {
            return Center(
              child: state.loadState.isError
                  ? Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text('errors.generic'.tr(), style: AppText.body(color: Colors.white)),
                    )
                  : const CircularProgressIndicator(color: AppColors.accent),
            );
          }
          final spot = d.spot;
          // S-C (07/10/2026): on a valet parking the car stands in a file, not on a spot.
          final file = d.file;
          final car = d.car;
          final location = d.parking.location;
          // The recorded GPS fix of the car (06/10/2026) is the destination when there is one.
          final target = car != null ? LatLng(car.lat, car.lng) : (location == null ? null : LatLng(location.lat, location.lng));
          final stay = spot?.stayClass == null ? null : 'find_car.zone_${spot!.stayClass}'.tr();
          final placed = file != null || spot != null;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              Row(
                children: [
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), borderRadius: AppRadius.pill),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('find_car.your_vehicle'.tr(), style: AppText.strong(size: 12, color: Colors.white70)),
                            const SizedBox(width: 8),
                            FrenchPlate(d.plate, size: 12),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const Spacer(),
                  LivePill(at: state.fetchedAt ?? state.now, dark: true),
                ],
              ),
              const SizedBox(height: 14),
              // The spot, big, like the mockup's "H4 3425".
              Container(
                key: const Key('find-car-spot'),
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF2A2825), Color(0xFF1B1A18)]),
                  borderRadius: AppRadius.card,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                      child: Center(
                        child: Text('P', style: AppText.strong(size: 22, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            file != null
                                ? 'find_car.file'.tr(args: [file.code])
                                : spot != null
                                ? 'find_car.spot'.tr(args: [spot.code])
                                : car != null
                                ? 'find_car.car_title'.tr()
                                : 'find_car.no_spot'.tr(),
                            style: AppText.big(size: !placed && car == null ? 18 : 30, color: Colors.white),
                          ),
                          Text(
                            file != null
                                ? (filePositionLabel(file.position) ?? d.parking.name)
                                : spot != null
                                ? (stay ?? d.parking.name)
                                : car != null
                                ? 'find_car.car_help'.tr(args: [car.note != null ? ' · ${car.note}' : ''])
                                : 'find_car.no_spot_help'.tr(),
                            style: AppText.body(size: 13, color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (target != null) ...[
                IgnMap(
                  key: const Key('find-car-map'),
                  meeting: target,
                  meetingLabel: car != null ? 'car.pin'.tr() : d.parking.name,
                  height: 240,
                  interactive: true,
                  accent: AppColors.accent,
                ),
                const SizedBox(height: 8),
              ],
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), borderRadius: AppRadius.card),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(d.parking.name, style: AppText.strong(size: 15, color: Colors.white)),
                    if (d.parking.address != null) Text(d.parking.address!, style: AppText.body(size: 13, color: Colors.white70)),
                    const SizedBox(height: 6),
                    Text('find_car.keys'.tr(), style: AppText.body(size: 13, color: Colors.white70)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GradientButton(
                key: const Key('find-car-route'),
                icon: Icons.directions_walk_rounded,
                label: car != null ? 'find_car.route_car'.tr() : 'find_car.route'.tr(),
                onPressed: target == null && d.parking.address == null
                    ? null
                    : () => locator<LinkService>().open(
                        Uri.https('www.google.com', '/maps/dir/', {
                          'api': '1',
                          'destination': target != null ? '${target.latitude},${target.longitude}' : d.parking.address!,
                          'travelmode': 'walking',
                        }),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
