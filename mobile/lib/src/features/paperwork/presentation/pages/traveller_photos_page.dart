import 'dart:typed_data';

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
import '../../data/models/paperwork_models.dart';
import '../../domain/usecases/paperwork_use_cases.dart';
import '../bloc/paperwork_bloc.dart';
import '../widgets/paperwork_widgets.dart';

/// Plazo (maquette 5, 20/10/2026, « les deux peuvent faire l'état des lieux »): the traveller photographs their car
/// themselves before handing the keys over, and at the return; a note, then « Envoyer mes photos au parking ». Optional:
/// the photos join the parking's report, which the parking still takes.
@RoutePage()
class TravellerPhotosPage extends StatelessWidget implements AutoRouteWrapper {
  const TravellerPhotosPage({super.key, @PathParam('reference') required this.reference, @PathParam('kind') required this.kind});
  final String reference;

  /// dropoff | return
  final String kind;

  @override
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<PaperworkBloc>()..add(PaperworkStarted(TravellerOwner(reference))), child: this);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('paperwork.my_photos_card.$kind'.tr(), style: AppText.strong(size: 16, color: AppColors.brownOrInk)),
      ),
      body: SafeArea(
        top: false,
        child: BlocConsumer<PaperworkBloc, PaperworkState>(
          listenWhen: (a, b) => (a.errorMessage != b.errorMessage && b.errorMessage != null && b.data != null) || (a.notice != b.notice && b.notice != null),
          listener: (context, state) {
            final text = state.notice == 'completed' ? 'paperwork.notice.photos_sent'.tr() : state.errorMessage;
            if (text != null) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
            context.read<PaperworkBloc>().add(const PaperworkErrorDismissed());
          },
          builder: (context, state) {
            final data = state.data;
            if (data == null) {
              return Center(
                child: state.viewState.isError
                    ? Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(state.errorMessage ?? 'errors.generic'.tr(), textAlign: TextAlign.center),
                      )
                    : const CircularProgressIndicator(color: AppColors.accent),
              );
            }
            return _Body(reference: reference, kind: kind, paperwork: data, state: state);
          },
        ),
      ),
    );
  }
}

class _Body extends StatefulWidget {
  const _Body({required this.reference, required this.kind, required this.paperwork, required this.state});
  final String reference;
  final String kind;
  final PaperworkModel paperwork;
  final PaperworkState state;

  @override
  State<_Body> createState() => _BodyState();
}

class _BodyState extends State<_Body> {
  late final _notes = TextEditingController(text: widget.paperwork.ownReport(widget.kind)?.notes ?? '');

  TravellerOwner get _owner => TravellerOwner(widget.reference);
  PaperworkBloc get _bloc => context.read<PaperworkBloc>();

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _take(String slot) async {
    final Uint8List? bytes = await pickInspectionPhoto(context);
    if (bytes == null || !mounted) return;
    _bloc.add(PaperworkEdited(AddInspectionPhoto(_owner, widget.kind, slot, bytes), busySlot: slot));
  }

  void _send() {
    final typed = _notes.text.trim();
    final saved = widget.paperwork.ownReport(widget.kind)?.notes ?? '';
    _bloc.add(PaperworkEdited(CompleteInspection(_owner, widget.kind, body: typed == saved ? const {} : {'notes': typed.isEmpty ? null : typed})));
  }

