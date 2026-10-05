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

/// Rounded panels of the "Flotte" mockup (12 px), whatever the flavor's own radius.
const _radius = BorderRadius.all(Radius.circular(12));
const _pill = BorderRadius.all(Radius.circular(999));

/// The pro home, the same as on the web (fusion "Flotte + Opérations", 05/10/2026): five figures with
/// a yellow disc, the services as tinted pills, what to treat first with a severity badge, the vehicles
/// on the parking with their state badges, the running shuttles.
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
            padding: const EdgeInsets.all(12),
            children: [
              _Kpis(d: d),
              const SizedBox(height: 10),
              _Services(s: d.services),
              const SizedBox(height: 10),
              _Panel(
                title: 'dashboard.alerts_title'.tr(),
                trailing: d.urgent > 0
                    ? _Badge(
                        tone: _Tone.bad,
                        text: 'dashboard.urgent_count'.tr(args: ['${d.urgent}']),
                      )
                    : d.alerts.isEmpty
                    ? null
                    : _Badge(tone: _Tone.line, text: '${d.alerts.length}'),
                child: d.alerts.isEmpty
                    ? Row(
                        children: [
                          const _StatusPill(tone: _Tone.ok, text: 'OK'),
                          const SizedBox(width: 8),
                          Expanded(child: Text('dashboard.alerts_empty'.tr(), style: AppText.muted())),
                        ],
                      )
                    : Column(
                        children: [for (final (i, a) in d.alerts.indexed) _AlertRow(alert: a, first: i == 0)],
                      ),
              ),
              const SizedBox(height: 10),
              _Panel(
                title: 'dashboard.vehicles_title'.tr(),
                sub: 'dashboard.refreshed'.tr(args: [hhmm(d.serverTime)]),
                trailing: _Badge(tone: _Tone.line, text: '${d.vehicles.length}'),
                child: d.vehicles.isEmpty
                    ? Text('dashboard.vehicles_empty'.tr(), style: AppText.muted())
                    : Column(
                        children: [
                          for (final v in vehicles) ...[_VehicleTile(v: v), const SizedBox(height: 8)],
                          if (d.vehicles.length > vehicles.length)
                            TextButton(
                              key: const Key('dashboard-all-vehicles'),
                              onPressed: () => setState(() => _allVehicles = true),
                              child: Text(
                                'dashboard.all_vehicles'.tr(args: ['${d.vehicles.length}']),
                                style: AppText.strong(size: 14, color: AppColors.accent),
                              ),
                            ),
                        ],
                      ),
              ),
              const SizedBox(height: 10),
              // P-A: the running shuttles, map and one row each (its own bloc, polled every 12 s).
              const _Panel(title: '', child: LiveShuttlesCard()),
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
        key: const Key('kpi-on-site'),
        label: 'dashboard.kpi_on_site'.tr(),
        icon: Icons.local_parking_rounded,
        value: c.onSite,
        sub: free == null
            ? (d.parking.plannedSpots == 0 ? 'dashboard.kpi_no_plan'.tr() : '')
            : 'dashboard.kpi_free'.tr(args: ['$free', '${d.parking.plannedSpots}']),
        onTap: () => context.router.navigate(const ProOccupationRoute()),
      ),
      _Kpi(
        key: const Key('kpi-arrivals'),
        label: 'dashboard.kpi_arrivals'.tr(),
        icon: Icons.flight_land_rounded,
        value: c.arrivalsToday,
        sub: 'dashboard.kpi_arrived'.tr(args: ['${c.arrivedToday}', '${c.arrivalsToday}']),
      ),
      _Kpi(
        key: const Key('kpi-returns'),
        label: 'dashboard.kpi_returns'.tr(),
        icon: Icons.flight_takeoff_rounded,
        value: c.returnsToday,
        sub: 'dashboard.kpi_week'.tr(args: ['${d.breakdown.returnsThisWeek}']),
      ),
      _Kpi(
        key: const Key('kpi-shuttles'),
        label: 'dashboard.kpi_shuttles'.tr(),
        icon: Icons.directions_bus_rounded,
        value: c.shuttlesRunning,
        sub: c.shuttlesRunning == 0 ? 'dashboard.kpi_no_shuttle'.tr() : 'dashboard.kpi_running'.tr(),
        onTap: () => context.router.push(const ProShuttleRoute()),
      ),
      _Kpi(
        key: const Key('kpi-to-treat'),
        label: 'dashboard.kpi_to_treat'.tr(),
        icon: Icons.warning_amber_rounded,
        value: c.toTreat,
        sub: d.urgent == 0 ? 'dashboard.kpi_no_urgent'.tr() : 'dashboard.kpi_urgent'.tr(args: ['${d.urgent}']),
        alert: d.urgent > 0,
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
          childAspectRatio: 1.5,
          children: tiles,
        );
      },
    );
  }
}

