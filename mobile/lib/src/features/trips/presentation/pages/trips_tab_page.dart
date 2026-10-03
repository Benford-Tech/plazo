import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/router/app_router.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/segmented.dart';
import '../bloc/trips_bloc.dart';
import '../widgets/add_booking_sheet.dart';
import '../widgets/trip_card.dart';

enum _Segment { upcoming, past }

/// A5, "Mes réservations": every booking kept on this phone, without an account (reference and
/// manage token in the keychain), À venir / Passées; "Ajouter une réservation" for one made on the
/// site. The /ma-reservation links open this tab.
@RoutePage()
class TripsTabPage extends StatefulWidget {
  const TripsTabPage({super.key});

  @override
  State<TripsTabPage> createState() => _TripsTabPageState();
}

class _TripsTabPageState extends State<TripsTabPage> {
  _Segment _segment = _Segment.upcoming;

  Future<void> _add() async {
    final trips = context.read<TripsBloc>();
    final router = context.router;
    final reference = await showAddBookingSheet(context);
    if (reference == null) return;
    trips.add(const TripsLoaded(quiet: true));
    await router.push(MyBookingRoute(reference: reference));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: BrandAppBar(title: 'trips.title'.tr()),
      body: BlocBuilder<TripsBloc, TripsState>(
        builder: (context, state) {
          final list = _segment == _Segment.upcoming ? state.upcoming : state.past;
          return RefreshIndicator(
            color: AppColors.accent,
            onRefresh: () async => context.read<TripsBloc>().add(const TripsLoaded(quiet: true)),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
              children: [
                Segmented<_Segment>(
                  key: const Key('trips-segment'),
                  values: _Segment.values,
                  labels: ['trips.upcoming'.tr(), 'trips.past'.tr()],
                  selected: _segment,
                  onChanged: (s) => setState(() => _segment = s),
                ),
                const SizedBox(height: 12),
                if (state.loadState.isProcessing && state.bookings.isEmpty)
                  const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator(color: AppColors.accent)))
                else if (state.loadState.isError && state.bookings.isEmpty)
                  Text('trips.offline'.tr(), style: AppText.body(size: 14, color: AppColors.danger))
                else if (list.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      _segment == _Segment.upcoming ? 'trips.empty_upcoming'.tr() : 'trips.empty_past'.tr(),
                      key: const Key('trips-empty'),
                      style: AppText.muted(size: 14.5),
                    ),
                  )
                else
                  for (final b in list) ...[TripCard(booking: b, now: state.now), const SizedBox(height: 12)],
                const SizedBox(height: 6),
                OutlineAction(key: const Key('trips-add'), icon: Icons.add_rounded, label: 'trips.add'.tr(), onPressed: _add),
                const SizedBox(height: 8),
                Text('trips.add_hint'.tr(), style: AppText.muted(size: 13)),
                if (_segment == _Segment.upcoming && list.isEmpty) ...[
                  const SizedBox(height: 16),
                  GradientButton(label: 'trips.search'.tr(), onPressed: () => context.tabsRouter.setActiveIndex(0)),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
