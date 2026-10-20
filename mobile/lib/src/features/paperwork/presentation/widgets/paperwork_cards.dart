import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../data/datasources/paperwork_data_source.dart';
import '../bloc/paperwork_bloc.dart';
import 'paperwork_widgets.dart';

const _dropoffStatuses = ['upcoming', 'arrived'];
const _returnStatuses = ['arrived', 'shuttled_out', 'return_requested', 'back_at_parking', 'returned'];

/// Plazo Pro, on a booking's sheet: « Contrat et état des lieux » with one row each for the contract, the drop-off and
/// the return report, and the gesture each one waits for.
class PaperworkCard extends StatelessWidget {
  const PaperworkCard({super.key, required this.reservationId, required this.status, required this.canAct});
  final String reservationId;
  final String status;

  /// The staff member may take reports and have the contract signed (`reservations:status`).
  final bool canAct;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => locator<PaperworkBloc>()..add(PaperworkStarted(StaffOwner(reservationId))),
      child: BlocBuilder<PaperworkBloc, PaperworkState>(
        builder: (context, state) {
          final data = state.data;
          if (data == null) return const SizedBox.shrink();
          final bloc = context.read<PaperworkBloc>();
          Future<void> open(PageRouteInfo route) async {
            await context.router.push(route);
            bloc.add(const PaperworkRefreshed());
          }

          final contract = data.contract;
          final rows = <Widget>[
            _Row(
              key: const Key('paperwork-contract'),
              icon: Icons.description_outlined,
              title: 'paperwork.contract'.tr(),
              value: contract.isSigned
                  ? 'paperwork.contract_signed_short'.tr(args: [DateFormat('d MMM HH:mm', 'fr').format(contract.signed!.signedAt.toLocal())])
                  : contract.canSign
                  ? 'paperwork.contract_to_sign'.tr()
                  : 'paperwork.contract_unsigned'.tr(),
              color: contract.isSigned ? AppStatus.ok : AppStatus.warn,
              action: contract.isSigned ? 'paperwork.see'.tr() : (contract.canSign && canAct ? 'paperwork.have_contract_signed'.tr() : null),
              onTap: () => open(ProContractRoute(id: reservationId)),
            ),
          ];
          for (final kind in ['dropoff', 'return']) {
            final report = data.report(kind);
            final allowed = (kind == 'dropoff' ? _dropoffStatuses : _returnStatuses).contains(status);
            if (report == null && !allowed) continue;
            rows.add(
              _Row(
                key: Key('paperwork-$kind'),
                icon: kind == 'dropoff' ? Icons.login_rounded : Icons.logout_rounded,
                title: 'paperwork.report_short.$kind'.tr(),
                value: report == null ? 'paperwork.to_do'.tr() : decisionLabel(report),
                color: report == null ? AppColors.muted : decisionColor(report),
                action: report == null
                    ? (canAct ? 'paperwork.start'.tr() : null)
                    : report.editable
                    ? (canAct ? 'paperwork.resume'.tr() : 'paperwork.see'.tr())
                    : 'paperwork.see'.tr(),
                onTap: report == null && !canAct ? null : () => open(ProInspectionRoute(id: reservationId, kind: kind)),
              ),
            );
          }
          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('paperwork.card_title'.tr().toUpperCase(), style: AppText.label(size: 11)),
                const SizedBox(height: 6),
                AppCard(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  child: Column(children: rows),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({super.key, required this.icon, required this.title, required this.value, required this.color, this.action, this.onTap});
  final IconData icon;
  final String title;
  final String value;
  final Color color;
  final String? action;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: action == null ? null : onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 52),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.accent),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: AppText.strong(size: 14)),
                  Text(value, style: AppText.body(size: 12.5, weight: 600, color: color)),
                ],
              ),
            ),
            if (action != null) Text(action!, style: AppText.strong(size: 13.5, color: AppColors.accentDeep)),
          ],
        ),
      ),
    );
  }
}