/// One "Flotte" tile: mono label, a round disc with the icon, the figure in mono; amber border when it needs an eye.
class _Kpi extends StatelessWidget {
  const _Kpi({super.key, required this.label, required this.icon, required this.value, required this.sub, this.onTap, this.alert = false});
  final String label;
  final IconData icon;
  final int value;
  final String sub;
  final VoidCallback? onTap;
  final bool alert;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.panel,
      shape: RoundedRectangleBorder(
        borderRadius: _radius,
        side: BorderSide(color: alert ? AppStatus.warn : AppColors.panelLine),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: _radius,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: AppText.tabular(size: 11, weight: 500, color: AppColors.muted),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(color: AppColors.panel2, shape: BoxShape.circle),
                    child: Icon(icon, size: 15, color: alert ? AppStatus.warn : AppColors.accent),
                  ),
                  const SizedBox(width: 10),
                  Text('$value', style: AppText.tabular(size: 26, weight: 500)),
                ],
              ),
              Text(
                sub,
                style: AppText.tabular(size: 11, weight: 500, color: AppColors.muted),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

enum _Tone { ok, warn, bad, info, accent, line, off }

/// A pill badge (C-B): a soft tint behind a strong text, lime for the action, or outlined.
class _Badge extends StatelessWidget {
  const _Badge({required this.tone, required this.text});
  final _Tone tone;
  final String text;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (tone) {
      _Tone.ok => (AppStatus.okSoft, AppStatus.okText, null),
      _Tone.warn => (AppStatus.warnSoft, AppStatus.warnText, null),
      _Tone.bad => (AppStatus.badSoft, AppStatus.badText, null),
      _Tone.info => (AppStatus.infoSoft, AppStatus.info, null),
      _Tone.accent => (AppColors.accent, AppColors.onAccent, null),
      _ => (Colors.transparent, AppColors.muted, AppColors.panelLine),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: _pill,
        border: border == null ? null : Border.all(color: border),
      ),
      child: Text(text, style: AppText.tabular(size: 11, weight: 600, color: fg)),
    );
  }
}

/// A tinted status pill (Opérations): "OK", "À voir", "Off".
class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.tone, required this.text});
  final _Tone tone;
  final String text;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      _Tone.ok => (AppStatus.okSoft, AppStatus.okText),
      _Tone.warn => (AppStatus.warnSoft, AppStatus.warnText),
      _Tone.bad => (AppStatus.badSoft, AppStatus.badText),
      _ => (AppColors.panel2, AppColors.muted),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: _pill),
      child: Text(text, style: AppText.strong(size: 11, color: fg)),
    );
  }
}

/// The state of the services on one strip: icon, name, a tinted pill and a word.
class _Services extends StatelessWidget {
  const _Services({required this.s});
  final DashboardServicesModel s;

