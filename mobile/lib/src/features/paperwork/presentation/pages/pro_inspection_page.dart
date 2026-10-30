import 'dart:async';
import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/datasources/paperwork_data_source.dart';
import '../../data/models/paperwork_models.dart';
import '../../domain/usecases/paperwork_use_cases.dart';
import '../bloc/paperwork_bloc.dart';
import '../widgets/paperwork_widgets.dart';

/// Plazo Pro (19/10/2026, maquettes 2 et 4): the condition report of a booking at the drop-off or at the return. Six
/// guided photos, the damages tapped on the car's outline, mileage and fuel; « Terminer », then the traveller signs on
/// this phone (or answers later from their app, for the drop-off). At the return, the photos and damages next to the
/// drop-off's.
@RoutePage()
class ProInspectionPage extends StatelessWidget implements AutoRouteWrapper {
  const ProInspectionPage({super.key, @PathParam('id') required this.id, @PathParam('kind') required this.kind});

  final String id;

  /// dropoff | return
  final String kind;

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(
    create: (_) => locator<PaperworkBloc>()..add(PaperworkStarted(StaffOwner(id), startKind: kind)),
    child: this,
  );

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<PaperworkBloc, PaperworkState>(
      listenWhen: (a, b) => (a.errorMessage != b.errorMessage && b.errorMessage != null && b.data != null) || (a.notice != b.notice && b.notice != null),
      listener: (context, state) {
        final text = state.notice != null ? 'paperwork.notice.${state.notice}'.tr() : state.errorMessage;
        if (text != null) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
        context.read<PaperworkBloc>().add(const PaperworkErrorDismissed());
      },
      builder: (context, state) {
        final report = state.data?.report(kind);
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: 'paperwork.report_title.$kind'.tr()),
          body: SafeArea(
            top: false,
            child: report == null || state.data == null
                ? Center(
                    child: state.viewState.isError
                        ? Padding(
                            padding: const EdgeInsets.all(24),
                            child: Text(state.errorMessage ?? 'errors.generic'.tr(), textAlign: TextAlign.center),
                          )
                        : const CircularProgressIndicator(color: AppColors.accent),
                  )
                : report.editable
                ? _Draft(id: id, kind: kind, paperwork: state.data!, report: report, state: state)
                : _Completed(id: id, kind: kind, paperwork: state.data!, report: report, busy: state.busy),
          ),
        );
      },
    );
  }
}

// ---- Taking the report --------------------------------------------------------------------------------------------

class _Draft extends StatefulWidget {
  const _Draft({required this.id, required this.kind, required this.paperwork, required this.report, required this.state});
  final String id;
  final String kind;
  final PaperworkModel paperwork;
  final InspectionModel report;
  final PaperworkState state;

  @override
  State<_Draft> createState() => _DraftState();
}

class _DraftState extends State<_Draft> {
  late final _mileage = TextEditingController(text: widget.report.mileageKm?.toString() ?? '');
  late final _notes = TextEditingController(text: widget.report.notes ?? '');

  @override
  void dispose() {
    _mileage.dispose();
    _notes.dispose();
    super.dispose();
  }

  PaperworkBloc get _bloc => context.read<PaperworkBloc>();
  int? get _typedMileage => int.tryParse(_mileage.text.replaceAll(RegExp(r'\D'), ''));

  Future<Uint8List?> _pick() => pickInspectionPhoto(context);

  Future<void> _takePhoto(String slot) async {
    final bytes = await _pick();
    if (bytes == null || !mounted) return;
    _bloc.add(PaperworkEdited(AddInspectionPhoto(StaffOwner(widget.id), widget.kind, slot, bytes), busySlot: slot));
  }

  void _saveDamages(List<DamageModel> damages) =>
      _bloc.add(PaperworkEdited(UpdateInspection(StaffOwner(widget.id), widget.kind, {'damages': damages.map((d) => d.toBody()).toList()})));

  Future<void> _addDamage(double x, double y) async {
    final label = await showDialog<String>(context: context, builder: (_) => const _DamageDialog());
    if (label == null || label.trim().isEmpty || !mounted) return;
    _saveDamages([...widget.report.damages, DamageModel(x: x, y: y, label: label.trim())]);
  }

