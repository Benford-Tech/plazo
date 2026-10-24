import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/child_seats/child_seats.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/child_seat_widgets.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/models/public_booking_model.dart';
import '../../domain/usecases/booking_actions_use_cases.dart';

/// « Sièges auto » (24/10/2026) on « Ma réservation »: the seats asked for the shuttle (or « Aucun siège demandé »),
/// and « Modifier » while the booking is still expected (the API answers `child_seats_locked` afterwards).
class ChildSeatsCard extends StatelessWidget {
  const ChildSeatsCard({super.key, required this.booking, this.onChanged});

  final PublicBookingModel booking;

  /// The booking after a change (the page refreshes with it).
  final ValueChanged<PublicBookingModel>? onChanged;

  /// Shown while the seats can still be changed, or once some were asked (the day of the stay, the traveller checks).
  static bool relevant(PublicBookingModel b) => b.status == 'upcoming' || (b.active && b.childSeats.any);

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final editable = b.status == 'upcoming';
    return AppCard(
      key: const Key('booking-child-seats-card'),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(padding: EdgeInsets.only(top: 2), child: ChildSeatIcon(size: 20)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('child_seats.title'.tr(), style: AppText.strong()),
                const SizedBox(height: 2),
                Text(
                  b.childSeats.any ? childSeatsSummary(b.childSeats) : 'child_seats.none'.tr(),
                  key: const Key('booking-child-seats-summary'),
                  style: AppText.muted(),
                ),
              ],
            ),
          ),
          if (editable)
            TextButton(
              key: const Key('booking-child-seats-edit'),
              onPressed: () async {
                final updated = await showChildSeatsSheet(context, b);
                if (updated != null) onChanged?.call(updated);
              },
              style: TextButton.styleFrom(minimumSize: const Size(48, 44), padding: const EdgeInsets.symmetric(horizontal: 8)),
              child: Text('common.modify'.tr(), style: AppText.body(size: 13.5, weight: 600, color: AppColors.accent)),
            ),
        ],
      ),
    );
  }
}

/// The sheet with the three steppers and « Enregistrer » (PUT /public/bookings/:ref/child-seats).
Future<PublicBookingModel?> showChildSeatsSheet(BuildContext context, PublicBookingModel booking) => showModalBottomSheet<PublicBookingModel>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  backgroundColor: Colors.white,
  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
  builder: (_) => ChildSeatsSheet(booking: booking),
);

class ChildSeatsSheet extends StatefulWidget {
  const ChildSeatsSheet({super.key, required this.booking, this.update});
  final PublicBookingModel booking;

  /// The use case (the locator's by default; a test passes its own).
  final UpdateChildSeatsUseCase? update;

  @override
  State<ChildSeatsSheet> createState() => _ChildSeatsSheetState();
}

class _ChildSeatsSheetState extends State<ChildSeatsSheet> {
  late ChildSeats _seats = widget.booking.childSeats;
  bool _saving = false;
  String? _errorCode;

  Future<void> _save() async {
    // The same rule as the API's: the children count in the passengers.
    final refusal = _seats.refusal(widget.booking.passengers);
    if (refusal != null) {
      setState(() => _errorCode = refusal);
      return;
    }
    setState(() {
      _saving = true;
      _errorCode = null;
    });
    final update = widget.update ?? locator<UpdateChildSeatsUseCase>();
    final result = await update(UpdateChildSeatsParams(reference: widget.booking.reference, seats: _seats));
    if (!mounted) return;
    if (result.isLeft) {
      final f = result.fold((f) => f, (_) => throw StateError('unreachable'));
      setState(() {
        _saving = false;
        _errorCode = f.fields?['childSeats'] ?? f.code ?? 'generic';
      });
      return;
    }
    final saved = result.fold((_) => throw StateError('unreachable'), (b) => b);
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(SnackBar(content: Text('child_seats.saved'.tr())));
    Navigator.of(context).pop(saved);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      // Edge-to-edge: useSafeArea only clears the top and sides; the last button stays above the navigation bar.
      padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.paddingOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Semantics(header: true, child: Text('child_seats.sheet_title'.tr(), style: AppText.title(size: 22))),
          const SizedBox(height: 6),
          Text('child_seats.sheet_intro'.tr(), style: AppText.muted()),
          const SizedBox(height: 10),
          ChildSeatsEditor(seats: _seats, enabled: !_saving, onChanged: (s) => setState(() => _seats = s)),
          const SizedBox(height: 6),
          Text('child_seats.note'.tr(), style: AppText.muted(size: 12.5)),
          if (_errorCode != null) ...[
            const SizedBox(height: 8),
            Text(translateErrorCode(_errorCode), key: const Key('child-seats-sheet-error'), style: AppText.body(size: 14, weight: 600, color: AppColors.danger)),
          ],
          const SizedBox(height: 14),
          GradientButton(key: const Key('child-seats-save'), label: 'child_seats.save'.tr(), busy: _saving, onPressed: _save),
        ],
      ),
    );
  }
}
