import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_shuttle/data/models/shuttle_models.dart';
import '../../../pro_shuttle/domain/usecases/shuttle_use_cases.dart';
import '../bloc/pro_auth_bloc.dart';

/// "Mon véhicule aujourd'hui" (V-A, 05/10/2026): the shuttle the driver takes for the day, among the
/// operator's vehicles in service; one taken by a colleague is shown but cannot be picked. Stored on
/// the account (the manager sees it in the team) and preselected at the start of each trip. Shown
/// after the "Chauffeur" post is chosen, then from Plus › Mon véhicule.
@RoutePage()
class ProVehiclePage extends StatefulWidget {
  const ProVehiclePage({super.key});

  /// Tests: the list, instead of the API.
  @visibleForTesting
  static Future<List<ShuttleVehicleModel>> Function()? loader;

  @override
  State<ProVehiclePage> createState() => _ProVehiclePageState();
}

/// Radio value of "Sans véhicule attitré".
const _none = '__none__';

class _ProVehiclePageState extends State<ProVehiclePage> {
  late final Future<List<ShuttleVehicleModel>> _vehicles =
      ProVehiclePage.loader?.call() ?? locator<GetVehiclesUseCase>()(NoParams()).then((r) => r.fold((_) => const <ShuttleVehicleModel>[], (v) => v));
  String? _chosen;

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProAuthBloc, ProAuthState>(
      listenWhen: (a, b) => a.vehicleState != b.vehicleState,
      listener: (context, state) {
        if (state.vehicleState.isSuccess) {
          context.router.replaceAll([const ProShellRoute()]);
        } else if (state.vehicleState.isError) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(translateErrorCode(state.errorCode))));
        }
      },
      builder: (context, state) {
        final staff = state.staff;
        final current = _chosen ?? staff?.vehicle?.id ?? _none;
        // After the post page nothing is below: no back arrow then (the Navigator, not the router: tests have none).
        final canPop = Navigator.of(context).canPop();
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: 'vehicle_day.title'.tr(), leading: canPop ? null : const SizedBox.shrink()),
          body: SafeArea(
            child: FutureBuilder<List<ShuttleVehicleModel>>(
              future: _vehicles,
              builder: (context, snapshot) {
                final vehicles = snapshot.data;
                if (vehicles == null) return const Center(child: CircularProgressIndicator(color: AppColors.accent));
                final offered = vehicles.where((v) => v.inService).toList();
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
                  children: [
                    Text(offered.isEmpty ? 'vehicle_day.empty'.tr() : 'vehicle_day.intro'.tr(), style: AppText.muted()),
                    const SizedBox(height: 16),
                    for (final v in offered) ...[
                      _VehicleCard(
                        vehicle: v,
                        selected: v.id == current,
                        takenBy: v.holderId != null && v.holderId != staff?.id ? v.holderName : null,
                        usual: v.driverId == staff?.id,
                        onTap: () => setState(() => _chosen = v.id),
                      ),
                      const SizedBox(height: 10),
                    ],
                    _NoneCard(selected: current == _none, onTap: () => setState(() => _chosen = _none)),
                    const SizedBox(height: 18),
                    GradientButton(
                      key: const Key('vehicle-day-confirm'),
                      label: 'vehicle_day.confirm'.tr(),
                      busy: state.vehicleState.isProcessing,
                      onPressed: () => context.read<ProAuthBloc>().add(ProAuthVehicleChosen(current == _none ? null : current)),
                    ),
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }
}

class _VehicleCard extends StatelessWidget {
  const _VehicleCard({required this.vehicle, required this.selected, required this.takenBy, required this.usual, required this.onTap});
  final ShuttleVehicleModel vehicle;
  final bool selected;

  /// A colleague holds it today: shown, not pickable.
  final String? takenBy;
  final bool usual;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final taken = takenBy != null;
    final v = vehicle;
    return Opacity(
      opacity: taken ? 0.55 : 1,
      child: Material(
        color: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.card, side: BorderSide(color: selected ? AppColors.accent : AppColors.line, width: selected ? 2 : 1)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          key: Key('vehicle-day-${v.id}'),
          onTap: taken ? null : onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(color: selected ? AppColors.accent : AppColors.tint, borderRadius: AppRadius.small),
                  child: Icon(Icons.airport_shuttle_rounded, color: selected ? AppColors.onAccent : AppColors.accent),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: Text(v.title, style: AppText.title(size: 20))),
                          if (v.plate != null) FrenchPlate(v.plate!, size: 11),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        [
                          if (v.seats != null) 'shuttle.vehicle_seats'.tr(args: ['${v.seats}']),
                          if (taken) 'vehicle_day.taken_by'.tr(args: [takenBy!]) else if (usual) 'vehicle_day.usual'.tr(),
                        ].join(' · '),
                        style: AppText.muted(size: 13),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, color: selected ? AppColors.accent : AppColors.line),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// "Sans véhicule attitré": the driver picks one at each trip (or types it).
class _NoneCard extends StatelessWidget {
  const _NoneCard({required this.selected, required this.onTap});
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: AppColors.surface,
    shape: RoundedRectangleBorder(borderRadius: AppRadius.card, side: BorderSide(color: selected ? AppColors.accent : AppColors.line, width: selected ? 2 : 1)),
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      key: const Key('vehicle-day-none'),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('vehicle_day.none'.tr(), style: AppText.strong(size: 15)),
                  Text('vehicle_day.none_help'.tr(), style: AppText.muted(size: 13)),
                ],
              ),
            ),
            Icon(selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, color: selected ? AppColors.accent : AppColors.line),
          ],
        ),
      ),
    ),
  );
}