  @override
  Widget build(BuildContext context) {
    final sms = s.sms.mode == 'none'
        ? (_Tone.off, 'dashboard.sms_off'.tr())
        : s.sms.stale
        ? (_Tone.warn, 'dashboard.sms_stale'.tr())
        : s.sms.pending > 0
        ? (_Tone.warn, 'dashboard.sms_pending'.tr(args: ['${s.sms.pending}']))
        : (_Tone.ok, 'dashboard.sms_ok'.tr());
    final stripe = s.stripe.payoutsEnabled
        ? (_Tone.ok, 'dashboard.stripe_on'.tr())
        : s.stripe.connected
        ? (_Tone.warn, 'dashboard.stripe_pending'.tr())
        : (_Tone.off, 'dashboard.stripe_off'.tr());
    final items = [
      (
        Icons.flight_rounded,
        'dashboard.svc_flights'.tr(),
        s.flights.configured ? _Tone.ok : _Tone.off,
        s.flights.configured ? 'dashboard.flights_on'.tr(args: [s.flights.provider ?? '']) : 'dashboard.flights_off'.tr(),
      ),
      (Icons.sms_rounded, 'dashboard.svc_sms'.tr(), sms.$1, sms.$2),
      (
        Icons.notifications_rounded,
        'dashboard.svc_push'.tr(),
        s.push.configured ? _Tone.ok : _Tone.off,
        s.push.configured ? 'dashboard.push_on'.tr(args: ['${s.push.devices}']) : 'dashboard.push_off'.tr(),
      ),
      (Icons.credit_card_rounded, 'dashboard.svc_stripe'.tr(), stripe.$1, stripe.$2),
      (
        Icons.file_download_rounded,
        'dashboard.svc_import'.tr(),
        s.lastImportAt == null ? _Tone.off : _Tone.ok,
        s.lastImportAt == null ? 'dashboard.import_never'.tr() : 'dashboard.import_at'.tr(args: [hhmm(s.lastImportAt!)]),
      ),
    ];
    String word(_Tone t) => switch (t) {
      _Tone.ok => 'dashboard.svc_ok'.tr(),
      _Tone.warn => 'dashboard.svc_warn'.tr(),
      _ => 'dashboard.svc_off'.tr(),
    };
    return Container(
      key: const Key('dashboard-services'),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.panel,
        borderRadius: _radius,
        border: Border.all(color: AppColors.panelLine),
      ),
      child: Wrap(
        children: [
          for (final (icon, label, tone, detail) in items)
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 240),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, size: 14, color: AppColors.muted),
                    const SizedBox(width: 5),
                    Text(label, style: AppText.strong(size: 12)),
                    const SizedBox(width: 6),
                    _StatusPill(tone: tone, text: word(tone)),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(detail, style: AppText.muted(size: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
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

class _Panel extends StatelessWidget {
  const _Panel({required this.title, this.sub, this.trailing, required this.child});
  final String title;
  final String? sub;
  final Widget? trailing;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.panel,
        borderRadius: _radius,
        border: Border.all(color: AppColors.panelLine),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title.isNotEmpty) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Semantics(header: true, child: Text(title, style: AppText.tabular(size: 17, weight: 500))),
                      if (sub != null) Text(sub!, style: AppText.tabular(size: 11, weight: 500, color: AppColors.muted)),
                    ],
                  ),
                ),
                ?trailing,
              ],
            ),
            const SizedBox(height: 10),
          ],
          child,
        ],
      ),
    );
  }
}

/// A situation to treat ("Opérations"): what, who, since when, the severity as a badge; opens the booking.
class _AlertRow extends StatelessWidget {
  const _AlertRow({required this.alert, required this.first});
  final DashboardAlertModel alert;
  final bool first;