  /// A close-up of a damage: taken, then joined to the damage once the server answers.
  Future<void> _damagePhoto(DamageModel damage) async {
    final bytes = await _pick();
    if (bytes == null || !mounted) return;
    final before = widget.report.damagePhotos.map((p) => p.id).toSet();
    final bloc = _bloc..add(PaperworkEdited(AddInspectionPhoto(StaffOwner(widget.id), widget.kind, 'damage', bytes), busySlot: 'damage'));
    final next = await bloc.stream.firstWhere((s) => !s.busy);
    final added = next.data?.report(widget.kind)?.damagePhotos.where((p) => !before.contains(p.id)).firstOrNull;
    final current = next.data?.report(widget.kind)?.damages;
    if (added == null || current == null || !mounted) return;
    _saveDamages([for (final d in current) d.n == damage.n ? d.copyWith(photoId: added.id) : d]);
  }

  void _saveMileage() {
    final km = _typedMileage;
    if (km != null && km != widget.report.mileageKm) _bloc.add(PaperworkEdited(UpdateInspection(StaffOwner(widget.id), widget.kind, {'mileageKm': km})));
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.report;
    final owner = StaffOwner(widget.id);
    final busy = widget.state.busy;
    final taken = inspectionSlots.where((s) => r.photos.any((p) => p.slot == s)).length;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        if (!widget.paperwork.photosAvailable) ...[
          AppCard(
            color: AppStatus.warnSoft,
            child: Text('paperwork.photos_unavailable'.tr(), style: AppText.body(size: 13.5)),
          ),
          const SizedBox(height: 10),
        ],
        if (widget.paperwork.ownReport(widget.kind) case final mine?) ClientPhotosCard(owner: owner, kind: widget.kind, report: mine),
        Row(
          children: [
            Expanded(child: Text('paperwork.photos'.tr().toUpperCase(), style: AppText.label(size: 11))),
            _Pill(
              text: 'paperwork.photos_count'.tr(args: ['$taken', '${inspectionSlots.length}']),
              done: taken == inspectionSlots.length,
            ),
          ],
        ),
        const SizedBox(height: 8),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 1.05,
          children: [
            for (final slot in inspectionSlots)
              _SlotTile(
                key: Key('slot-$slot'),
                slot: slot,
                photo: r.photoOf(slot),
                owner: owner,
                kind: widget.kind,
                busy: widget.state.busySlot == slot,
                onTap: busy ? null : () => _takePhoto(slot),
              ),
          ],
        ),
        const SizedBox(height: 16),
        Text('paperwork.damages'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 8),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('paperwork.damages_help'.tr(), style: AppText.muted(size: 12.5)),
              const SizedBox(height: 6),
              CarOutline(damages: r.damages, onTap: busy ? null : _addDamage),
              if (r.damages.isEmpty)
                Text('paperwork.no_damage'.tr(), style: AppText.muted(size: 13), textAlign: TextAlign.center)
              else
                for (final d in r.damages)
                  _DamageRow(
                    damage: d,
                    owner: owner,
                    kind: widget.kind,
                    onPhoto: busy || d.photoId != null ? null : () => _damagePhoto(d),
                    onRemove: busy ? null : () => _saveDamages(r.damages.where((x) => x.n != d.n).toList()),
                  ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextField(
                key: const Key('mileage'),
                controller: _mileage,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(7)],
                decoration: InputDecoration(labelText: 'paperwork.mileage'.tr(), suffixText: 'km'),
                onEditingComplete: _saveMileage,
                onTapOutside: (_) {
                  FocusScope.of(context).unfocus();
                  _saveMileage();
                },
                style: AppText.tabular(size: 17),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text('paperwork.fuel'.tr(), style: AppText.muted(size: 12.5)),
        const SizedBox(height: 6),
        FuelBars(
          quarters: r.fuelQuarters,
          onSelected: busy ? null : (q) => _bloc.add(PaperworkEdited(UpdateInspection(StaffOwner(widget.id), widget.kind, {'fuelQuarters': q}))),
        ),
        const SizedBox(height: 14),
        TextField(
          key: const Key('inspection-notes'),
          controller: _notes,
          maxLength: 1000,
          minLines: 1,
          maxLines: 4,
          decoration: InputDecoration(labelText: 'paperwork.notes'.tr()),
        ),
        const SizedBox(height: 10),
        if (r.missing.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              'paperwork.missing'.tr(args: [r.missing.map((m) => inspectionSlots.contains(m) ? slotLabel(m) : 'paperwork.field.$m'.tr()).join(', ')]),
              style: AppText.muted(size: 12.5),
              textAlign: TextAlign.center,
            ),
          ),
        GradientButton(
          key: const Key('inspection-complete'),
          label: 'paperwork.complete'.tr(),
          icon: Icons.check_rounded,
          busy: busy && widget.state.busySlot == null,
          onPressed: busy
              ? null
              : () => _bloc.add(
                  PaperworkEdited(
                    CompleteInspection(
                      StaffOwner(widget.id),
                      widget.kind,
                      body: {
                        if (_typedMileage != null && _typedMileage != r.mileageKm) 'mileageKm': _typedMileage,
                        'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
                      },
                    ),
                  ),
                ),
        ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, required this.done});
  final String text;
  final bool done;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: done ? AppStatus.okSoft : AppStatus.warnSoft, borderRadius: AppRadius.pill),
    child: Text(text, style: AppText.body(size: 12, weight: 700, color: done ? AppStatus.okText : AppStatus.warnText)),
  );
}