  @override
  Widget build(BuildContext context) {
    final kind = widget.kind;
    final mine = widget.paperwork.ownReport(kind);
    final sent = mine?.completed ?? false;
    final open = widget.paperwork.canPhotograph(kind);
    final busy = widget.state.busy;
    final photos = mine?.photos ?? const <InspectionPhotoModel>[];
    final taken = inspectionSlots.where((s) => photos.any((p) => p.slot == s)).length;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        Text('paperwork.my_photos_kicker.$kind'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 6),
        Semantics(header: true, child: Text('paperwork.my_photos_title'.tr(), style: AppText.title(size: 28))),
        const SizedBox(height: 8),
        Text('paperwork.my_photos_intro'.tr(), style: AppText.body(size: 14, height: 1.45)),
        const SizedBox(height: 14),
        if (!widget.paperwork.photosAvailable)
          AppCard(
            color: AppStatus.warnSoft,
            child: Text('paperwork.my_photos_unavailable'.tr(), style: AppText.body(size: 13.5)),
          )
        else if (sent) ...[
          AppCard(
            key: const Key('my-photos-sent'),
            color: AppStatus.okSoft,
            child: Text(
              'paperwork.my_photos_sent_on'.tr(args: ['${photos.length}', DateFormat("d MMM 'à' HH:mm", 'fr').format(mine!.completedAt!.toLocal())]),
              style: AppText.body(size: 14, weight: 600),
            ),
          ),
          const SizedBox(height: 10),
          PhotoStrip(owner: _owner, kind: kind, photos: photos),
          if (mine.photosErased) Text('paperwork.photos_erased'.tr(), style: AppText.muted(size: 12.5)),
          if (mine.notes != null) ...[const SizedBox(height: 10), Text('« ${mine.notes} »', style: AppText.body(size: 14, height: 1.4))],
        ] else if (!open)
          Text('paperwork.my_photos_closed.$kind'.tr(), style: AppText.muted(size: 13.5))
        else ...[
          Row(
            children: [
              Expanded(child: Text('paperwork.photos'.tr().toUpperCase(), style: AppText.label(size: 11))),
              Text('$taken / ${inspectionSlots.length}', style: AppText.strong(size: 12.5, color: AppColors.accentDeep)),
            ],
          ),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            children: [
              for (final slot in inspectionSlots)
                _Slot(
                  key: Key('my-slot-$slot'),
                  slot: slot,
                  photo: photos.where((p) => p.slot == slot).lastOrNull,
                  owner: _owner,
                  kind: kind,
                  busy: widget.state.busySlot == slot && busy,
                  onTap: busy ? null : () => _take(slot),
                ),
            ],
          ),
          const SizedBox(height: 14),
          TextField(
            key: const Key('my-photos-note'),
            controller: _notes,
            maxLength: 1000,
            minLines: 2,
            maxLines: 5,
            decoration: InputDecoration(labelText: 'paperwork.my_photos_note'.tr(), hintText: 'paperwork.my_photos_note_hint'.tr()),
          ),
          const SizedBox(height: 8),
          GradientButton(
            key: const Key('my-photos-send'),
            label: 'paperwork.my_photos_send'.tr(),
            busy: busy && widget.state.busySlot == null,
            onPressed: photos.isEmpty || busy ? null : _send,
          ),
          const SizedBox(height: 8),
          Text('paperwork.my_photos_footer'.tr(), style: AppText.muted(size: 12.5), textAlign: TextAlign.center),
        ],
      ],
    );
  }
}

class _Slot extends StatelessWidget {
  const _Slot({super.key, required this.slot, required this.photo, required this.owner, required this.kind, required this.busy, required this.onTap});
  final String slot;
  final InspectionPhotoModel? photo;
  final PaperworkOwner owner;
  final String kind;
  final bool busy;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final label = slotLabel(slot);
    return Semantics(
      button: true,
      label: photo == null ? 'paperwork.take'.tr(args: [label]) : 'paperwork.retake'.tr(args: [label]),
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.chip,
        child: Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppRadius.chip,
            border: photo == null ? Border.all(color: AppColors.accent, width: 1.5) : null,
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (photo != null) InspectionPhotoView(owner: owner, kind: kind, photoId: photo!.id),
              if (busy)
                const ColoredBox(
                  color: Colors.white70,
                  child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
                )
              else if (photo == null)
                Center(
                  child: Text('+ $label', style: AppText.strong(size: 13, color: AppColors.accentDeep)),
                )
              else
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    color: Colors.black54,
                    child: Text('$label ✓', style: AppText.body(size: 11, weight: 700, color: Colors.white)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