  @override
  Widget build(BuildContext context) {
    final tone = switch (alert.severity) {
      'urgent' => _Tone.bad,
      'watch' => _Tone.warn,
      _ => _Tone.line,
    };
    final who = [alert.customerName, alert.detail].whereType<String>().where((s) => s.isNotEmpty).join(' · ');
    final since = alert.minutes != null && alert.kind != 'flight_delayed' ? 'dashboard.since'.tr(args: ['${alert.minutes}']) : null;
    final id = alert.reservationId;
    return InkWell(
      key: Key('alert-${alert.kind}-${id ?? ''}'),
      onTap: id == null ? null : () => context.router.push(ProReservationRoute(id: id)),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          border: first ? null : const Border(top: BorderSide(color: AppColors.panelLine)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('dashboard.kind.${alert.kind}'.tr(), style: AppText.strong(size: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  if (who.isNotEmpty || since != null)
                    Text([if (who.isNotEmpty) who, ?since].join(' · '), style: AppText.muted(size: 12.5), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            if (alert.plate != null) ...[const SizedBox(width: 8), FrenchPlate(alert.plate!, size: 10)],
            const SizedBox(width: 8),
            _Badge(tone: tone, text: 'dashboard.severity.${alert.severity}'.tr()),
          ],
        ),
      ),
    );
  }
}

/// The badges of the "Flotte" list: the return of the day, the flight, the spot, the trip.
List<(_Tone, String)> _vehicleBadges(DashboardVehicleModel v) {
  final out = <(_Tone, String)>[];
  if (v.returnsToday) out.add((_Tone.info, 'dashboard.badge_return_today'.tr()));
  final scheduled = v.flightScheduledAt == null ? null : DateTime.tryParse(v.flightScheduledAt!);
  final estimated = v.flightEstimatedAt == null ? null : DateTime.tryParse(v.flightEstimatedAt!);
  final late = scheduled != null && estimated != null ? estimated.difference(scheduled).inMinutes : 0;
  if (v.flightStatus == 'landed') {
    out.add((_Tone.ok, 'dashboard.badge_landed'.tr()));
  } else if (v.flightStatus == 'cancelled' || v.flightStatus == 'diverted') {
    out.add((_Tone.bad, 'dashboard.badge_cancelled'.tr()));
  } else if (v.flightStatus == 'delayed' || late > 0) {
    out.add((_Tone.warn, late > 0 ? 'dashboard.badge_delayed'.tr(args: ['$late']) : 'dashboard.kind.flight_delayed'.tr()));
  }
  if (v.tripDirection != null) {
    out.add((_Tone.accent, 'dashboard.badge_on_trip'.tr()));
  } else if (v.status == 'return_requested') {
    out.add((_Tone.warn, 'dashboard.badge_waiting'.tr()));
  } else if (v.status == 'shuttled_out') {
    out.add((_Tone.line, 'dashboard.badge_shuttled'.tr()));
  }
  if (v.spotCode == null) {
    out.add((_Tone.bad, 'dashboard.badge_no_spot'.tr()));
  } else if (out.isEmpty) {
    out.add((_Tone.ok, 'dashboard.badge_on_site'.tr()));
  }
  return out;
}

/// A vehicle on the parking: plate, spot and zone, customer, meta pills (keys, flight, return), badges.
class _VehicleTile extends StatelessWidget {
  const _VehicleTile({required this.v});
  final DashboardVehicleModel v;

  @override
  Widget build(BuildContext context) {
    final returnAt = DateTime.tryParse(v.returnAt);
    final estimated = v.flightEstimatedAt == null ? null : DateTime.tryParse(v.flightEstimatedAt!);
    final stay = v.stayClass == null ? null : 'dashboard.stay_${v.stayClass}'.tr();
    final place = v.spotCode == null ? 'dashboard.no_spot'.tr() : [v.spotCode!, if (stay != null && !stay.startsWith('dashboard.')) stay].join(' · ');
    final meta = [
      (v.keyHook == null ? 'dashboard.no_keys'.tr() : 'dashboard.keys_hook'.tr(args: [v.keyHook!]), v.keyHook == null),
      if (v.returnFlight != null) ('dashboard.flight_at'.tr(args: [v.returnFlight!, hhmm(estimated ?? returnAt ?? DateTime.now())]), false),
      (
        v.returnsToday
            ? 'dashboard.return_today'.tr(args: [returnAt == null ? localTime(v.returnAt) : hhmm(returnAt)])
            : 'dashboard.return_later'.tr(args: [returnAt == null ? v.returnAt : planningDay(returnAt.toLocal())]),
        false,
      ),
    ];
    return Material(
      key: Key('vehicle-${v.id}'),
      color: AppColors.panel2,
      shape: const RoundedRectangleBorder(
        borderRadius: _radius,
        side: BorderSide(color: AppColors.panelLine),
      ),
      child: InkWell(
        borderRadius: _radius,
        onTap: () => context.router.push(ProReservationRoute(id: v.id)),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FrenchPlate(v.plate, size: 10),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(place, style: AppText.tabular(size: 11, weight: 500, color: v.spotCode == null ? AppStatus.badText : AppColors.muted)),
                        Text(
                          '${v.customerName} · ${'dashboard.pax'.tr(args: ['${v.passengers}'])}',
                          style: AppText.tabular(size: 14, weight: 500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 5,
                runSpacing: 5,
                children: [for (final (tone, text) in _vehicleBadges(v)) _Badge(tone: tone, text: text)],
              ),
              const SizedBox(height: 5),
              Wrap(
                spacing: 5,
                runSpacing: 5,
                children: [
                  for (final (text, warn) in meta)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        borderRadius: _pill,
                        border: Border.all(color: warn ? AppStatus.warn : AppColors.panelLine),
                      ),
                      child: Text(text, style: AppText.tabular(size: 10.5, weight: 500, color: warn ? AppStatus.warnText : AppColors.muted)),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