class _SlotTile extends StatelessWidget {
  const _SlotTile({super.key, required this.slot, required this.photo, required this.owner, required this.kind, required this.busy, required this.onTap});
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
            border: photo == null ? Border.all(color: AppColors.accent, width: 1.6) : null,
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
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.photo_camera_outlined, color: AppColors.accent),
                    const SizedBox(height: 4),
                    Text(label, style: AppText.strong(size: 12, color: AppColors.accentDeep)),
                  ],
                ),
              if (photo != null)
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

class _DamageRow extends StatelessWidget {
  const _DamageRow({required this.damage, required this.owner, required this.kind, this.onPhoto, this.onRemove, this.tag});
  final DamageModel damage;
  final PaperworkOwner owner;
  final String kind;
  final VoidCallback? onPhoto;
  final VoidCallback? onRemove;
  final Widget? tag;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: [
          CircleAvatar(
            radius: 11,
            backgroundColor: AppStatus.bad,
            child: Text('${damage.n}', style: AppText.body(size: 11, weight: 800, color: Colors.white)),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(damage.label, style: AppText.body(size: 14))),
          ?tag,
          if (damage.photoId != null)
            IconButton(
              tooltip: 'paperwork.see_photo'.tr(),
              icon: const Icon(Icons.image_outlined, color: AppColors.accent),
              onPressed: () => showPhoto(context, owner, kind, damage.photoId!, damage.label),
            )
          else if (onPhoto != null)
            IconButton(
              tooltip: 'paperwork.add_damage_photo'.tr(),
              icon: const Icon(Icons.add_a_photo_outlined, color: AppColors.accent),
              onPressed: onPhoto,
            ),
          if (onRemove != null)
            IconButton(
              tooltip: 'paperwork.remove_damage'.tr(),
              icon: const Icon(Icons.close_rounded, color: AppColors.muted),
              onPressed: onRemove,
            ),
        ],
      ),
    );
  }
}

class _DamageDialog extends StatefulWidget {
  const _DamageDialog();

  @override
  State<_DamageDialog> createState() => _DamageDialogState();
}

class _DamageDialogState extends State<_DamageDialog> {
  final _text = TextEditingController();
  static const _quick = ['scratch', 'dent', 'chip', 'broken'];

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('paperwork.damage_title'.tr()),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final q in _quick)
                ActionChip(label: Text('paperwork.damage_kind.$q'.tr()), onPressed: () => _text.text = '${'paperwork.damage_kind.$q'.tr()}, '),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            key: const Key('damage-label'),
            controller: _text,
            autofocus: true,
            maxLength: 120,
            decoration: InputDecoration(hintText: 'paperwork.damage_hint'.tr()),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text('paperwork.cancel'.tr())),
        FilledButton(key: const Key('damage-save'), onPressed: () => Navigator.of(context).pop(_text.text), child: Text('paperwork.damage_save'.tr())),
      ],
    );
  }
}

// ---- Completed: the answer, and at the return the comparison --------------------------------------------------------

class _Completed extends StatefulWidget {
  const _Completed({required this.id, required this.kind, required this.paperwork, required this.report, required this.busy});
  final String id;
  final String kind;
  final PaperworkModel paperwork;
  final InspectionModel report;
  final bool busy;

  @override
  State<_Completed> createState() => _CompletedState();
}

class _CompletedState extends State<_Completed> {
  String _slot = inspectionSlots.first;

  /// Damages of the return far from every drop-off one: new (amber on the outline).
  Set<int> _newDamages(List<DamageModel> before, List<DamageModel> after) => {
    for (final d in after)
      if (!before.any((b) => math.sqrt(math.pow(b.x - d.x, 2) + math.pow(b.y - d.y, 2)) < 0.08)) d.n,
  };

