import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_settings/data/models/settings_models.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';
import '../../domain/usecases/shuttle_use_cases.dart';
import '../bloc/pro_vehicles_bloc.dart';

/// "Véhicules de navette" (managers, V-A "Fiche complète"): model, colour, plate, passenger seats,
/// in service / out of service, usual driver. Add, edit, remove.
@RoutePage()
class ProVehiclesPage extends StatelessWidget implements AutoRouteWrapper {
  const ProVehiclesPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProVehiclesBloc>()..add(const ProVehiclesStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProVehiclesBloc, ProVehiclesState>(
      listenWhen: (a, b) => a.errorCode != b.errorCode || a.notice != b.notice,
      listener: (context, state) {
        // Field errors are shown in the sheet; the rest as a notice.
        final text = state.errorCode != null && state.fieldErrors.isEmpty ? translateErrorCode(state.errorCode) : state.notice?.tr();
        if (text != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
          context.read<ProVehiclesBloc>().add(const ProVehiclesNoticeShown());
        }
      },
      builder: (context, state) {
        final bloc = context.read<ProVehiclesBloc>();
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: 'vehicles.title'.tr()),
          floatingActionButton: FloatingActionButton.extended(
            key: const Key('vehicle-add'),
            backgroundColor: AppColors.accent,
            foregroundColor: AppColors.onAccent,
            icon: const Icon(Icons.add_rounded),
            label: Text('vehicles.add'.tr()),
            onPressed: () => showVehicleSheetEditor(context),
          ),
          body: state.viewState.isProcessing && state.vehicles.isEmpty
              ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
              : state.viewState.isError && state.vehicles.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                  children: [
                    Text('vehicles.intro'.tr(), style: AppText.muted()),
                    const SizedBox(height: 12),
                    if (state.vehicles.isEmpty) Text('vehicles.empty'.tr(), key: const Key('vehicles-empty'), style: AppText.body(size: 14)),
                    for (final v in state.vehicles)
                      _VehicleTile(
                        vehicle: v,
                        busy: state.actionState.isProcessing,
                        onEdit: () => showVehicleSheetEditor(context, vehicle: v),
                        onToggle: () => bloc.add(ProVehicleServiceToggled(v.id)),
                        onRemove: () => _confirmRemove(context, v),
                      ),
                  ],
                ),
        );
      },
    );
  }

  Future<void> _confirmRemove(BuildContext context, ShuttleVehicleModel v) {
    final bloc = context.read<ProVehiclesBloc>();
    return showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('vehicles.remove_title'.tr(args: [v.model])),
        content: Text('vehicles.remove_help'.tr()),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: Text('common.back'.tr())),
          TextButton(
            key: const Key('vehicle-remove-confirm'),
            onPressed: () {
              Navigator.of(ctx).pop();
              bloc.add(ProVehicleRemoved(v.id));
            },
            child: Text('vehicles.remove'.tr()),
          ),
        ],
      ),
    );
  }
}

/// The sheet editor (new vehicle when [vehicle] is null).
Future<void> showVehicleSheetEditor(BuildContext context, {ShuttleVehicleModel? vehicle}) {
  final bloc = context.read<ProVehiclesBloc>();
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    useSafeArea: true,
    builder: (sheet) => BlocProvider.value(value: bloc, child: _SheetEditor(vehicle: vehicle)),
  );
}

class _VehicleTile extends StatelessWidget {
  const _VehicleTile({required this.vehicle, required this.busy, required this.onEdit, required this.onToggle, required this.onRemove});
  final ShuttleVehicleModel vehicle;
  final bool busy;
  final VoidCallback onEdit;
  final VoidCallback onToggle;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final v = vehicle;
    final details = [
      if (v.seats != null) 'vehicles.seats_short'.tr(args: ['${v.seats}']),
      if (v.driverName != null) 'vehicles.driver_short'.tr(args: [v.driverName!]),
    ].join(' · ');
    return Container(
      key: Key('vehicle-${v.id}'),
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(border: Border.all(color: v.inService ? AppColors.line : AppColors.canvas), borderRadius: AppRadius.chip),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(v.title, style: AppText.strong(size: 15, color: v.inService ? AppColors.ink : AppColors.muted))),
              if (v.plate != null) FrenchPlate(v.plate!, size: 11),
            ],
          ),
          if (details.isNotEmpty) Text(details, style: AppText.muted(size: 12.5)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  v.inService ? 'vehicles.in_service'.tr() : 'vehicles.out_of_service'.tr(),
                  key: Key('service-${v.id}'),
                  style: AppText.label(size: 11.5, color: v.inService ? AppColors.success : AppColors.danger),
                ),
              ),
              Switch(key: Key('toggle-${v.id}'), value: v.inService, activeTrackColor: AppColors.accent, onChanged: busy ? null : (_) => onToggle()),
              IconButton(key: Key('edit-${v.id}'), tooltip: 'vehicles.edit'.tr(), icon: const Icon(Icons.edit_outlined, color: AppColors.accent), onPressed: busy ? null : onEdit),
              IconButton(key: Key('remove-${v.id}'), tooltip: 'vehicles.remove'.tr(), icon: const Icon(Icons.delete_outline_rounded, color: AppColors.danger), onPressed: busy ? null : onRemove),
            ],
          ),
        ],
      ),
    );
  }
}

