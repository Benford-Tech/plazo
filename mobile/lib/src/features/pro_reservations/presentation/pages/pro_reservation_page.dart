import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../data/models/reservation_models.dart';
import '../bloc/pro_reservation_bloc.dart';
import '../widgets/reservation_tile.dart';

/// One booking: the sheet, the contact, the stay, the vehicle's spot, and the status buttons.
@RoutePage()
class ProReservationPage extends StatelessWidget implements AutoRouteWrapper {
  const ProReservationPage({super.key, @PathParam('id') required this.id});

  final String id;

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProReservationBloc>()..add(ProReservationStarted(id)), child: this);

  @override
  Widget build(BuildContext context) {
    final role = context.watch<ProAuthBloc>().state.staff?.role;
    return BlocConsumer<ProReservationBloc, ProReservationState>(
      listenWhen: (a, b) => a.errorCode != b.errorCode || a.notice != b.notice,
      listener: (context, state) {
        final text = state.errorCode != null
            ? translateErrorCode(state.errorCode)
            : state.notice != null
            ? 'res.status_done'.tr(args: ['pro.status.${state.notice}'.tr()])
            : null;
        if (text != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
          context.read<ProReservationBloc>().add(const ProReservationErrorDismissed());
        }
      },
      builder: (context, state) {
        final r = state.reservation;
        // Leaving hands the (possibly updated) reservation back to the list or the planning. The pop
        // must be forced: a `maybePop` would ask this PopScope again, which would call it again, forever.
        void leave() {
          if (context.router.canPop()) {
            context.router.pop(r);
          } else {
            context.router.replaceAll([const ProShellRoute(children: [ProReservationsRoute()])]);
          }
        }

        return PopScope<ReservationModel?>(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) leave();
          },
          child: Scaffold(
            appBar: BrandAppBar(
              pro: true,
              title: r?.reference ?? 'res.one'.tr(),
              leading: BackButton(key: const Key('res-back'), onPressed: leave),
              actions: [
                if (r != null && !r.closed && can(role, 'reservations:manage'))
                  IconButton(
                    key: const Key('res-edit'),
                    tooltip: 'res.edit'.tr(),
                    icon: const Icon(Icons.edit_outlined),
                    onPressed: () async {
                      final bloc = context.read<ProReservationBloc>();
                      final saved = await context.router.push<ReservationModel?>(ProReservationFormRoute(id: r.id, initial: _inputOf(r)));
                      if (saved != null) bloc.add(ProReservationReplaced(saved));
                    },
                  ),
              ],
            ),
            body: r == null
                ? Center(
                    child: state.viewState.isError
                        ? Padding(
                            padding: const EdgeInsets.all(24),
                            child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center),
                          )
                        : const CircularProgressIndicator(color: AppColors.accent),
                  )
                : _Sheet(reservation: r, role: role, busy: state.actionState.isProcessing),
          ),
        );
      },
    );
  }

  static ReservationInput _inputOf(ReservationModel r) => ReservationInput(
    channel: r.channel,
    channelDetail: r.channelDetail,
    arrivalAt: DateFormat("yyyy-MM-dd'T'HH:mm").format(r.arrivalAt.toLocal()),
    returnAt: DateFormat("yyyy-MM-dd'T'HH:mm").format(r.returnAt.toLocal()),
    passengers: r.passengers,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    customerEmail: r.customerEmail,
    plate: r.plate,
    returnFlight: r.returnFlight,
    departureFlight: r.departureFlight,
    notes: r.notes,
  );
}