  @override
  Widget build(BuildContext context) {
    final r = widget.report;
    final owner = StaffOwner(widget.id);
    final dropoff = widget.paperwork.dropoff;
    final isReturn = widget.kind == 'return';
    final comparison = widget.paperwork.comparison;
    final fresh = isReturn && comparison != null ? _newDamages(comparison.before, comparison.after) : <int>{};
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        if (widget.paperwork.ownReport(widget.kind) case final mine?) ClientPhotosCard(owner: owner, kind: widget.kind, report: mine),
        Row(
          children: [
            Expanded(
              child: Text(
                'paperwork.done_by'.tr(args: [r.performedBy ?? '—', DateFormat("d MMM 'à' HH:mm", 'fr').format(r.completedAt!.toLocal())]),
                style: AppText.muted(size: 13),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: decisionColor(r).withValues(alpha: 0.12), borderRadius: AppRadius.pill),
              child: Text(
                decisionLabel(r),
                key: const Key('inspection-decision'),
                style: AppText.body(size: 12, weight: 700, color: decisionColor(r)),
              ),
            ),
          ],
        ),
        if (r.reserveText != null) ...[
          const SizedBox(height: 8),
          AppCard(
            color: AppStatus.badSoft,
            child: Text('« ${r.reserveText} »', style: AppText.body(size: 14)),
          ),
        ],
        const SizedBox(height: 12),
        if (isReturn && dropoff?.completed == true) ...[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final s in inspectionSlots) ...[
                  ChoiceChip(key: Key('compare-$s'), label: Text(slotLabel(s)), selected: _slot == s, onSelected: (_) => setState(() => _slot = s)),
                  const SizedBox(width: 6),
                ],
              ],
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final (kind, report) in [('dropoff', dropoff!), ('return', r)]) ...[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AspectRatio(
                        aspectRatio: 0.9,
                        child: ClipRRect(
                          borderRadius: AppRadius.chip,
                          child: report.photoOf(_slot) == null
                              ? const ColoredBox(color: AppColors.canvas)
                              : GestureDetector(
                                  onTap: () => showPhoto(context, owner, kind, report.photoOf(_slot)!.id, slotLabel(_slot)),
                                  child: InspectionPhotoView(owner: owner, kind: kind, photoId: report.photoOf(_slot)!.id),
                                ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${'paperwork.kind_short.$kind'.tr()} · ${DateFormat("d MMM HH:mm", 'fr').format(report.completedAt!.toLocal())}',
                        style: AppText.muted(size: 12),
                      ),
                    ],
                  ),
                ),
                if (kind == 'dropoff') const SizedBox(width: 8),
              ],
            ],
          ),
        ] else
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
            children: [
              for (final p in r.photos)
                GestureDetector(
                  onTap: () => showPhoto(context, owner, widget.kind, p.id, slotLabel(p.slot)),
                  child: ClipRRect(
                    borderRadius: AppRadius.chip,
                    child: InspectionPhotoView(owner: owner, kind: widget.kind, photoId: p.id),
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
              CarOutline(damages: r.damages, highlight: fresh, height: 190),
              if (r.damages.isEmpty) Text('paperwork.no_damage'.tr(), style: AppText.muted(size: 13), textAlign: TextAlign.center),
              for (final d in r.damages)
                _DamageRow(
                  damage: d,
                  owner: owner,
                  kind: widget.kind,
                  tag: isReturn && dropoff?.completed == true
                      ? _Pill(text: fresh.contains(d.n) ? 'paperwork.new_damage'.tr() : 'paperwork.already_there'.tr(), done: !fresh.contains(d.n))
                      : null,
                ),
              const Divider(height: 22),
              _Line(
                'paperwork.mileage'.tr(),
                [
                  if (isReturn && dropoff?.mileageKm != null) '${dropoff!.mileageKm} →',
                  '${r.mileageKm ?? '—'} km',
                  if (comparison?.mileageDeltaKm != null) '(+${comparison!.mileageDeltaKm})',
                ].join(' '),
              ),
              _Line(
                'paperwork.fuel'.tr(),
                [if (isReturn && dropoff?.fuelQuarters != null) '${fuelLabel(dropoff!.fuelQuarters)} →', fuelLabel(r.fuelQuarters)].join(' '),
              ),
              if (r.notes != null) _Line('paperwork.notes'.tr(), r.notes!),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (r.canAnswer) ...[
          GradientButton(
            key: const Key('inspection-sign'),
            label: 'paperwork.have_signed'.tr(),
            icon: Icons.draw_rounded,
            busy: widget.busy,
            onPressed: widget.busy ? null : () => _AnswerSheet.open(context, widget.kind, newDamages: fresh.length),
          ),
          if (widget.kind == 'dropoff') ...[
            const SizedBox(height: 8),
            OutlineAction(key: const Key('inspection-later'), label: 'paperwork.answer_later'.tr(), onPressed: () => context.router.maybePop()),
            const SizedBox(height: 6),
            Text('paperwork.answer_later_help'.tr(), style: AppText.muted(size: 12.5), textAlign: TextAlign.center),
          ],
        ],
      ],
    );
  }
}

