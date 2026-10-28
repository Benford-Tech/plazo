import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// « Arrivées · Départs » (27/10/2026, extended to every list of Plazo Pro on 28/10/2026): an arrival is green, a
/// departure indigo; a card of either kind has a pale ground of its colour, a 4 px edge on the left and a filled pill.
enum Movement { arrival, departure }

/// The booking's next movement at the parking: its arrival while expected, its departure while the car is there.
Movement? nextMovementOf(String status) => switch (status) {
  'upcoming' => Movement.arrival,
  'arrived' || 'shuttled_out' || 'return_requested' || 'back_at_parking' => Movement.departure,
  _ => null,
};

Color movementColor(Movement m) => m == Movement.arrival ? AppStatus.ok : AppStatus.info;
Color movementSoft(Movement m) => m == Movement.arrival ? AppStatus.okSoft : AppStatus.infoSoft;

/// « ARRIVÉE » / « DÉPART » on its colour, or « ARRIVÉE · 06:30 » with a time.
class MovementPill extends StatelessWidget {
  const MovementPill(this.kind, {super.key, this.time});
  final Movement kind;
  final String? time;

  @override
  Widget build(BuildContext context) {
    final label = (kind == Movement.arrival ? 'pro.kind_dropoff' : 'pro.kind_return').tr().toUpperCase();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: movementColor(kind), borderRadius: AppRadius.small),
      child: Text(
        time == null ? label : '$label · $time',
        style: AppText.label(size: 10.5, color: AppStatus.okInk).copyWith(fontWeight: FontWeight.w800),
      ),
    );
  }
}

/// The kind's edge on the left of a card's content (the card itself takes [movementSoft] as its ground).
class MovementEdge extends StatelessWidget {
  const MovementEdge({super.key, required this.kind, required this.child});
  final Movement? kind;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final k = kind;
    if (k == null) return child;
    // IntrinsicHeight: the list gives no height, so the edge strip stretches to the card's own.
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(width: 4, color: movementColor(k)),
          Expanded(child: child),
        ],
      ),
    );
  }
}
