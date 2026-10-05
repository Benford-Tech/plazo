import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/router/app_router.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../pro_shuttle/presentation/widgets/live_shuttles_card.dart';
import '../../data/models/dashboard_model.dart';
import '../bloc/pro_dashboard_bloc.dart';

/// The pro home, the same as on the web (fusion "Flotte + Opérations", 05/10/2026): five figures,
/// the services, what to treat first, the vehicles on the parking, the running shuttles.
class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  bool _allVehicles = false;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProDashboardBloc, ProDashboardState>(
      builder: (context, state) {
        final d = state.data;
        if (d == null) {
          return Center(
            child: state.viewState.isError
                ? Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(state.errorMessage ?? 'errors.generic'.tr(), textAlign: TextAlign.center),
                  )
                : const CircularProgressIndicator(color: AppColors.accent),
          );
        }
        final vehicles = _allVehicles ? d.vehicles : d.vehicles.take(6).toList();
        return RefreshIndicator(
          color: AppColors.accent,
          onRefresh: () async => context.read<ProDashboardBloc>().add(const ProDashboardPolled()),
          child: ListView(
            key: const Key('dashboard'),
            padding: const EdgeInsets.all(14),
            children: [
              _Kpis(d: d),
              const SizedBox(height: 12),
              _Services(s: d.services),
              const SizedBox(height: 16),
              _SectionTitle('dashboard.alerts_title'.tr(), count: d.alerts.isEmpty ? null : d.alerts.length),
              if (d.alerts.isEmpty) _Empty('dashboard.alerts_empty'.tr()) else for (final a in d.alerts) _AlertTile(alert: a),
              const SizedBox(height: 16),
              _SectionTitle('dashboard.vehicles_title'.tr(), count: d.vehicles.length),
              if (d.vehicles.isEmpty) _Empty('dashboard.vehicles_empty'.tr()) else for (final v in vehicles) _VehicleTile(v: v),
              if (d.vehicles.length > vehicles.length)
                TextButton(
                  key: const Key('dashboard-all-vehicles'),
                  onPressed: () => setState(() => _allVehicles = true),
                  child: Text(
                    'dashboard.all_vehicles'.tr(args: ['${d.vehicles.length}']),
                    style: AppText.strong(size: 14, color: AppColors.accent),
                  ),
                ),
              const SizedBox(height: 16),
              // P-A: the running shuttles, map and one row each (its own bloc, polled every 12 s).
              const LiveShuttlesCard(),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }
}

class _Kpis extends StatelessWidget {
  const _Kpis({required this.d});
  final DashboardModel d;

  @override
  Widget build(BuildContext context) {
    final c = d.counts;
    final free = c.freeSpots;
    final tiles = [
      _Kpi(
        label: 'dashboard.kpi_on_site'.tr(),
        value: c.onSite,
        sub: free == null
            ? (d.parking.plannedSpots == 0 ? 'dashboard.kpi_no_plan'.tr() : '')
            : 'dashboard.kpi_free'.tr(args: ['$free', '${d.parking.plannedSpots}']),
        onTap: () => context.router.navigate(const ProOccupationRoute()),
        key: const Key('kpi-on-site'),
      ),
      _Kpi(
        label: 'dashboard.kpi_arrivals'.tr(),
        value: c.arrivalsToday,
        sub: 'dashboard.kpi_arrived'.tr(args: ['${c.arrivedToday}', '${c.arrivalsToday}']),
        key: const Key('kpi-arrivals'),
      ),
      _Kpi(
        label: 'dashboard.kpi_returns'.tr(),
        value: c.returnsToday,
        sub: 'dashboard.kpi_week'.tr(args: ['${d.breakdown.returnsThisWeek}']),
        key: const Key('kpi-returns'),
      ),
      _Kpi(
        label: 'dashboard.kpi_shuttles'.tr(),
        value: c.shuttlesRunning,
        sub: c.shuttlesRunning == 0 ? 'dashboard.kpi_no_shuttle'.tr() : 'dashboard.kpi_running'.tr(),
        onTap: () => context.router.push(const ProShuttleRoute()),
        key: const Key('kpi-shuttles'),
      ),
      _Kpi(
        label: 'dashboard.kpi_to_treat'.tr(),
        value: c.toTreat,
        sub: d.urgent == 0 ? 'dashboard.kpi_no_urgent'.tr() : 'dashboard.kpi_urgent'.tr(args: ['${d.urgent}']),
        accent: d.urgent > 0,
        key: const Key('kpi-to-treat'),
      ),
    ];
    return LayoutBuilder(
      builder: (context, box) {
        final columns = box.maxWidth >= 700 ? 5 : (box.maxWidth >= 420 ? 3 : 2);
        return GridView.count(
          crossAxisCount: columns,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 1.55,
          children: tiles,
        );
      },
    );
  }
}

/// One figure: label in capitals, the number in mono, a line under it; yellow border when it needs an eye.
class _Kpi extends StatelessWidget {
  const _Kpi({super.key, required this.label, required this.value, required this.sub, this.onTap, this.accent = false});
  final String label;
  final int value;
  final String sub;
  final VoidCallback? onTap;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.card,
        side: BorderSide(color: accent ? AppColors.accent : AppColors.line),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.card,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label.toUpperCase(), style: AppText.label(size: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
              Text('$value', style: AppText.tabular(size: 28, color: accent ? AppColors.accent : AppColors.ink)),
              Text(sub, style: AppText.muted(size: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}

enum _Health { on, warn, off }

/// The state of the services: a dot (green, yellow, grey) and a word each, on one strip.
class _Services extends StatelessWidget {
  const _Services({required this.s});
  final DashboardServicesModel s;

  @override
  Widget build(BuildContext context) {
    final sms = s.sms.mode == 'none'
        ? (_Health.off, 'dashboard.sms_off'.tr())
        : s.sms.stale
        ? (_Health.warn, 'dashboard.sms_stale'.tr())
        : s.sms.pending > 0
        ? (_Health.warn, 'dashboard.sms_pending'.tr(args: ['${s.sms.pending}']))
        : (_Health.on, 'dashboard.sms_ok'.tr());
    final stripe = s.stripe.payoutsEnabled
        ? (_Health.on, 'dashboard.stripe_on'.tr())
        : s.stripe.connected
        ? (_Health.warn, 'dashboard.stripe_pending'.tr())
        : (_Health.off, 'dashboard.stripe_off'.tr());
    final items = [
      (
        Icons.flight_rounded,
        'dashboard.svc_flights'.tr(),
        s.flights.configured ? _Health.on : _Health.off,
        s.flights.configured ? 'dashboard.flights_on'.tr(args: [s.flights.provider ?? '']) : 'dashboard.flights_off'.tr(),
      ),
      (Icons.sms_rounded, 'dashboard.svc_sms'.tr(), sms.$1, sms.$2),
      (
        Icons.notifications_rounded,
        'dashboard.svc_push'.tr(),
        s.push.configured ? _Health.on : _Health.off,
        s.push.configured ? 'dashboard.push_on'.tr(args: ['${s.push.devices}']) : 'dashboard.push_off'.tr(),
      ),
      (Icons.credit_card_rounded, 'dashboard.svc_stripe'.tr(), stripe.$1, stripe.$2),
      (
        Icons.file_download_rounded,
        'dashboard.svc_import'.tr(),
        s.lastImportAt == null ? _Health.off : _Health.on,
        s.lastImportAt == null ? 'dashboard.import_never'.tr() : 'dashboard.import_at'.tr(args: [hhmm(s.lastImportAt!)]),
      ),
    ];
    return Container(
      key: const Key('dashboard-services'),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.line),
      ),
      child: Wrap(
        children: [
          for (final (icon, label, health, detail) in items)
            // Each service on its own small chip: the dot, the icon, the name, the state on one line.
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 220),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: switch (health) {
                          _Health.on => AppColors.success,
                          _Health.warn => AppColors.accent,
                          _Health.off => AppColors.muted.withValues(alpha: 0.5),
                        },
                      ),
                    ),
                    const SizedBox(width: 5),
                    Icon(icon, size: 14, color: AppColors.muted),
                    const SizedBox(width: 3),
                    Text(label.toUpperCase(), style: AppText.label(size: 10.5, color: AppColors.ink)),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(detail, style: AppText.muted(size: 11.5), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title, {this.count});
  final String title;
  final int? count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Semantics(header: true, child: Text(title.toUpperCase(), style: AppText.label(size: 13))),
          ),
          if (count != null) Text('$count', style: AppText.tabular(size: 14, color: AppColors.muted)),
        ],
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 10),
    child: Text(text, style: AppText.muted()),
  );
}

