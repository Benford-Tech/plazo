import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../booking/data/models/public_booking_model.dart';
import '../bloc/manage_booking_bloc.dart';
import '../bloc/trips_bloc.dart';

/// "Modifier le vol · Itinéraire · Annuler" of a booking (mockup A5), with the site's rules: the
/// flight while the API allows it (canEditFlight), the itinerary while the stay is active, the
/// cancellation while upcoming (the sheet explains the terms and the refund).
class BookingActions extends StatelessWidget {
  const BookingActions({super.key, required this.booking, this.onChanged});

  final PublicBookingModel booking;

  /// The booking after a change (the list and the page refresh with it).
  final ValueChanged<PublicBookingModel>? onChanged;

  void _changed(PublicBookingModel b) {
    locator<TripsBloc>().add(TripsBookingChanged(b));
    onChanged?.call(b);
  }

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final links = locator<LinkService>();
    final destination = b.parking.address ?? '${b.parking.title}, ${b.parking.airport?.name ?? ''}';
    final actions = <Widget>[
      if (b.canEditFlight)
        _Action(
          key: Key('action-flight-${b.reference}'),
          label: 'trips.edit_flight'.tr(),
          onTap: () async {
            final updated = await showFlightSheet(context, b);
            if (updated != null) _changed(updated);
          },
        ),
      if (b.active && b.status != 'pending_payment')
        _Action(
          key: Key('action-itinerary-${b.reference}'),
          label: 'trips.itinerary'.tr(),
          onTap: () => links.open(links.directions(destination)),
        ),
      if (b.status == 'upcoming')
        _Action(
          key: Key('action-cancel-${b.reference}'),
          label: 'trips.cancel'.tr(),
          danger: true,
          onTap: () async {
            final updated = await showCancelSheet(context, b);
            if (updated != null) _changed(updated);
          },
        ),
    ];
    if (actions.isEmpty) return const SizedBox.shrink();
    return Wrap(alignment: WrapAlignment.spaceBetween, children: actions);
  }
}

class _Action extends StatelessWidget {
  const _Action({super.key, required this.label, required this.onTap, this.danger = false});
  final String label;
  final VoidCallback onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: onTap,
    style: TextButton.styleFrom(minimumSize: const Size(48, 48), padding: const EdgeInsets.symmetric(horizontal: 6)),
    child: Text(label, style: AppText.body(size: 13.5, weight: 600, color: danger ? AppColors.danger : AppColors.muted)),
  );
}

Future<T?> _sheet<T>(BuildContext context, Widget child) => showModalBottomSheet<T>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  backgroundColor: Colors.white,
  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
  builder: (_) => BlocProvider(create: (_) => locator<ManageBookingBloc>(), child: child),
);

/// "Modifier le vol": set, change or clear the return flight (the shuttle follows it).
Future<PublicBookingModel?> showFlightSheet(BuildContext context, PublicBookingModel booking) => _sheet(context, FlightSheet(booking: booking));

/// "Annuler": the terms (free until…, refund) then "Confirmer l'annulation".
Future<PublicBookingModel?> showCancelSheet(BuildContext context, PublicBookingModel booking) => _sheet(context, CancelSheet(booking: booking));

class FlightSheet extends StatefulWidget {
  const FlightSheet({super.key, required this.booking});
  final PublicBookingModel booking;

  @override
  State<FlightSheet> createState() => _FlightSheetState();
}

