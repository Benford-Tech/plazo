import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../services/location_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../../../shared/widgets/live_dot.dart';
import '../../data/models/arrival_model.dart';
import '../bloc/arrival_bloc.dart';

/// The "Prévenir de son arrivée" block of a booking (approved design, frames 1 and 2): what to do
/// now for the drop-off or the return, the sharing in progress, and what the parking was told.
class ArrivalBlock extends StatelessWidget {
  const ArrivalBlock({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ArrivalBloc, ArrivalState>(
      builder: (context, state) {
        final arrival = state.arrival;
        if (arrival == null) return const SizedBox.shrink();
        final moment = arrival.moment;
        if (moment == null) return const SizedBox.shrink();
        final children = <Widget>[
          if (!moment.open)
            _NotYet(kind: moment.kind, opensAt: moment.opensAt)
          else if (moment.kind == ArrivalKind.outbound)
            ..._outbound(context, state)
          else
            ..._return(context, state),
          if (state.locationProblem != null) _Notice(text: _locationText(state.locationProblem!)),
          if (state.errorCode != null && state.errorCode != 'too_many_positions') _Notice(text: translateErrorCode(state.errorCode), error: true),
        ];
        return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: _spaced(children));
      },
    );
  }

  static String _locationText(LocationAccess access) => switch (access) {
    LocationAccess.deniedForever => 'arrival.location_denied_forever'.tr(),
    LocationAccess.serviceDisabled => 'arrival.location_service_disabled'.tr(),
    _ => 'arrival.location_denied'.tr(),
  };

  List<Widget> _outbound(BuildContext context, ArrivalState state) {
    final signal = state.signal;
    final bloc = context.read<ArrivalBloc>();
    if (signal?.state == ArrivalSignalState.sharing) return [_Sharing(state: state)];
    if (signal?.state == ArrivalSignalState.atMeetingPoint) {
      return [
        _DoneCard(title: 'arrival.arrived_title'.tr(), text: 'arrival.arrived_text'.tr()),
      ];
    }
    final busy = state.actionState.isProcessing;
    return [
      if (signal?.state == ArrivalSignalState.announced)
        _AnnouncedCard(signal: signal!, onCancel: () => bloc.add(const ArrivalStopRequested()))
      else if (signal?.state == ArrivalSignalState.ended)
        _Notice(text: signal!.endReason == 'expired' ? 'arrival.ended_expired'.tr() : 'arrival.ended_stopped'.tr()),
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('arrival.explain_title'.tr(), style: AppText.strong()),
            const SizedBox(height: 8),
            Text.rich(
              TextSpan(
                style: AppText.muted(),
                children: [
                  TextSpan(text: 'arrival.explain_before'.tr()),
                  TextSpan(text: 'arrival.explain_only'.tr(), style: AppText.muted().copyWith(fontWeight: FontWeight.w700, color: AppColors.ink)),
                  TextSpan(text: 'arrival.explain_after'.tr()),
                ],
              ),
            ),
          ],
        ),
      ),
      const _NoteField(),
      GradientButton(
        key: const Key('share-button'),
        label: 'arrival.share'.tr(),
        icon: Icons.near_me_rounded,
        busy: busy,
        // Tapping this button, right under the explanation, is the consent.
        onPressed: () => bloc.add(const ArrivalShareRequested(consent: true)),
      ),
      ..._announce(context, state, 'arrival.announce_in'),
      Text('arrival.stop_anytime'.tr(), style: AppText.muted()),
    ];
  }

  List<Widget> _return(BuildContext context, ArrivalState state) {
    final signal = state.signal;
    final bloc = context.read<ArrivalBloc>();
    final label = _meetingLabel(state.arrival!.meetingPoint, ArrivalKind.returnTrip);
    if (signal?.state == ArrivalSignalState.atMeetingPoint) {
      return [_DoneCard(title: 'arrival.at_point_done_title'.tr(), text: 'arrival.at_point_done_text'.tr(args: [label]))];
    }
    return [
      if (signal?.state == ArrivalSignalState.announced) _AnnouncedCard(signal: signal!, onCancel: () => bloc.add(const ArrivalStopRequested())),
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('arrival.return_explain_title'.tr(), style: AppText.strong()),
            const SizedBox(height: 8),
            Text('arrival.return_explain'.tr(args: [label]), style: AppText.muted()),
          ],
        ),
      ),
      const _NoteField(),
      _AtPointButton(busy: state.actionState.isProcessing),
      ..._announce(context, state, 'arrival.return_announce_in'),
    ];
  }

  List<Widget> _announce(BuildContext context, ArrivalState state, String key) {
    final bloc = context.read<ArrivalBloc>();
    return [
      OutlineAction(label: 'arrival.announce_toggle'.tr(), onPressed: () => bloc.add(const ArrivalAnnounceToggled())),
      if (state.showAnnounceOptions)
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: [
            for (final minutes in state.arrival!.rules.announceMinutes)
              ActionChip(
                key: Key('announce-$minutes'),
                label: Text(key.tr(args: ['$minutes']), style: AppText.body(size: 14, weight: 600, color: AppColors.dark)),
                shape: const StadiumBorder(side: BorderSide(color: AppColors.accent)),
                backgroundColor: Colors.white,
                onPressed: () => bloc.add(ArrivalAnnounced(minutes)),
              ),
          ],
        ),
    ];
  }
}

