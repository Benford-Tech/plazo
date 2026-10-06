import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../services/location_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../data/models/public_booking_model.dart';
import '../bloc/car_location_bloc.dart';

/// Rough beyond this: the traveller is invited to retry.
const carAccuracyRoughM = 30;

/// "Ma voiture" (06/10/2026): where the car is parked. Without a position, "Enregistrer où je suis
/// garé" takes the phone's GPS fix (with an optional note); with one, the pin on the IGN photo,
/// who recorded it and when, and "Corriger" / "Effacer" for the traveller's own position (a valet's
/// one cannot be changed from here). Needs a [CarLocationBloc] above.
class CarLocationCard extends StatefulWidget {
  const CarLocationCard({super.key, required this.booking, this.onChanged});

  final PublicBookingModel booking;
  final void Function(PublicBookingModel booking)? onChanged;

  /// Shown from the booking's start to the hand-back.
  static bool relevant(PublicBookingModel b) => const {'upcoming', 'arrived', 'shuttled_out', 'return_requested', 'back_at_parking'}.contains(b.status);

  @override
  State<CarLocationCard> createState() => _CarLocationCardState();
}

class _CarLocationCardState extends State<CarLocationCard> {
  late final _note = TextEditingController(text: widget.booking.car?.note ?? '');
  bool _editing = false;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CarLocationBloc, CarLocationState>(
      listener: (context, state) {
        if (state.viewState.isSuccess && state.booking != null) {
          setState(() => _editing = false);
          widget.onChanged?.call(state.booking!);
        }
      },
      builder: (context, state) {
        final car = state.booking?.car ?? widget.booking.car;
        final bloc = context.read<CarLocationBloc>();
        final busy = state.viewState.isProcessing;
        final mine = car != null && !car.byStaff;
        final problem = state.locationProblem;
        return AppCard(
          key: const Key('car-location-card'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.directions_car_rounded, color: AppColors.accent, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text('car.title'.tr(), style: AppText.strong(size: 16))),
                  if (car != null && car.accuracyM != null)
                    Text(
                      'car.accuracy'.tr(args: ['${car.accuracyM}']),
                      key: const Key('car-accuracy'),
                      style: AppText.tabular(size: 12, color: car.accuracyM! > carAccuracyRoughM ? AppColors.danger : AppColors.accent),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              if (car == null || _editing) ...[
                Text(car == null ? 'car.intro'.tr() : 'car.edit_intro'.tr(), style: AppText.muted(size: 13.5)),
                const SizedBox(height: 10),
                TextField(
                  key: const Key('car-note'),
                  controller: _note,
                  maxLength: 120,
                  decoration: InputDecoration(labelText: 'car.note'.tr(), hintText: 'car.note_hint'.tr(), counterText: ''),
                ),
                const SizedBox(height: 10),
                GradientButton(
                  key: const Key('car-save'),
                  icon: Icons.my_location_rounded,
                  label: car == null ? 'car.save'.tr() : 'car.resave'.tr(),
                  busy: busy,
                  onPressed: () => bloc.add(CarLocationRequested(reference: widget.booking.reference, note: _note.text)),
                ),
                if (_editing)
                  TextButton(
                    onPressed: busy ? null : () => setState(() => _editing = false),
                    child: Text('car.cancel'.tr(), style: AppText.strong(size: 14, color: AppColors.muted)),
                  ),
              ] else ...[
                IgnMap(meeting: LatLng(car.lat, car.lng), meetingLabel: 'car.pin'.tr(), height: 180, interactive: true, accent: AppColors.accent),
                const SizedBox(height: 8),
                Text(
                  '${car.byStaff ? 'car.by_staff'.tr(args: [hhmm(car.at)]) : 'car.by_me'.tr(args: [hhmm(car.at)])}'
                  '${car.note != null ? ' · ${car.note}' : ''}',
                  key: const Key('car-summary'),
                  style: AppText.muted(size: 13),
                ),
                if (car.accuracyM != null && car.accuracyM! > carAccuracyRoughM) ...[
                  const SizedBox(height: 4),
                  Text('car.rough'.tr(), style: AppText.body(size: 13, color: AppColors.danger)),
                ],
                if (mine) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          key: const Key('car-edit'),
                          onPressed: busy ? null : () => setState(() => _editing = true),
                          child: Text('car.edit'.tr()),
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        key: const Key('car-clear'),
                        onPressed: busy ? null : () => bloc.add(CarLocationCleared(widget.booking.reference)),
                        child: Text('car.clear'.tr(), style: AppText.strong(size: 14, color: AppColors.muted)),
                      ),
                    ],
                  ),
                ] else ...[
                  const SizedBox(height: 4),
                  Text('car.staff_locked'.tr(), style: AppText.muted(size: 12.5)),
                ],
              ],
              if (problem != null || state.noFix || (state.viewState.isError && state.errorCode != null)) ...[
                const SizedBox(height: 8),
                Text(
                  problem != null
                      ? switch (problem) {
                          LocationAccess.deniedForever => 'arrival.location_denied_forever'.tr(),
                          LocationAccess.serviceDisabled => 'arrival.location_service_disabled'.tr(),
                          _ => 'arrival.location_denied'.tr(),
                        }
                      : state.noFix
                      ? 'car.no_fix'.tr()
                      : translateErrorCode(state.errorCode),
                  key: const Key('car-error'),
                  style: AppText.body(size: 13, color: AppColors.danger),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
