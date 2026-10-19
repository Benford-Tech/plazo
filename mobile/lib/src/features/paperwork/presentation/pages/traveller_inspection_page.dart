import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/datasources/paperwork_data_source.dart';
import '../bloc/paperwork_bloc.dart';
import '../widgets/paperwork_widgets.dart';

/// Plazo (maquette 3): the traveller checks the report the parking made of their car and answers « C'est conforme » or
/// tells what was missed. A drop-off report left unanswered stands once they leave in the shuttle.
@RoutePage()
class TravellerInspectionPage extends StatelessWidget implements AutoRouteWrapper {
  const TravellerInspectionPage({super.key, @PathParam('reference') required this.reference, @PathParam('kind') required this.kind});
  final String reference;
  final String kind;

  @override
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<PaperworkBloc>()..add(PaperworkStarted(TravellerOwner(reference))), child: this);

  @override
  Widget build(BuildContext context) {
    final owner = TravellerOwner(reference);
    return Scaffold(
      appBar: AppBar(
        title: Text('paperwork.report_title.$kind'.tr(), style: AppText.strong(size: 16, color: AppColors.brownOrInk)),
      ),
      body: SafeArea(
        top: false,
        child: BlocConsumer<PaperworkBloc, PaperworkState>(
          listenWhen: (a, b) => (a.errorMessage != b.errorMessage && b.errorMessage != null && b.data != null) || (a.notice != b.notice && b.notice != null),
          listener: (context, state) {
            final text = state.notice != null ? 'paperwork.notice.${state.notice}'.tr() : state.errorMessage;
            if (text != null) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
            context.read<PaperworkBloc>().add(const PaperworkErrorDismissed());
          },
          builder: (context, state) {
            final r = state.data?.report(kind);
            if (r == null) {
              return Center(
                child: state.viewState.isError || state.data != null
                    ? Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(state.errorMessage ?? 'paperwork.not_ready'.tr(), textAlign: TextAlign.center),
                      )
                    : const CircularProgressIndicator(color: AppColors.accent),
              );
            }
            final at = DateFormat("d MMM 'à' HH:mm", 'fr').format(r.completedAt!.toLocal());
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              children: [
                Text('paperwork.traveller_kicker.$kind'.tr(args: [at]).toUpperCase(), style: AppText.label(size: 11)),
                const SizedBox(height: 6),
                Semantics(header: true, child: Text('paperwork.traveller_title.$kind'.tr(), style: AppText.title(size: 26))),
                const SizedBox(height: 8),
                Text(
                  'paperwork.traveller_intro'.tr(args: [r.performedBy ?? 'paperwork.the_parking'.tr(), '${r.photos.length}', '${r.damages.length}']),
                  style: AppText.body(size: 14, height: 1.45),
                ),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 6,
                  crossAxisSpacing: 6,
                  children: [
                    for (final p in r.photos)
                      Semantics(
                        button: true,
                        label: slotLabel(p.slot),
                        child: GestureDetector(
                          onTap: () => showPhoto(context, owner, kind, p.id, slotLabel(p.slot)),
                          child: ClipRRect(
                            borderRadius: AppRadius.chip,
                            child: InspectionPhotoView(owner: owner, kind: kind, photoId: p.id),
                          ),
                        ),
                      ),
                  ],
                ),
                if (r.photosErased)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text('paperwork.photos_erased'.tr(), style: AppText.muted(size: 12.5)),
                  ),
                const SizedBox(height: 12),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (r.damages.isNotEmpty) CarOutline(damages: r.damages, height: 180),
                      if (r.damages.isEmpty) Text('paperwork.no_damage'.tr(), style: AppText.body(size: 14)),
                      for (final d in r.damages)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 11,
                                backgroundColor: AppStatus.badSoft,
                                child: Text('${d.n}', style: AppText.body(size: 11, weight: 800, color: AppStatus.badText)),
                              ),
                              const SizedBox(width: 10),
                              Expanded(child: Text(d.label, style: AppText.body(size: 14))),
                            ],
                          ),
                        ),
                      const Divider(height: 20),
                      Row(
                        children: [
                          Expanded(child: Text('paperwork.mileage'.tr(), style: AppText.muted(size: 13))),
                          Text('${r.mileageKm ?? '—'} km', style: AppText.tabular(size: 14, weight: 600)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Expanded(child: Text('paperwork.fuel'.tr(), style: AppText.muted(size: 13))),
                          Text(fuelLabel(r.fuelQuarters), style: AppText.body(size: 14, weight: 600)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (r.canAnswer) ...[
                  GradientButton(
                    key: const Key('traveller-accept'),
                    label: 'paperwork.traveller_accept'.tr(),
                    busy: state.busy,
                    onPressed: state.busy ? null : () => context.read<PaperworkBloc>().add(PaperworkAnswered(kind, decision: 'accepted')),
                  ),
                  const SizedBox(height: 8),
                  OutlineAction(key: const Key('traveller-reserve'), label: 'paperwork.traveller_reserve.$kind'.tr(), onPressed: () => _reserve(context)),
                  if (kind == 'dropoff') ...[
                    const SizedBox(height: 8),
                    Text('paperwork.traveller_default'.tr(), style: AppText.muted(size: 12.5), textAlign: TextAlign.center),
                  ],
                ] else
                  AppCard(
                    key: const Key('traveller-decision'),
                    color: decisionColor(r).withValues(alpha: 0.1),
                    child: Text(
                      r.reserveText != null ? '${decisionLabel(r)}\n« ${r.reserveText} »' : decisionLabel(r),
                      style: AppText.body(size: 14, weight: 600),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _reserve(BuildContext context) async {
    final bloc = context.read<PaperworkBloc>();
    final text = await showDialog<String>(
      context: context,
      builder: (_) => _ReserveDialog(kind: kind),
    );
    if (text == null || text.trim().isEmpty) return;
    bloc.add(PaperworkAnswered(kind, decision: 'reserved', reserveText: text.trim()));
  }
}

class _ReserveDialog extends StatefulWidget {
  const _ReserveDialog({required this.kind});
  final String kind;

  @override
  State<_ReserveDialog> createState() => _ReserveDialogState();
}

class _ReserveDialogState extends State<_ReserveDialog> {
  final _text = TextEditingController();

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text('paperwork.traveller_reserve.${widget.kind}'.tr()),
    content: TextField(
      key: const Key('traveller-reserve-text'),
      controller: _text,
      autofocus: true,
      maxLength: 1000,
      minLines: 3,
      maxLines: 6,
      decoration: InputDecoration(hintText: 'paperwork.traveller_reserve_hint.${widget.kind}'.tr()),
      onChanged: (_) => setState(() {}),
    ),
    actions: [
      TextButton(onPressed: () => Navigator.of(context).pop(), child: Text('paperwork.cancel'.tr())),
      FilledButton(
        key: const Key('traveller-reserve-send'),
        onPressed: _text.text.trim().isEmpty ? null : () => Navigator.of(context).pop(_text.text),
        child: Text('paperwork.send'.tr()),
      ),
    ],
  );
}
