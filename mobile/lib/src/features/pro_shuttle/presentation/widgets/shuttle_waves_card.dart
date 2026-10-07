import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../data/models/shuttle_models.dart';
import '../bloc/shuttle_waves_bloc.dart';

/// V-A "Ligne du jour" (05/10/2026): the day's shuttle waves, both directions on one timeline,
/// with the passengers against the seats; "Démarrer ce trajet" hands a wave to the driver's
/// list (direction, stop and travellers preselected). Needs a [ShuttleWavesBloc] above.
class ShuttleWavesCard extends StatefulWidget {
  const ShuttleWavesCard({super.key, this.onStart, this.running = false});

  /// Called with the wave to take over; null hides the buttons (the web, a non-driver).
  final void Function(ShuttleWaveModel wave)? onStart;

  /// A trip is running: no wave can start.
  final bool running;

  @override
  State<ShuttleWavesCard> createState() => _ShuttleWavesCardState();
}

class _ShuttleWavesCardState extends State<ShuttleWavesCard> {
  /// Today's past waves are folded by default (06/10/2026: the driver sees what is ahead of them).
  bool _showPast = false;

  @override
  Widget build(BuildContext context) {
    final onStart = widget.onStart;
    final running = widget.running;
    return BlocBuilder<ShuttleWavesBloc, ShuttleWavesState>(
      builder: (context, state) {
        final bloc = context.read<ShuttleWavesBloc>();
        final d = state.data;
        final upcoming = state.upcoming;
        final past = state.past;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Semantics(header: true, child: Text('waves.title'.tr(), style: AppText.title(size: 20))),
                ),
                if (d != null)
                  Text(
                    (state.dayOffset == 0 ? 'waves.count_upcoming' : 'waves.count').tr(args: ['${upcoming.length}']),
                    style: AppText.tabular(size: 12, color: AppColors.muted),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 34,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  for (final (i, label) in ['waves.today'.tr(), 'waves.tomorrow'.tr(), planningDay(state.now.add(const Duration(days: 2)))].indexed) ...[
                    _DayChip(key: Key('waves-day-$i'), label: label, selected: state.dayOffset == i, onTap: () => bloc.add(ShuttleWavesDayChanged(i))),
                    const SizedBox(width: 6),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 8),
            if (d != null) ...[
              Text(
                d.seats == null ? 'waves.seats_unknown'.tr(args: ['${d.vehiclesInService}']) : 'waves.seats'.tr(args: ['${d.vehiclesInService}', '${d.seats}']),
                style: AppText.muted(size: 12),
              ),
              const SizedBox(height: 8),
            ],
            if (!state.loaded && state.viewState.isError)
              AppCard(
                color: AppStatus.badSoft,
                borderColor: AppStatus.badSoft,
                child: Text(translateErrorCode(state.errorCode), style: AppText.body(size: 14, color: AppStatus.badText)),
              )
            else if (!state.loaded)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
              )
            else if (d!.waves.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text('waves.empty'.tr(), style: AppText.muted()),
              )
            else ...[
              if (upcoming.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text('waves.empty_upcoming'.tr(), key: const Key('waves-empty-upcoming'), style: AppText.muted()),
                ),
              for (final wave in upcoming) ...[
                _WaveTile(wave: wave, onStart: onStart == null || running || !wave.planned ? null : () => onStart(wave)),
                const SizedBox(height: 8),
              ],
              if (past.isNotEmpty) ...[
                InkWell(
                  key: const Key('waves-past'),
                  borderRadius: AppRadius.chip,
                  onTap: () => setState(() => _showPast = !_showPast),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                    child: Row(
                      children: [
                        Icon(_showPast ? Icons.expand_less_rounded : Icons.expand_more_rounded, size: 18, color: AppColors.muted),
                        const SizedBox(width: 6),
                        Expanded(child: Text((past.length == 1 ? 'waves.past_one' : 'waves.past_count').tr(args: ['${past.length}']), style: AppText.body(size: 13, weight: 600, color: AppColors.muted))),
                        Text((_showPast ? 'waves.past_hide' : 'waves.past_show').tr(), style: AppText.body(size: 13, weight: 600, color: AppColors.accent)),
                      ],
                    ),
                  ),
                ),
                if (_showPast)
                  for (final wave in past) ...[const SizedBox(height: 8), _WaveTile(wave: wave)],
              ],
            ],
          ],
        );
      },
    );
  }
}

class _DayChip extends StatelessWidget {
  const _DayChip({super.key, required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.action : AppColors.panel,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.pill,
        side: BorderSide(color: selected ? AppColors.action : AppColors.panelLine),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.pill,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(label, style: AppText.tabular(size: 12, weight: 600, color: selected ? AppColors.onAccent : AppColors.muted)),
        ),
      ),
    );
  }
}

/// One wave: the time it leaves the parking, the side and stop, passengers against seats, the
/// travellers with their flight, and the button.
class _WaveTile extends StatelessWidget {
  const _WaveTile({required this.wave, this.onStart});
  final ShuttleWaveModel wave;
  final VoidCallback? onStart;