class _FlightSheetState extends State<FlightSheet> {
  late final _controller = TextEditingController(text: widget.booking.returnFlight ?? '');

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ManageBookingBloc, ManageBookingState>(
      listener: (context, state) {
        if (state.viewState.isSuccess) {
          ScaffoldMessenger.maybeOf(context)?.showSnackBar(SnackBar(content: Text('manage.flight_saved'.tr())));
          Navigator.of(context).pop(state.booking);
        }
      },
      builder: (context, state) => Padding(
        padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.viewInsetsOf(context).bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(header: true, child: Text('manage.flight_title'.tr(), style: AppText.title(size: 22))),
            const SizedBox(height: 12),
            TextField(
              key: const Key('flight-field'),
              controller: _controller,
              autofocus: true,
              maxLength: 10,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                labelText: 'manage.flight_label'.tr(),
                hintText: 'TO 3627',
                helperText: 'manage.flight_help'.tr(),
                helperMaxLines: 3,
                counterText: '',
                errorText: state.viewState.isError ? translateErrorCode(state.errorCode) : null,
                errorMaxLines: 3,
              ),
            ),
            const SizedBox(height: 14),
            GradientButton(
              key: const Key('flight-save'),
              label: 'manage.flight_save'.tr(),
              busy: state.viewState.isProcessing,
              onPressed: () =>
                  context.read<ManageBookingBloc>().add(ManageFlightSubmitted(reference: widget.booking.reference, flight: _controller.text)),
            ),
          ],
        ),
      ),
    );
  }
}

class CancelSheet extends StatelessWidget {
  const CancelSheet({super.key, required this.booking});
  final PublicBookingModel booking;

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final until = b.cancellableUntil == null ? null : formatDateTimeAt(b.cancellableUntil!);
    final open = b.canCancel && until != null;
    final phone = b.parking.phone == null ? null : formatPhone(b.parking.phone!);
    final contact = phone != null ? 'manage.contact_phone'.tr(args: [phone]) : 'manage.contact_desk'.tr();
    return BlocConsumer<ManageBookingBloc, ManageBookingState>(
      listener: (context, state) {
        if (state.viewState.isSuccess) {
          final refunded = state.booking?.payment?.status == 'refunded';
          ScaffoldMessenger.maybeOf(context)?.showSnackBar(
            SnackBar(content: Text(refunded ? 'manage.cancelled_now_refunded'.tr() : 'manage.cancelled_now'.tr())),
          );
          Navigator.of(context).pop(state.booking);
        }
      },
      builder: (context, state) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(header: true, child: Text('manage.cancel_title'.tr(), style: AppText.title(size: 22))),
            const SizedBox(height: 10),
            if (open) ...[
              Text(
                b.online ? 'manage.cancel_text_online'.tr(args: [until]) : 'manage.cancel_text_on_site'.tr(args: [until]),
                key: const Key('cancel-terms'),
                style: AppText.body(size: 14.5, height: 1.45),
              ),
              const SizedBox(height: 6),
              Text(
                b.online ? 'manage.cancel_confirm_text_online'.tr() : 'manage.cancel_confirm_text_on_site'.tr(),
                style: AppText.muted(size: 13.5),
              ),
              if (state.viewState.isError) ...[
                const SizedBox(height: 10),
                Text(translateErrorCode(state.errorCode), style: AppText.body(size: 14, weight: 600, color: AppColors.danger)),
              ],
              const SizedBox(height: 16),
              FilledButton(
                key: const Key('cancel-confirm'),
                onPressed: state.viewState.isProcessing ? null : () => context.read<ManageBookingBloc>().add(ManageCancelSubmitted(b.reference)),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.danger,
                  minimumSize: const Size.fromHeight(52),
                  shape: const StadiumBorder(),
                  textStyle: AppText.strong(size: 15.5),
                ),
                child: state.viewState.isProcessing
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : Text('manage.cancel_confirm'.tr()),
              ),
              const SizedBox(height: 8),
              OutlineAction(label: 'manage.cancel_keep'.tr(), onPressed: () => Navigator.of(context).pop()),
            ] else ...[
              Text(
                '${until != null ? 'manage.cancel_closed'.tr(args: [until]) : 'manage.cancel_non_refundable'.tr()} $contact',
                key: const Key('cancel-closed'),
                style: AppText.body(size: 14.5, height: 1.45),
              ),
              const SizedBox(height: 16),
              OutlineAction(label: 'common.close'.tr(), onPressed: () => Navigator.of(context).pop()),
            ],
          ],
        ),
      ),
    );
  }
}