class _SheetEditor extends StatefulWidget {
  const _SheetEditor({this.vehicle});
  final ShuttleVehicleModel? vehicle;
  @override
  State<_SheetEditor> createState() => _SheetEditorState();
}

/// Dropdown value of "no usual driver".
const _noDriver = '__none__';

class _SheetEditorState extends State<_SheetEditor> {
  late final _model = TextEditingController(text: widget.vehicle?.model ?? '');
  late final _colour = TextEditingController(text: widget.vehicle?.colour ?? '');
  late final _plate = TextEditingController(text: widget.vehicle?.plate ?? '');
  late final _seats = TextEditingController(text: widget.vehicle?.seats?.toString() ?? '');
  late String _driverId = widget.vehicle?.driverId ?? _noDriver;
  late bool _inService = widget.vehicle?.inService ?? true;

  @override
  void dispose() {
    for (final c in [_model, _colour, _plate, _seats]) {
      c.dispose();
    }
    super.dispose();
  }

  void _save(BuildContext context) {
    final seatsText = _seats.text.trim();
    final seats = seatsText.isEmpty ? null : int.tryParse(seatsText);
    if (seatsText.isNotEmpty && seats == null) return;
    final v = widget.vehicle;
    final input = VehicleSheetInput(
      model: _model.text.trim(),
      colour: _colour.text,
      plate: _plate.text.toUpperCase(),
      seats: seats,
      clearSeats: seats == null && v?.seats != null,
      inService: _inService,
      driverId: _driverId == _noDriver ? null : _driverId,
      clearDriver: _driverId == _noDriver,
    );
    context.read<ProVehiclesBloc>().add(ProVehicleSaved(VehicleSheetParams(id: v?.id, input: input)));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProVehiclesBloc, ProVehiclesState>(
      listenWhen: (a, b) => a.notice != b.notice && (b.notice == 'vehicles.added' || b.notice == 'vehicles.updated'),
      listener: (context, state) => Navigator.of(context).pop(),
      builder: (context, state) {
        String? err(String f) => state.fieldErrors[f] == null ? null : translateErrorCode(state.fieldErrors[f]);
        final team = state.team;
        // A driver who left the team still shows on the sheet until changed.
        final known = team.any((m) => m.id == _driverId) || _driverId == _noDriver;
        return Padding(
          padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.viewInsetsOf(context).bottom + 16),
          child: ListView(
            shrinkWrap: true,
            children: [
              Text(widget.vehicle == null ? 'vehicles.add'.tr() : 'vehicles.editing'.tr(args: [widget.vehicle!.model]), style: AppText.title(size: 20)),
              const SizedBox(height: 12),
              TextField(
                key: const Key('sheet-model'),
                controller: _model,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(labelText: 'vehicles.model'.tr(), hintText: 'vehicles.model_hint'.tr(), errorText: err('model')),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      key: const Key('sheet-colour'),
                      controller: _colour,
                      decoration: InputDecoration(labelText: 'vehicles.colour'.tr(), hintText: 'vehicles.colour_hint'.tr(), errorText: err('colour')),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      key: const Key('sheet-plate'),
                      controller: _plate,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(labelText: 'vehicles.plate'.tr(), hintText: 'GH-456-JK', errorText: err('plate')),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                key: const Key('sheet-seats'),
                controller: _seats,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: 'vehicles.seats'.tr(), helperText: 'vehicles.seats_help'.tr(), helperMaxLines: 2, errorText: err('seats')),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                key: const Key('sheet-driver'),
                initialValue: known ? _driverId : _noDriver,
                decoration: InputDecoration(labelText: 'vehicles.driver'.tr(), errorText: err('driverId')),
                items: [
                  DropdownMenuItem(value: _noDriver, child: Text('vehicles.driver_none'.tr())),
                  for (final TeamMemberModel m in team) DropdownMenuItem(value: m.id, child: Text('${m.name} · ${'pro_more.role.${m.role}'.tr()}')),
                ],
                onChanged: (v) => setState(() => _driverId = v ?? _noDriver),
              ),
              SwitchListTile(
                key: const Key('sheet-in-service'),
                contentPadding: EdgeInsets.zero,
                activeTrackColor: AppColors.accent,
                title: Text('vehicles.in_service'.tr(), style: AppText.body(size: 14.5)),
                subtitle: Text('vehicles.out_of_service_help'.tr(), style: AppText.muted(size: 12.5)),
                value: _inService,
                onChanged: (v) => setState(() => _inService = v),
              ),
              const SizedBox(height: 8),
              GradientButton(
                key: const Key('sheet-save'),
                label: widget.vehicle == null ? 'vehicles.add'.tr() : 'vehicles.save'.tr(),
                busy: state.actionState.isProcessing,
                onPressed: _model.text.trim().isEmpty ? null : () => _save(context),
              ),
            ],
          ),
        );
      },
    );
  }
}