  @override
  Widget build(BuildContext context) {
    final done = wave.state == 'done';
    final border = done ? AppColors.panelLine : (wave.overflow ? AppStatus.bad : AppColors.panelLine);
    return Opacity(
      opacity: done ? 0.6 : 1,
      child: AppCard(
        key: Key('wave-${wave.id}'),
        borderColor: border,
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(hhmm(wave.leaveAt), style: AppText.tabular(size: 22, weight: 700, color: AppColors.accent)),
                const SizedBox(width: 10),
                Icon(wave.dropoff ? Icons.flight_takeoff_rounded : Icons.flight_land_rounded, size: 18, color: AppColors.accent),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${wave.dropoff ? 'waves.to_terminal'.tr() : 'waves.from_airport'.tr()} · ${wave.stopName ?? 'waves.airport'.tr()}',
                    style: AppText.strong(size: 14),
                    maxLines: 2,
                  ),
                ),
                Text(
                  wave.seats == null ? '${wave.passengers}' : '${wave.passengers} / ${wave.seats}',
                  style: AppText.tabular(size: 17, weight: 700, color: wave.overflow ? AppStatus.badText : AppColors.ink),
                ),
              ],
            ),
            if (!wave.dropoff && wave.meetAt != null || wave.overflow || wave.noFlight > 0 || wave.state != 'planned') ...[
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (!wave.dropoff && wave.meetAt != null) Text('waves.meet_at'.tr(args: [hhmm(wave.meetAt!)]), style: AppText.muted(size: 12)),
                  if (wave.overflow)
                    _Pill(
                      text: 'waves.vehicles'.tr(args: ['${wave.vehiclesNeeded}']),
                      bg: AppStatus.badSoft,
                      fg: AppStatus.badText,
                    ),
                  if (wave.noFlight > 0)
                    _Pill(
                      text: 'waves.no_flight'.tr(args: ['${wave.noFlight}']),
                      bg: AppStatus.warnSoft,
                      fg: AppStatus.warnText,
                    ),
                  if (wave.state == 'running') _Pill(text: 'waves.state_running'.tr(), bg: AppStatus.infoSoft, fg: AppStatus.info),
                  if (done) _Pill(text: 'waves.state_done'.tr(), bg: AppColors.panel2, fg: AppColors.muted),
                ],
              ),
            ],
            const SizedBox(height: 8),
            for (final m in wave.members) _MemberRow(member: m),
            if (onStart != null) ...[
              const SizedBox(height: 6),
              Align(
                alignment: Alignment.centerLeft,
                child: FilledButton.tonal(
                  key: Key('wave-start-${wave.id}'),
                  onPressed: onStart,
                  style: FilledButton.styleFrom(backgroundColor: AppColors.action, foregroundColor: AppColors.onAccent, visualDensity: VisualDensity.compact),
                  child: Text('waves.start'.tr(), style: AppText.strong(size: 13, color: AppColors.onAccent)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MemberRow extends StatelessWidget {
  const _MemberRow({required this.member});
  final WaveMemberModel member;

  /// "AF 7641 · décollage 07:45" / "TO 3628 · atterrissage 09:50" / "heure saisie 11:30", with its tone.
  (String, Color) _flight() {
    final f = member.flight;
    final dropoff = member.direction == 'dropoff';
    if (f == null || f.at == null) {
      final at = member.direction == 'pickup' && member.meetAt != null ? member.meetAt! : member.leaveAt;
      return ('waves.booking_time'.tr(args: [hhmm(at)]), AppStatus.warnText);
    }
    final when = dropoff ? 'waves.take_off'.tr(args: [hhmm(f.at!)]) : 'waves.landing'.tr(args: [hhmm(f.at!)]);
    final late = f.lateMinutes;
    final status = switch (f.status) {
      'cancelled' => ('waves.flight_cancelled'.tr(), AppStatus.badText),
      'diverted' => ('waves.flight_diverted'.tr(), AppStatus.badText),
      'landed' || 'departed' when dropoff => ('waves.flight_departed'.tr(), AppStatus.okText),
      'landed' => ('waves.flight_landed'.tr(), AppStatus.okText),
      'unknown' => ('waves.flight_unknown'.tr(), AppStatus.warnText),
      _ when f.status == 'delayed' || late >= 15 => ('waves.flight_delayed'.tr(args: ['${late < 1 ? 1 : late}']), AppStatus.warnText),
      _ => (null, AppColors.muted),
    };
    return ('${f.number} · $when${status.$1 == null ? '' : ' · ${status.$1}'}', status.$2);
  }

  @override
  Widget build(BuildContext context) {
    final (text, colour) = _flight();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: member.customerName, style: AppText.body(size: 13, weight: 600)),
                  TextSpan(
                    text: ' · ${'waves.pax'.tr(args: ['${member.passengers}'])}',
                    style: AppText.muted(size: 12),
                  ),
                ],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              text,
              style: AppText.tabular(size: 11, weight: 600, color: colour),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, required this.bg, required this.fg});
  final String text;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.pill),
      child: Text(text, style: AppText.tabular(size: 11, weight: 600, color: fg)),
    );
  }
}