class _Sheet extends StatelessWidget {
  const _Sheet({required this.reservation, required this.role, required this.busy});
  final ReservationModel reservation;
  final String? role;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final r = reservation;
    final links = locator<LinkService>();
    // The API says what comes next (06/10/2026); the local table only serves an older server.
    final next = r.nextStatuses.isNotEmpty || r.paymentStatus == 'refunded'
        ? r.nextStatuses
        : (statusTransitions[r.status] ?? const []).where((s) {
            final decision = s == 'cancelled' || s == 'no_show' || r.status == 'cancelled' || r.status == 'no_show';
            return can(role, decision ? 'reservations:manage' : 'reservations:status');
          }).toList();
    final channel = 'res.channel.${r.channel}'.tr(args: [Product.name]);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
      children: [
        Row(
          children: [
            FrenchPlate(r.plate, size: 15),
            const SizedBox(width: 10),
            Expanded(child: Text(r.customerName, style: AppText.strong(size: 17))),
            proStatusBadge(r.status, key: const Key('res-status')),
          ],
        ),
        if (r.overbooked) ...[const SizedBox(height: 6), Text('res.overbooked'.tr(), style: AppText.body(size: 13, color: AppColors.danger))],
        const SizedBox(height: 16),
        _Section(
          title: 'res.stay'.tr(),
          rows: [
            ('res.arrival'.tr(), dayTime(r.arrivalAt)),
            ('res.return'.tr(), dayTime(r.returnAt)),
            if (r.departureFlight != null)
              (
                'res.departure_flight'.tr(),
                [
                  r.departureFlight!,
                  if (r.departureStatus != null) 'res.departure_status.${r.departureStatus}'.tr(),
                  if ((r.departureEstimatedAt ?? r.departureScheduledAt) != null)
                    'res.take_off'.tr(args: [hhmm((r.departureEstimatedAt ?? r.departureScheduledAt)!)]),
                ].join(' · '),
              ),
            if (r.returnFlight != null) ('res.return_flight'.tr(), r.returnFlight!),
            ('res.passengers'.tr(), '${r.passengers}'),
            ('res.channel_label'.tr(), r.channelDetail != null ? '$channel · ${r.channelDetail}' : channel),
            if (r.externalReference != null) ('res.external_reference'.tr(), r.externalReference!),
            if (r.priceCents != null) ('res.price'.tr(), '${(r.priceCents! / 100).toStringAsFixed(2).replaceAll('.', ',')} €'),
          ],
        ),
        _Section(
          title: 'res.contact'.tr(),
          rows: [('res.phone'.tr(), formatPhone(r.customerPhone)), if (r.customerEmail != null) ('res.email'.tr(), r.customerEmail!)],
          trailing: Row(
            children: [
              IconButton(
                key: const Key('res-call'),
                tooltip: 'res.call'.tr(),
                icon: const Icon(Icons.call_rounded, color: AppColors.accent),
                onPressed: () => links.open(Uri(scheme: 'tel', path: r.customerPhone.replaceAll(RegExp(r'[\s.()-]'), ''))),
              ),
              IconButton(
                key: const Key('res-sms'),
                tooltip: 'res.sms'.tr(),
                icon: const Icon(Icons.sms_outlined, color: AppColors.accent),
                onPressed: () => links.open(Uri(scheme: 'sms', path: r.customerPhone.replaceAll(RegExp(r'[\s.()-]'), ''))),
              ),
            ],
          ),
        ),
        _Section(
          title: 'res.vehicle'.tr(),
          rows: [
            ('res.spot'.tr(), r.spot?.code ?? (r.spotId == null ? 'occupation.no_spot'.tr() : 'res.spot_placed'.tr())),
            if (r.keyHook != null) ('occupation.key_hook'.tr(), r.keyHook!),
            if (r.carLat != null && r.carLng != null && r.carLocatedAt != null)
              (
                'occupation.car_position'.tr(),
                '${(r.carLocatedBy == 'staff' ? 'occupation.car_by_staff' : 'occupation.car_by_traveller').tr(args: [hhmm(r.carLocatedAt!)])}'
                    '${r.carAccuracyM != null ? ' · ± ${r.carAccuracyM} m' : ''}${r.carNote != null ? ' · ${r.carNote}' : ''}',
              ),
          ],
          trailing: TextButton(
            key: const Key('res-places'),
            onPressed: () => context.router.push(ProOccupationRoute(focus: r.id)),
            child: Text('occupation.title'.tr(), style: AppText.strong(size: 14, color: AppColors.accentDeep)),
          ),
        ),
        if (r.notes != null && r.notes!.trim().isNotEmpty) _Section(title: 'res.notes'.tr(), text: r.notes),
        // C-B (06/10/2026): one gesture, the journey's next step; every other status change waits in a menu.
        if (next.isNotEmpty || r.closed) ...[
          const SizedBox(height: 8),
          Text('res.next_step'.tr().toUpperCase(), style: AppText.label(size: 11)),
          const SizedBox(height: 8),
          _NextStep(reservation: r, next: next, busy: busy),
          const SizedBox(height: 8),
        ],
      ],
    );
  }
}

