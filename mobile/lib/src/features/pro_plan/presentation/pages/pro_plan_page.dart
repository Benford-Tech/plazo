import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/geo_rect.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../bloc/pro_plan_bloc.dart';
import '../widgets/plan_map.dart';

/// Lyon Saint-Exupéry, where the map opens before an address or a position is known.
const _defaultCenter = LatLng(45.7256, 5.0811);

/// A tap this close to a corner (metres) acts on it instead of adding one.
const _cornerReachM = 3.0;

/// Bloc 2, step "Plan" in the app (M-A + "Rectangle auto", 04/10/2026): where the parking is,
/// its corners on the aerial photo, then the layout and the generation on the server.
@RoutePage()
class ProPlanPage extends StatelessWidget implements AutoRouteWrapper {
  const ProPlanPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProPlanBloc>()..add(const ProPlanStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProPlanBloc, ProPlanState>(
      listenWhen: (a, b) => a.errorCode != b.errorCode || a.locationProblem != b.locationProblem,
      listener: (context, state) {
        final code = state.errorCode;
        final problem = state.locationProblem;
        if (code != null || problem != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(code != null ? translateErrorCode(code) : 'plan.location_${problem!.name}'.tr())));
          context.read<ProPlanBloc>().add(const ProPlanErrorDismissed());
        }
      },
      builder: (context, state) {
        final bloc = context.read<ProPlanBloc>();
        final title = switch (state.step) {
          PlanStep.locate => 'plan.title'.tr(),
          PlanStep.draw => 'plan.draw_title'.tr(),
          PlanStep.generate => 'plan.generate_title'.tr(),
        };
        return Scaffold(
          appBar: BrandAppBar(
            pro: true,
            title: title,
            leading: BackButton(
              onPressed: () {
                if (state.step == PlanStep.generate) return bloc.add(const ProPlanStepChanged(PlanStep.draw));
                if (state.step == PlanStep.draw) return bloc.add(const ProPlanStepChanged(PlanStep.locate));
                context.router.maybePop();
              },
            ),
          ),
          body: switch (state.viewState) {
            ViewState.error when state.parking == null => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center),
              ),
            ),
            _ when state.parking == null => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            _ => switch (state.step) {
              PlanStep.locate => _LocateStep(state: state),
              PlanStep.draw => _DrawStep(state: state),
              PlanStep.generate => _GenerateStep(state: state),
            },
          },
        );
      },
    );
  }
}

class _LocateStep extends StatefulWidget {
  const _LocateStep({required this.state});
  final ProPlanState state;

  @override
  State<_LocateStep> createState() => _LocateStepState();
}

class _LocateStepState extends State<_LocateStep> {
  final _query = TextEditingController();

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProPlanBloc>();
    final state = widget.state;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
      children: [
        Text('plan.where'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 8),
        TextField(
          key: const Key('plan-address'),
          controller: _query,
          textInputAction: TextInputAction.search,
          onSubmitted: (q) => bloc.add(ProPlanAddressSearched(q)),
          decoration: InputDecoration(
            hintText: 'plan.address_hint'.tr(),
            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.accent),
            suffixIcon: state.searching
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent)),
                  )
                : null,
          ),
        ),
        for (final r in state.results)
          ListTile(
            key: Key('plan-result-${r.lon}-${r.lat}'),
            dense: true,
            leading: const Icon(Icons.place_rounded, color: AppColors.accent),
            title: Text(r.label, style: AppText.body(size: 14)),
            onTap: () {
              _query.text = r.label;
              bloc.add(ProPlanResultChosen(r));
            },
          ),
        const SizedBox(height: 10),
        OutlineAction(
          key: const Key('plan-geolocate'),
          icon: Icons.my_location_rounded,
          label: 'plan.geolocate'.tr(),
          onPressed: () => bloc.add(const ProPlanGeolocateRequested()),
        ),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            height: 300,
            child: PlanMap(
              center: state.center ?? _defaultCenter,
              zoom: state.center == null ? 14 : 18,
              showCrosshair: true,
              onMoved: (c) => bloc.add(ProPlanMapMoved(c)),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text('plan.where_help'.tr(), style: AppText.muted()),
        const SizedBox(height: 14),
        GradientButton(
          key: const Key('plan-to-draw'),
          label: 'plan.to_draw'.tr(),
          onPressed: state.center == null ? null : () => bloc.add(const ProPlanStepChanged(PlanStep.draw)),
        ),
      ],
    );
  }
}

class _DrawStep extends StatelessWidget {
  const _DrawStep({required this.state});
  final ProPlanState state;

