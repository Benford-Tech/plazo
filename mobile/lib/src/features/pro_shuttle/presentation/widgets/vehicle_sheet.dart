import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';

/// "Votre navette": one of the operator's vehicles in service (with its seats), or typed by hand
/// (model, colour, plate). [passengers] is the people count of the selection, for the seats warning.
class VehicleSheet extends StatefulWidget {
  const VehicleSheet({super.key, required this.vehicles, this.current, this.passengers = 0});

  final List<ShuttleVehicleModel> vehicles;
  final TripVehicleChoice? current;
  final int passengers;

  @override
  State<VehicleSheet> createState() => _VehicleSheetState();
}

/// Radio value of "Autre véhicule" (typed by hand).
const _free = '__free__';

class _VehicleSheetState extends State<VehicleSheet> {
  late String? _vehicleId = widget.vehicles.any((v) => v.id == widget.current?.vehicleId) ? widget.current!.vehicleId : widget.vehicles.firstOrNull?.id;
  late final _model = TextEditingController(text: widget.current?.model ?? '');
  late final _colour = TextEditingController(text: widget.current?.colour ?? '');
  late final _plate = TextEditingController(text: widget.current?.plate ?? '');

  ShuttleVehicleModel? get _chosen => widget.vehicles.where((v) => v.id == _vehicleId).firstOrNull;
  bool get _tooMany => _chosen?.seats != null && widget.passengers > _chosen!.seats!;

  @override
  void dispose() {
    _model.dispose();
    _colour.dispose();
    _plate.dispose();
    super.dispose();
  }

  TripVehicleChoice get _choice => _vehicleId != null
      ? TripVehicleChoice(vehicleId: _vehicleId)
      : TripVehicleChoice(
          model: _model.text.trim().isEmpty ? null : _model.text.trim(),
          colour: _colour.text.trim().isEmpty ? null : _colour.text.trim(),
          plate: _plate.text.trim().isEmpty ? null : _plate.text.trim(),
        );

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(header: true, child: Text('shuttle.vehicle_title'.tr(), style: AppText.title(size: 22))),
            const SizedBox(height: 4),
            Text('shuttle.vehicle_help'.tr(), style: AppText.muted()),
            const SizedBox(height: 10),
            if (widget.vehicles.isNotEmpty) ...[
              Text('shuttle.vehicle_pick'.tr(), style: AppText.strong(size: 14)),
              RadioGroup<String>(
                groupValue: _vehicleId ?? _free,
                onChanged: (id) => setState(() => _vehicleId = id == _free ? null : id),
                child: Column(
                  children: [
                    for (final v in widget.vehicles)
                      RadioListTile<String>(
                        key: Key('vehicle-${v.id}'),
                        value: v.id,
                        contentPadding: EdgeInsets.zero,
                        activeColor: AppColors.accent,
                        title: Text(v.title, style: AppText.body(size: 14.5)),
                        subtitle: v.plate == null && v.seats == null
                            ? null
                            : Text([if (v.plate != null) v.plate!, if (v.seats != null) 'shuttle.vehicle_seats'.tr(args: ['${v.seats}'])].join(' · '), style: AppText.muted()),
                      ),
                    RadioListTile<String>(
                      key: const Key('vehicle-free'),
                      value: _free,
                      contentPadding: EdgeInsets.zero,
                      activeColor: AppColors.accent,
                      title: Text('shuttle.vehicle_free'.tr(), style: AppText.body(size: 14.5)),
                    ),
                  ],
                ),
              ),
            ],
            if (_vehicleId == null) ...[
              TextField(key: const Key('vehicle-model'), controller: _model, decoration: InputDecoration(labelText: 'shuttle.vehicle_model'.tr())),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: TextField(key: const Key('vehicle-colour'), controller: _colour, decoration: InputDecoration(labelText: 'shuttle.vehicle_colour'.tr()))),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      key: const Key('vehicle-plate'),
                      controller: _plate,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(labelText: 'shuttle.vehicle_plate'.tr(), hintText: 'GH-456-JK'),
                    ),
                  ),
                ],
              ),
            ],
            if (_tooMany) ...[
              const SizedBox(height: 8),
              Text(
                'shuttle.vehicle_too_many'.tr(args: ['${widget.passengers}', '${_chosen!.seats}']),
                key: const Key('vehicle-too-many'),
                style: AppText.body(size: 13.5, color: AppColors.danger),
              ),
            ],
            const SizedBox(height: 14),
            GradientButton(key: const Key('vehicle-confirm'), label: 'shuttle.vehicle_confirm'.tr(), onPressed: _tooMany ? null : () => Navigator.of(context).pop(_choice)),
          ],
        ),
      ),
    );
  }
}