class _Line extends StatelessWidget {
  const _Line(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      children: [
        Expanded(child: Text(label, style: AppText.muted(size: 13))),
        Flexible(
          child: Text(value, style: AppText.tabular(size: 14, weight: 600), textAlign: TextAlign.end),
        ),
      ],
    ),
  );
}

/// The traveller signs on the staff's phone: « Conforme » or a reservation in their own words.
class _AnswerSheet extends StatefulWidget {
  const _AnswerSheet({required this.kind, required this.newDamages});
  final String kind;
  final int newDamages;

  static Future<void> open(BuildContext context, String kind, {required int newDamages}) {
    final bloc = context.read<PaperworkBloc>();
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => BlocProvider.value(
        value: bloc,
        child: _AnswerSheet(kind: kind, newDamages: newDamages),
      ),
    );
  }

  @override
  State<_AnswerSheet> createState() => _AnswerSheetState();
}

class _AnswerSheetState extends State<_AnswerSheet> {
  final _signature = SignatureController();
  final _reserve = TextEditingController();
  bool _reserved = false;

  @override
  void dispose() {
    _signature.dispose();
    _reserve.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<PaperworkBloc, PaperworkState>(
      listenWhen: (a, b) => a.notice != b.notice && b.notice == 'answered',
      listener: (context, _) => Navigator.of(context).pop(),
      builder: (context, state) => Padding(
        padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.viewInsetsOf(context).bottom + MediaQuery.paddingOf(context).bottom),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('paperwork.answer_title.${widget.kind}'.tr(), style: AppText.title(size: 20)),
              const SizedBox(height: 6),
              Text('paperwork.answer_help.${widget.kind}'.tr(), style: AppText.muted(size: 13)),
              if (widget.newDamages > 0) ...[
                const SizedBox(height: 8),
                AppCard(
                  color: AppStatus.warnSoft,
                  child: Text('paperwork.new_damages_count'.tr(args: ['${widget.newDamages}']), style: AppText.body(size: 13.5)),
                ),
              ],
              const SizedBox(height: 10),
              SwitchListTile(
                key: const Key('answer-reserve'),
                contentPadding: EdgeInsets.zero,
                value: _reserved,
                onChanged: (v) => setState(() => _reserved = v),
                title: Text('paperwork.reserve_toggle'.tr(), style: AppText.body(size: 14.5)),
              ),
              if (_reserved)
                TextField(
                  key: const Key('answer-reserve-text'),
                  controller: _reserve,
                  maxLength: 1000,
                  minLines: 2,
                  maxLines: 5,
                  decoration: InputDecoration(labelText: 'paperwork.reserve_label'.tr()),
                  onChanged: (_) => setState(() {}),
                ),
              SignaturePad(controller: _signature),
              const SizedBox(height: 12),
              ListenableBuilder(
                listenable: _signature,
                builder: (context, _) {
                  final ready = _signature.signed && (!_reserved || _reserve.text.trim().isNotEmpty);
                  return GradientButton(
                    key: const Key('answer-submit'),
                    label: _reserved ? 'paperwork.sign_reserved'.tr() : 'paperwork.sign_accepted'.tr(),
                    busy: state.busy,
                    onPressed: !ready || state.busy
                        ? null
                        : () => context.read<PaperworkBloc>().add(
                            PaperworkAnswered(
                              widget.kind,
                              decision: _reserved ? 'reserved' : 'accepted',
                              reserveText: _reserved ? _reserve.text.trim() : null,
                              strokes: _signature.toJson(),
                            ),
                          ),
                  );
                },
              ),
              if (state.errorMessage != null) ...[
                const SizedBox(height: 8),
                Text(
                  state.errorMessage!,
                  style: AppText.body(size: 13, color: AppColors.danger),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