/// The journey's next gesture for this booking, as one button (C-B), and the other statuses behind "Autres actions".
class _NextStep extends StatelessWidget {
  const _NextStep({required this.reservation, required this.next, required this.busy});
  final ReservationModel reservation;
  final List<String> next;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final r = reservation;
    final bloc = context.read<ProReservationBloc>();
    final (String key, String label, String help, IconData icon, Future<void> Function() go)? step = switch (r.status) {
      'upcoming' when next.contains('arrived') => (
        'place',
        'res.next.place'.tr(),
        'res.next.place_help'.tr(),
        Icons.local_parking_rounded,
        () => context.router.push(ProOccupationRoute(focus: r.id)),
      ),
      'arrived' when next.contains('shuttled_out') => (
        'drop_off',
        'res.next.drop_off'.tr(),
        'res.next.drop_off_help'.tr(),
        Icons.flight_takeoff_rounded,
        () => context.router.push(ProShuttleRoute(direction: 'dropoff', reservationId: r.id)),
      ),
      'shuttled_out' || 'return_requested' when next.contains('back_at_parking') => (
        'pick_up',
        'res.next.pick_up'.tr(),
        'res.next.pick_up_help'.tr(),
        Icons.flight_land_rounded,
        () => context.router.push(ProShuttleRoute(direction: 'pickup', reservationId: r.id)),
      ),
      'back_at_parking' when next.contains('returned') => (
        'hand_over',
        'res.next.hand_over'.tr(),
        'res.next.hand_over_help'.tr(),
        Icons.key_rounded,
        () => _handOver(context, bloc),
      ),
      _ => null,
    };
    // The statuses the menu offers: everything the API allows, the primary gesture's target included
    // (a manual fallback), but "returned" always goes through the handover sheet.
    final others = next;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (step != null) ...[
          GradientButton(key: Key('next-${step.$1}'), icon: step.$4, label: step.$2, busy: busy, onPressed: busy ? null : () => step.$5()),
          const SizedBox(height: 6),
          Text(step.$3, style: AppText.muted(size: 12.5), textAlign: TextAlign.center),
        ] else if (r.closed)
          Text('res.next.none_closed'.tr(), style: AppText.muted(size: 13), textAlign: TextAlign.center),
        if (others.isNotEmpty) ...[
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.center,
            child: PopupMenuButton<String>(
              key: const Key('more-actions'),
              enabled: !busy,
              onSelected: (s) {
                if (s == 'returned') {
                  _handOver(context, bloc);
                } else if (s == 'cancelled' || s == 'no_show') {
                  _confirm(context, s, () => bloc.add(ProReservationStatusChanged(s)));
                } else {
                  bloc.add(ProReservationStatusChanged(s));
                }
              },
              itemBuilder: (_) => [
                for (final s in others)
                  PopupMenuItem(
                    key: Key('status-$s'),
                    value: s,
                    child: Text('res.action.$s'.tr(), style: AppText.body(size: 14, color: s == 'cancelled' || s == 'no_show' ? AppColors.danger : AppColors.ink)),
                  ),
              ],
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('res.more_actions'.tr(), style: AppText.strong(size: 14, color: AppColors.accentDeep)),
                    const Icon(Icons.expand_more_rounded, size: 20, color: AppColors.accentDeep),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  /// The handover checklist: keys given back (required), a remark kept with the booking (optional).
  Future<void> _handOver(BuildContext context, ProReservationBloc bloc) async {
    final result = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _HandoverSheet(reservation: reservation),
    );
    if (result == null) return;
    bloc.add(ProReservationStatusChanged('returned', note: result.isEmpty ? null : result));
  }

  Future<void> _confirm(BuildContext context, String status, VoidCallback go) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('res.action.$status'.tr()),
        content: Text('res.confirm_${status == 'cancelled' ? 'cancel' : 'no_show'}'.tr()),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text('common.back'.tr())),
          TextButton(onPressed: () => Navigator.of(ctx).pop(true), child: Text('common.confirm'.tr())),
        ],
      ),
    );
    if (ok == true) go();
  }
}