String _meetingLabel(MeetingPointModel? point, ArrivalKind kind) {
  final label = point?.label;
  if (label != null && label.isNotEmpty) return label;
  return kind == ArrivalKind.outbound ? 'arrival.meeting_reception'.tr() : 'arrival.meeting_return'.tr();
}

List<Widget> _spaced(List<Widget> children) => [
  for (var i = 0; i < children.length; i++) ...[if (i > 0) const SizedBox(height: 12), children[i]],
];

/// E (06/10/2026): a word for the parking, sent with the next signal ("2 enfants, poussette").
class _NoteField extends StatefulWidget {
  const _NoteField();

  @override
  State<_NoteField> createState() => _NoteFieldState();
}

class _NoteFieldState extends State<_NoteField> {
  late final _controller = TextEditingController(text: context.read<ArrivalBloc>().state.note);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
    key: const Key('arrival-note'),
    controller: _controller,
    maxLength: 200,
    textCapitalization: TextCapitalization.sentences,
    decoration: InputDecoration(labelText: 'arrival.note_label'.tr(), hintText: 'arrival.note_hint'.tr(), counterText: ''),
    onChanged: (v) => context.read<ArrivalBloc>().add(ArrivalNoteChanged(v)),
  );
}

/// Frame 2: sharing in progress.
class _Sharing extends StatelessWidget {
  const _Sharing({required this.state});
  final ArrivalState state;

  @override
  Widget build(BuildContext context) {
    final signal = state.signal!;
    final meeting = state.arrival!.meetingPoint;
    final me = state.lastPosition;
    final eta = signal.etaMinutes;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: _spaced([
        Row(
          children: [
            const LiveDot(),
            const SizedBox(width: 6),
            Flexible(child: Text('arrival.live'.tr(), style: AppText.strong(size: 16, color: AppColors.accent))),
          ],
        ),
        if (meeting != null)
          IgnMap(
            meeting: LatLng(meeting.lat, meeting.lng),
            meetingLabel: _meetingLabel(meeting, signal.kind),
            me: me == null ? null : LatLng(me.lat, me.lng),
          ),
        AppCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('arrival.eta_label'.tr(), style: AppText.body(size: 14)),
                    Text(
                      eta == null ? 'arrival.eta_unknown'.tr() : 'arrival.eta_minutes'.tr(args: ['$eta']),
                      key: const Key('eta'),
                      style: AppText.big(),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (signal.distanceM != null) Text(distanceLabel(signal.distanceM!), style: AppText.muted()),
                  if (signal.etaAt != null) Text('arrival.arrival_around'.tr(args: [hhmm(signal.etaAt!)]), style: AppText.muted()),
                  if (eta == null) Text('arrival.waiting_position'.tr(), style: AppText.muted()),
                ],
              ),
            ],
          ),
        ),
        AppCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.check_rounded, size: 18, color: AppColors.muted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  signal.kind == ArrivalKind.outbound ? 'arrival.notified'.tr() : 'arrival.notified_return'.tr(),
                  style: AppText.muted(),
                ),
              ),
            ],
          ),
        ),
        if (signal.note != null) Text('arrival.note_sent'.tr(args: [signal.note!]), key: const Key('note-sent'), style: AppText.muted()),
        Text('arrival.auto_stop'.tr(args: [durationLabel(state.remaining)]), key: const Key('auto-stop'), style: AppText.muted()),
        OutlineAction(
          key: const Key('stop-button'),
          label: 'arrival.stop'.tr(),
          onPressed: () => context.read<ArrivalBloc>().add(const ArrivalStopRequested()),
        ),
      ]),
    );
  }
}