/// Plazo (traveller), on « Ma réservation »: the contract to read (signed at the counter), their own photos of the car,
/// and the parking's reports to check once made.
class TravellerPaperworkBlock extends StatelessWidget {
  const TravellerPaperworkBlock({super.key, required this.reference});
  final String reference;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => locator<PaperworkBloc>()..add(PaperworkStarted(TravellerOwner(reference))),
      child: BlocBuilder<PaperworkBloc, PaperworkState>(
        builder: (context, state) {
          final data = state.data;
          if (data == null) return const SizedBox.shrink();
          final bloc = context.read<PaperworkBloc>();
          Future<void> open(PageRouteInfo route) async {
            await context.router.push(route);
            bloc.add(const PaperworkRefreshed());
          }

          final contract = data.contract;
          final cards = <Widget>[];
          if (contract.isSigned || contract.atCounter) {
            cards.add(
              _TravellerCard(
                key: const Key('my-contract'),
                icon: Icons.description_outlined,
                title: 'paperwork.contract'.tr(),
                text: contract.isSigned
                    ? 'paperwork.contract_signed_short'.tr(args: [DateFormat("d MMM 'à' HH:mm", 'fr').format(contract.signed!.signedAt.toLocal())])
                    : 'paperwork.contract_at_counter_short'.tr(),
                highlight: false,
                onTap: () => open(TravellerContractRoute(reference: reference)),
              ),
            );
          }
          for (final kind in ['dropoff', 'return']) {
            final mine = data.ownReport(kind);
            if (data.photosAvailable && (data.canPhotograph(kind) || (mine?.completed ?? false))) {
              cards.add(
                _TravellerCard(
                  key: Key('my-photos-$kind'),
                  icon: Icons.photo_camera_outlined,
                  title: 'paperwork.my_photos_card.$kind'.tr(),
                  text: mine?.completed ?? false
                      ? 'paperwork.my_photos_sent'.tr(args: ['${mine!.photos.length}'])
                      : mine != null && mine.photos.isNotEmpty
                      ? 'paperwork.my_photos_draft'.tr(args: ['${mine.photos.length}'])
                      : 'paperwork.my_photos_invite.$kind'.tr(),
                  highlight: !(mine?.completed ?? false),
                  onTap: () => open(TravellerPhotosRoute(reference: reference, kind: kind)),
                ),
              );
            }
          }
          for (final kind in ['dropoff', 'return']) {
            final r = data.report(kind);
            if (r == null || !r.completed) continue;
            cards.add(
              _TravellerCard(
                key: Key('my-report-$kind'),
                icon: Icons.photo_library_outlined,
                title: 'paperwork.report_short.$kind'.tr(),
                text: r.canAnswer ? 'paperwork.traveller_check'.tr() : decisionLabel(r),
                highlight: r.canAnswer,
                onTap: () => open(TravellerInspectionRoute(reference: reference, kind: kind)),
              ),
            );
          }
          if (cards.isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final c in cards) ...[c, const SizedBox(height: 8)],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _TravellerCard extends StatelessWidget {
  const _TravellerCard({super.key, required this.icon, required this.title, required this.text, required this.highlight, required this.onTap});
  final IconData icon;
  final String title;
  final String text;
  final bool highlight;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      child: InkWell(
        borderRadius: AppRadius.card,
        onTap: onTap,
        child: AppCard(
          borderColor: highlight ? AppColors.accent : null,
          borderWidth: highlight ? 1.5 : 1,
          child: Row(
            children: [
              Icon(icon, color: AppColors.accent),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppText.strong(size: 15)),
                    const SizedBox(height: 2),
                    Text(text, style: AppText.body(size: 13.5, color: highlight ? AppColors.accentDeep : AppColors.muted)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
            ],
          ),
        ),
      ),
    );
  }
}

/// The booking statuses where the traveller has paperwork to see.
bool travellerPaperworkRelevant(String status) =>
    const ['upcoming', 'arrived', 'shuttled_out', 'return_requested', 'back_at_parking', 'returned'].contains(status);