/// "Rendre le véhicule": the keys switch and the remark; pops the remark ("" when none) on confirm.
class _HandoverSheet extends StatefulWidget {
  const _HandoverSheet({required this.reservation});
  final ReservationModel reservation;

  @override
  State<_HandoverSheet> createState() => _HandoverSheetState();
}

class _HandoverSheetState extends State<_HandoverSheet> {
  bool _keys = false;
  bool _tried = false;
  final _note = TextEditingController();

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.reservation;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 4, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('res.handover.title'.tr(), style: AppText.title(size: 20)),
          const SizedBox(height: 4),
          Text('${r.customerName} · ${r.plate}${r.spot != null ? ' · ${'res.spot'.tr()} ${r.spot!.code}' : ''}${r.keyHook != null ? ' · ${'occupation.key_hook'.tr()} ${r.keyHook}' : ''}', style: AppText.muted()),
          const SizedBox(height: 10),
          SwitchListTile(
            key: const Key('handover-keys'),
            contentPadding: EdgeInsets.zero,
            value: _keys,
            title: Text('res.handover.keys'.tr(), style: AppText.strong()),
            subtitle: Text(_tried && !_keys ? 'res.handover.keys_required'.tr() : 'res.handover.keys_help'.tr(), style: _tried && !_keys ? AppText.body(size: 13.5, color: AppColors.danger) : AppText.muted()),
            activeColor: AppColors.accent,
            onChanged: (v) => setState(() => _keys = v),
          ),
          TextField(
            key: const Key('handover-note'),
            controller: _note,
            maxLines: 3,
            minLines: 1,
            maxLength: 500,
            decoration: InputDecoration(labelText: 'res.handover.note'.tr(), helperText: 'res.handover.note_hint'.tr()),
          ),
          const SizedBox(height: 10),
          GradientButton(
            key: const Key('handover-confirm'),
            icon: Icons.check_rounded,
            label: 'res.handover.confirm'.tr(),
            onPressed: () {
              if (!_keys) return setState(() => _tried = true);
              Navigator.of(context).pop(_note.text.trim());
            },
          ),
        ],
      ),
    );
  }

}

class _Section extends StatelessWidget {
  const _Section({required this.title, this.rows = const [], this.text, this.trailing});
  final String title;
  final List<(String, String)> rows;
  final String? text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.line),
        borderRadius: AppRadius.chip,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(title.toUpperCase(), style: AppText.label(size: 11))),
              ?trailing,
            ],
          ),
          const SizedBox(height: 6),
          if (text != null) Text(text!, style: AppText.body(size: 14)),
          for (final (label, value) in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(width: 110, child: Text(label, style: AppText.muted(size: 13))),
                  Expanded(child: Text(value, style: AppText.body(size: 14, weight: 600))),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