/// A situation to treat: icon by severity (yellow square when urgent), kind, who, detail, since when.
class _AlertTile extends StatelessWidget {
  const _AlertTile({required this.alert});
  final DashboardAlertModel alert;

  static const _icons = {'urgent': Icons.warning_rounded, 'watch': Icons.visibility_rounded, 'todo': Icons.key_rounded};

  @override
  Widget build(BuildContext context) {
    final urgent = alert.severity == 'urgent';
    final parts = [alert.customerName, alert.detail].whereType<String>().where((s) => s.isNotEmpty).toList();
    if (alert.minutes != null && alert.kind != 'flight_delayed') parts.add('dashboard.since'.tr(args: ['${alert.minutes}']));
    final id = alert.reservationId;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        key: Key('alert-${alert.kind}-${id ?? ''}'),
        color: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.card,
          side: BorderSide(color: urgent ? AppColors.accent : AppColors.line),
        ),
        child: InkWell(
          borderRadius: AppRadius.card,
          onTap: id == null ? null : () => context.router.push(ProReservationRoute(id: id)),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(10, 9, 12, 9),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: urgent ? AppColors.accent : Colors.transparent,
                    borderRadius: AppRadius.small,
                    border: urgent ? null : Border.all(color: AppColors.line),
                  ),
                  child: Icon(_icons[alert.severity] ?? Icons.info_rounded, size: 18, color: urgent ? AppColors.onAccent : AppColors.muted),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text('dashboard.kind.${alert.kind}'.tr(), style: AppText.strong(size: 14), overflow: TextOverflow.ellipsis),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'dashboard.severity.${alert.severity}'.tr().toUpperCase(),
                            style: AppText.label(size: 10, color: urgent ? AppColors.accent : AppColors.muted),
                          ),
                        ],
                      ),
                      if (parts.isNotEmpty) Text(parts.join(' · '), style: AppText.muted(size: 12.5), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                if (alert.plate != null) ...[const SizedBox(width: 8), FrenchPlate(alert.plate!, size: 11)],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// A vehicle on the parking: plate, customer, return, spot and keys (yellow when missing).
class _VehicleTile extends StatelessWidget {
  const _VehicleTile({required this.v});
  final DashboardVehicleModel v;

  @override
  Widget build(BuildContext context) {
    final returnAt = DateTime.tryParse(v.returnAt);
    final String line;
    if (v.tripDirection != null) {
      line = v.tripDirection == 'dropoff' ? 'dashboard.on_trip_dropoff'.tr() : 'dashboard.on_trip_pickup'.tr();
    } else if (v.returnsToday) {
      line = [
        'dashboard.return_today'.tr(args: [returnAt == null ? localTime(v.returnAt) : hhmm(returnAt)]),
        if (v.returnFlight != null) v.returnFlight!,
      ].join(' · ');
    } else {
      line = 'dashboard.return_later'.tr(args: [returnAt == null ? v.returnAt : planningDay(returnAt.toLocal())]);
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        key: Key('vehicle-${v.id}'),
        color: AppColors.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: AppRadius.card,
          side: BorderSide(color: AppColors.line),
        ),
        child: InkWell(
          borderRadius: AppRadius.card,
          onTap: () => context.router.push(ProReservationRoute(id: v.id)),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 12, 8),
            child: Row(
              children: [
                FrenchPlate(v.plate, size: 11),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(v.customerName, style: AppText.strong(size: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text(line, style: AppText.muted(size: 12.5), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      v.spotCode ?? 'dashboard.no_spot'.tr(),
                      style: AppText.tabular(size: 14, color: v.spotCode == null ? AppColors.accent : AppColors.ink),
                    ),
                    Text(
                      v.keyHook == null ? 'dashboard.no_keys'.tr() : 'dashboard.keys'.tr(args: [v.keyHook!]),
                      style: AppText.muted(size: 11.5).copyWith(color: v.keyHook == null ? AppColors.accent : AppColors.muted),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