class _AnnouncedCard extends StatelessWidget {
  const _AnnouncedCard({required this.signal, required this.onCancel});
  final ArrivalSignalModel signal;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final minutes = signal.announcedMinutes ?? signal.etaMinutes ?? 0;
    final at = signal.etaAt == null ? '' : hhmm(signal.etaAt!);
    final key = signal.kind == ArrivalKind.outbound ? 'arrival.announced_text' : 'arrival.announced_return_text';
    return AppCard(
      borderColor: AppColors.peach,
      borderWidth: 1.6,
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppColors.peach),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              signal.note == null ? key.tr(args: ['$minutes', at]) : '${key.tr(args: ['$minutes', at])}\n${'arrival.note_sent'.tr(args: [signal.note!])}',
              style: AppText.body(size: 14.5),
            ),
          ),
          TextButton(onPressed: onCancel, child: Text('arrival.cancel_announce'.tr())),
        ],
      ),
    );
  }
}

class _DoneCard extends StatelessWidget {
  const _DoneCard({required this.title, required this.text});
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      borderColor: AppColors.peach,
      borderWidth: 1.6,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: AppColors.peach),
              const SizedBox(width: 8),
              Expanded(child: Text(title, style: AppText.strong(size: 16))),
            ],
          ),
          const SizedBox(height: 6),
          Text(text, style: AppText.muted()),
        ],
      ),
    );
  }
}

class _NotYet extends StatelessWidget {
  const _NotYet({required this.kind, required this.opensAt});
  final ArrivalKind kind;
  final DateTime opensAt;

  @override
  Widget build(BuildContext context) {
    final key = kind == ArrivalKind.outbound ? 'arrival.not_yet_outbound' : 'arrival.not_yet_return';
    final when = '${DateFormat('EEE d MMM', 'fr_FR').format(opensAt.toLocal())} ${hhmm(opensAt)}';
    return AppCard(
      color: AppColors.canvas,
      child: Row(
        children: [
          const Icon(Icons.schedule_rounded, color: AppColors.accent),
          const SizedBox(width: 10),
          Expanded(child: Text(key.tr(args: [when]), style: AppText.muted())),
        ],
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.text, this.error = false});
  final String text;
  final bool error;

  @override
  Widget build(BuildContext context) => AppCard(
    color: error ? const Color(0xFFFDF1F0) : AppColors.canvas,
    borderColor: error ? const Color(0xFFF2C9C5) : AppColors.line,
    child: Text(text, style: AppText.body(size: 14, color: error ? AppColors.danger : AppColors.ink)),
  );
}

/// "Je suis au point de rendez-vous", with the optional one-off position.
class _AtPointButton extends StatefulWidget {
  const _AtPointButton({required this.busy});
  final bool busy;

  @override
  State<_AtPointButton> createState() => _AtPointButtonState();
}

class _AtPointButtonState extends State<_AtPointButton> {
  bool _withPosition = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GradientButton(
          key: const Key('at-point-button'),
          label: 'arrival.at_point'.tr(),
          icon: Icons.place_rounded,
          busy: widget.busy,
          onPressed: () => context.read<ArrivalBloc>().add(ArrivalAtMeetingPointRequested(withPosition: _withPosition)),
        ),
        CheckboxListTile(
          value: _withPosition,
          onChanged: (v) => setState(() => _withPosition = v ?? false),
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          activeColor: AppColors.accent,
          title: Text('arrival.with_position'.tr(), style: AppText.muted()),
        ),
      ],
    );
  }
}