  int? _nearest(LatLng p) {
    int? best;
    var bestD = _cornerReachM;
    for (var i = 0; i < state.corners.length; i++) {
      final d = distanceM(state.corners[i], p);
      if (d <= bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProPlanBloc>();
    final n = state.corners.length;
    final area = state.areaM2;
    return Column(
      children: [
        Expanded(
          child: Stack(
            children: [
              PlanMap(
                center: state.center ?? _defaultCenter,
                corners: state.corners,
                onTap: (p) {
                  final hit = _nearest(p);
                  bloc.add(hit == null ? ProPlanCornerAdded(p) : ProPlanCornerRemoved(hit));
                },
                onLongPress: (p) {
                  // Move the nearest corner within 6 m to the pressed point.
                  int? best;
                  var bestD = _cornerReachM * 2;
                  for (var i = 0; i < state.corners.length; i++) {
                    final d = distanceM(state.corners[i], p);
                    if (d <= bestD) {
                      bestD = d;
                      best = i;
                    }
                  }
                  if (best != null) bloc.add(ProPlanCornerMoved(best, p));
                },
              ),
              Positioned(
                left: 10,
                top: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(color: AppColors.dark.withValues(alpha: 0.85), borderRadius: BorderRadius.circular(999)),
                  child: Text(
                    n >= 3 ? 'plan.corners_area'.tr(args: ['$n', area.round().toString()]) : 'plan.corners'.tr(args: ['$n']),
                    key: const Key('plan-chip'),
                    style: AppText.strong(size: 12.5, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('plan.draw_help'.tr(), style: AppText.muted(size: 12.5)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlineAction(
                      key: const Key('plan-undo'),
                      icon: Icons.undo_rounded,
                      label: 'plan.undo'.tr(),
                      onPressed: n == 0 ? null : () => bloc.add(const ProPlanLastCornerUndone()),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlineAction(
                      key: const Key('plan-rectangle'),
                      icon: Icons.crop_square_rounded,
                      label: 'plan.rectangle'.tr(),
                      onPressed: n < 2 ? null : () => bloc.add(const ProPlanRectangleRequested()),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              GradientButton(
                key: const Key('plan-validate'),
                label: 'plan.validate'.tr(),
                busy: state.actionState.isProcessing,
                onPressed: state.canValidate && !state.actionState.isProcessing ? () => bloc.add(const ProPlanOutlineValidated()) : null,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _GenerateStep extends StatelessWidget {
  const _GenerateStep({required this.state});
  final ProPlanState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProPlanBloc>();
    final estimate = state.estimate;
    final chosen = state.countFor(state.layout);
    final declared = state.parking!.totalCapacity;
    final spots = state.spots;
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        SizedBox(
          height: 300,
          child: Stack(
            children: [
              PlanMap(center: state.center ?? _defaultCenter, corners: state.corners, spots: spots),
              Positioned(
                left: 10,
                top: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(color: AppColors.dark.withValues(alpha: 0.85), borderRadius: BorderRadius.circular(999)),
                  child: Text(
                    spots.isEmpty
                        ? 'plan.no_spots_yet'.tr()
                        : 'plan.spots_chip'.tr(args: ['${spots.length}', 'plan.layouts.${state.view!.plan.layout ?? state.layout}'.tr()]),
                    key: const Key('plan-spots-chip'),
                    style: AppText.strong(size: 12.5, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('plan.layout'.tr().toUpperCase(), style: AppText.label(size: 11)),
              const SizedBox(height: 8),
              for (final key in planLayouts)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    key: Key('plan-layout-$key'),
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => bloc.add(ProPlanLayoutChosen(key)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: state.layout == key ? AppColors.accent : AppColors.line, width: state.layout == key ? 1.6 : 1),
                        color: state.layout == key ? AppColors.tintSoft : null,
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              'plan.layouts.$key'.tr(),
                              style: AppText.body(size: 14, weight: 600, color: state.layout == key ? AppColors.accent : AppColors.ink),
                            ),
                          ),
                          Text(
                            estimate == null ? '…' : 'plan.places'.tr(args: ['${estimate.totals[key] ?? 0}']),
                            style: AppText.tabular(size: 14, color: state.layout == key ? AppColors.accent : AppColors.ink),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              Row(
                children: [
                  Expanded(child: Text('plan.declared'.tr(), style: AppText.body(size: 13.5))),
                  Text(
                    chosen == null || chosen == declared ? '$declared' : '$declared → $chosen',
                    key: const Key('plan-capacity'),
                    style: AppText.tabular(size: 14, color: AppColors.accent),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (state.generated)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.tint, borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: AppColors.accent),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'plan.applied'.tr(args: ['${state.view!.totalCapacity}']),
                          key: const Key('plan-applied'),
                          style: AppText.strong(size: 14),
                        ),
                      ),
                    ],
                  ),
                )
              else
                GradientButton(
                  key: const Key('plan-generate'),
                  label: spots.isEmpty ? 'plan.generate'.tr() : 'plan.regenerate'.tr(),
                  busy: state.actionState.isProcessing,
                  onPressed: estimate == null || state.actionState.isProcessing ? null : () => bloc.add(const ProPlanGenerateRequested()),
                ),
              const SizedBox(height: 10),
              Text('plan.generate_help'.tr(), style: AppText.muted(size: 12.5)),
              const SizedBox(height: 8),
              OutlineAction(
                key: const Key('plan-edit-outline'),
                icon: Icons.edit_location_alt_rounded,
                label: 'plan.edit_outline'.tr(),
                onPressed: () => bloc.add(const ProPlanStepChanged(PlanStep.draw)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
