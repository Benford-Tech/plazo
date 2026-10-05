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

/// "Retrouver ma voiture" (T-A, 05/10/2026): the mockup's dark screen. The plate, the spot the valet
/// placed the vehicle on and its zone, the parking on the plan, and the walking directions.
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
          final location = d.parking.location;
          final stay = spot?.stayClass == null ? null : 'find_car.zone_${spot!.stayClass}'.tr();
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
                            spot == null ? 'find_car.no_spot'.tr() : 'find_car.spot'.tr(args: [spot.code]),
                            style: AppText.big(size: spot == null ? 18 : 30, color: Colors.white),
                          ),
                          Text(spot == null ? 'find_car.no_spot_help'.tr() : (stay ?? d.parking.name), style: AppText.body(size: 13, color: Colors.white70)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (location != null) ...[
                IgnMap(meeting: LatLng(location.lat, location.lng), meetingLabel: d.parking.name, height: 240, interactive: true, accent: AppColors.accent),
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
                label: 'find_car.route'.tr(),
                onPressed: location == null && d.parking.address == null
                    ? null
                    : () => locator<LinkService>().open(
                        Uri.https('www.google.com', '/maps/dir/', {
                          'api': '1',
                          'destination': location != null ? '${location.lat},${location.lng}' : d.parking.address!,
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
