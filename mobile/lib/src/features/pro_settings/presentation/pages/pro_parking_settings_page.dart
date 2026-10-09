import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/datasources/settings_data_source.dart';
import '../../data/models/settings_models.dart';
import '../bloc/pro_settings_bloc.dart';

/// Same rule as the server (bookableCapacity): the share kept back by the safety margin.
int bookablePreview(int total, int margin) => total <= 0 ? 0 : (total * (100 - margin.clamp(0, 50)) / 100).floor();

/// The parking's settings (managers): name, address, capacity, margin, shuttle time, and the SMS
/// channel to travellers. The meeting point and the parking plan have their own screens.
@RoutePage()
class ProParkingSettingsPage extends StatelessWidget implements AutoRouteWrapper {
  const ProParkingSettingsPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProSettingsBloc>()..add(const ProSettingsStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProSettingsBloc, ProSettingsState>(
      listenWhen: (a, b) => a.errorCode != b.errorCode || a.notice != b.notice,
      listener: (context, state) {
        final text = state.errorCode != null ? translateErrorCode(state.errorCode) : _noticeText(state.notice);
        if (text != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
          context.read<ProSettingsBloc>().add(const ProSettingsNoticeShown());
        }
      },
      builder: (context, state) {
        final p = state.parking;
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: 'settings.title'.tr()),
          body: p == null
              ? Center(
                  child: state.viewState.isError
                      ? Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center),
                        )
                      : const CircularProgressIndicator(color: AppColors.accent),
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
                  children: [
                    _ParkingForm(parking: p, state: state),
                    const SizedBox(height: 24),
                    _TrackingSection(state: state),
                    const SizedBox(height: 24),
                    _SmsSection(state: state),
                  ],
                ),
        );
      },
    );
  }

  static String? _noticeText(String? notice) {
    if (notice == null) return null;
    final parts = notice.split(':');
    return switch (parts.first) {
      'sms.test_sent' => 'sms.test_sent'.tr(args: [parts[1]]),
      'sms.test_queued' => 'sms.test_queued'.tr(args: [parts[1]]),
      _ => notice.tr(),
    };
  }
}

class _ParkingForm extends StatefulWidget {
  const _ParkingForm({required this.parking, required this.state});
  final ParkingSettingsModel parking;
  final ProSettingsState state;
  @override
  State<_ParkingForm> createState() => _ParkingFormState();
}

class _ParkingFormState extends State<_ParkingForm> {
  late final _name = TextEditingController(text: widget.parking.name);
  late final _address = TextEditingController(text: widget.parking.address ?? '');
  late final _capacity = TextEditingController(text: '${widget.parking.totalCapacity}');
  late final _margin = TextEditingController(text: '${widget.parking.safetyMarginPct}');
  late final _shuttle = TextEditingController(text: '${widget.parking.shuttleTravelMinutes}');
  late final _lead = TextEditingController(text: '${widget.parking.terminalLeadMinutes}');
  late final _delay = TextEditingController(text: '${widget.parking.landingDelayMinutes}');

  @override
  void dispose() {
    for (final c in [_name, _address, _capacity, _margin, _shuttle, _lead, _delay]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProSettingsBloc>();
    final state = widget.state;
    String? err(String f) => state.fieldErrors[f] == null ? null : translateErrorCode(state.fieldErrors[f]);
    // 09/10/2026: once the plan has room (valet files or active spots), its figure is the capacity
    // used everywhere; the declared one is kept and sent back unchanged.
    final source = widget.parking.capacitySource;
    final fromPlan = source == 'files' || source == 'spots';
    final total = fromPlan ? widget.parking.effectiveCapacity : int.tryParse(_capacity.text) ?? 0;
    final margin = int.tryParse(_margin.text) ?? 0;
    final marginField = TextField(
      key: const Key('set-margin'),
      controller: _margin,
      keyboardType: TextInputType.number,
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(labelText: 'settings.margin'.tr(), errorText: err('safetyMarginPct')),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('settings.parking_section'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 8),
        TextField(
          key: const Key('set-name'),
          controller: _name,
          decoration: InputDecoration(labelText: 'settings.name'.tr(), errorText: err('name')),
        ),
        const SizedBox(height: 10),
        TextField(
          key: const Key('set-address'),
          controller: _address,
          decoration: InputDecoration(labelText: 'settings.address'.tr(), errorText: err('address')),
        ),
        const SizedBox(height: 10),
        if (fromPlan) ...[
          _CapacityFromPlan(capacity: total, source: source),
          const SizedBox(height: 10),
          marginField,
        ] else
          Row(
            children: [
              Expanded(
                child: TextField(
                  key: const Key('set-capacity'),
                  controller: _capacity,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(labelText: 'settings.total_capacity'.tr(), errorText: err('totalCapacity')),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(child: marginField),
            ],
          ),
        const SizedBox(height: 4),
        Text('settings.margin_help'.tr(), style: AppText.muted(size: 12)),
        Text(
          'settings.bookable'.tr(args: ['${bookablePreview(total, margin)}']),
          key: const Key('set-bookable'),
          style: AppText.strong(size: 13, color: AppColors.accentDeep),
        ),
        const SizedBox(height: 10),
        TextField(
          key: const Key('set-shuttle'),
          controller: _shuttle,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'settings.shuttle_minutes'.tr(),
            helperText: 'settings.shuttle_help'.tr(),
            errorText: err('shuttleTravelMinutes'),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          key: const Key('set-lead'),
          controller: _lead,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'settings.terminal_lead'.tr(),
            helperText: 'settings.terminal_lead_help'.tr(),
            helperMaxLines: 3,
            errorText: err('terminalLeadMinutes'),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          key: const Key('set-delay'),
          controller: _delay,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'settings.landing_delay'.tr(),
            helperText: 'settings.landing_delay_help'.tr(),
            helperMaxLines: 3,
            errorText: err('landingDelayMinutes'),
          ),
        ),
        const SizedBox(height: 14),
        GradientButton(
          key: const Key('set-save'),
          label: 'settings.save'.tr(),
          busy: state.actionState.isProcessing,
          onPressed: () => bloc.add(
            ProSettingsParkingSaved(
              ParkingSettingsInput(
                name: _name.text.trim(),
                address: _address.text,
                totalCapacity: int.tryParse(_capacity.text) ?? 0,
                safetyMarginPct: int.tryParse(_margin.text) ?? 0,
                shuttleTravelMinutes: int.tryParse(_shuttle.text) ?? 0,
                terminalLeadMinutes: int.tryParse(_lead.text) ?? 120,
                landingDelayMinutes: int.tryParse(_delay.text) ?? 30,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text('settings.web_only'.tr(), style: AppText.muted(size: 12)),
      ],
    );
  }
}

/// The capacity taken from the plan (09/10/2026): read-only, with where it comes from and a way to the plan.
class _CapacityFromPlan extends StatelessWidget {
  const _CapacityFromPlan({required this.capacity, required this.source});
  final int capacity;
  final String source;

  @override
  Widget build(BuildContext context) => Container(
    key: const Key('set-capacity-plan'),
    width: double.infinity,
    padding: const EdgeInsets.all(12),
    decoration: const BoxDecoration(color: AppColors.tintSoft, borderRadius: AppRadius.chip),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('settings.total_capacity'.tr(), style: AppText.muted(size: 12)),
        const SizedBox(height: 2),
        Text(
          capacity == 1 ? 'settings.capacity_one'.tr() : 'settings.capacity_many'.tr(args: ['$capacity']),
          style: AppText.tabular(size: 20, color: AppColors.accent),
        ),
        const SizedBox(height: 4),
        Text('settings.capacity_from_plan'.tr(args: ['settings.capacity_source_$source'.tr()]), style: AppText.muted(size: 12.5)),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton(
            key: const Key('set-open-plan'),
            style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 36)),
            // The plan may change the figure (spots regenerated, files laid): reload on the way back.
            onPressed: () async {
              await context.router.push(const ProPlanRoute());
              if (context.mounted) context.read<ProSettingsBloc>().add(const ProSettingsStarted());
            },
            child: Text('settings.open_plan'.tr(), style: AppText.strong(size: 13.5, color: AppColors.accent)),
          ),
        ),
      ],
    ),
  );
}

/// R-B (07/10/2026): who sees the shuttles' position — nobody, the team, or the team and the travellers.
class _TrackingSection extends StatefulWidget {
  const _TrackingSection({required this.state});
  final ProSettingsState state;
  @override
  State<_TrackingSection> createState() => _TrackingSectionState();
}

class _TrackingSectionState extends State<_TrackingSection> {
  static const _levels = ['off', 'team', 'everyone'];

  /// Who sees what, per level: the team's live map, the travellers, "EN DIRECT" in the search results.
  static const _sees = {
    'off': (false, false, false),
    'team': (true, false, false),
    'everyone': (true, true, true),
  };

  late String _choice = widget.state.parking?.shuttleTracking ?? 'team';

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProSettingsBloc>();
    final saved = widget.state.parking?.shuttleTracking ?? 'team';
    final busy = widget.state.actionState.isProcessing;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('tracking.title'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 4),
        Text('tracking.intro'.tr(), style: AppText.muted(size: 12.5)),
        const SizedBox(height: 8),
        for (final level in _levels)
          RadioListTile<String>(
            key: Key('tracking-$level'),
            value: level,
            // ignore: deprecated_member_use
            groupValue: _choice,
            contentPadding: EdgeInsets.zero,
            activeColor: AppColors.accent,
            title: Row(
              children: [
                Flexible(child: Text('tracking.$level.title'.tr(), style: AppText.body(size: 14.5, weight: 600))),
                if (level == 'everyone') ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: const BoxDecoration(color: AppColors.action, borderRadius: AppRadius.pill),
                    child: Text('tracking.recommended'.tr(), style: AppText.label(size: 10, color: AppColors.onAccent)),
                  ),
                ],
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('tracking.$level.text'.tr(), style: AppText.muted(size: 12)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    _Sees(label: 'tracking.who_team'.tr(), yes: _sees[level]!.$1),
                    _Sees(label: 'tracking.who_clients'.tr(), yes: _sees[level]!.$2),
                    _Sees(label: 'tracking.who_mention'.tr(), yes: _sees[level]!.$3),
                  ],
                ),
              ],
            ),
            // ignore: deprecated_member_use
            onChanged: busy ? null : (v) => setState(() => _choice = v ?? saved),
          ),
        const SizedBox(height: 4),
        Text('tracking.always'.tr(), style: AppText.muted(size: 12)),
        const SizedBox(height: 10),
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton(
            key: const Key('tracking-save'),
            onPressed: busy || _choice == saved ? null : () => bloc.add(ProSettingsShuttleTrackingSaved(_choice)),
            child: Text('tracking.save'.tr()),
          ),
        ),
      ],
    );
  }
}

/// "Équipe ✓", "Clients ✕": who sees the position at this level.
class _Sees extends StatelessWidget {
  const _Sees({required this.label, required this.yes});
  final String label;
  final bool yes;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: yes ? AppStatus.okSoft : AppColors.panel2, borderRadius: AppRadius.pill),
    child: Text('$label ${yes ? '✓' : '✕'}', style: AppText.body(size: 11.5, weight: 600, color: yes ? AppStatus.okText : AppColors.muted)),
  );
}

class _SmsSection extends StatefulWidget {
  const _SmsSection({required this.state});
  final ProSettingsState state;
  @override
  State<_SmsSection> createState() => _SmsSectionState();
}

class _SmsSectionState extends State<_SmsSection> {
  late String _mode = widget.state.sms?.mode ?? 'none';
  late final _login = TextEditingController(text: widget.state.sms?.gateway?.login ?? '');
  final _password = TextEditingController();
  late final _sender = TextEditingController(text: widget.state.sms?.gateway?.senderPhone ?? '');
  final _testTo = TextEditingController();

  @override
  void dispose() {
    for (final c in [_login, _password, _sender, _testTo]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProSettingsBloc>();
    final state = widget.state;
    final sms = state.sms;
    final status = state.smsStatus;
    final busy = state.actionState.isProcessing;
    String? err(String f) => state.fieldErrors[f] == null ? null : translateErrorCode(state.fieldErrors[f]);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('sms.title'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 4),
        Text('sms.intro'.tr(), style: AppText.muted(size: 12.5)),
        const SizedBox(height: 8),
        if (status != null && sms?.mode != 'none')
          Container(
            key: const Key('sms-status'),
            padding: const EdgeInsets.all(10),
            decoration: const BoxDecoration(color: AppColors.tintSoft, borderRadius: AppRadius.chip),
            child: Text(
              [
                if (sms?.mode == 'gateway') 'sms.linked_phone'.tr(args: [status.senderPhone ?? '']),
                'sms.month'.tr(args: ['${status.month.sent}', '${status.month.failed}']),
                if (status.pending > 0) 'sms.pending'.tr(args: ['${status.pending}']),
                if (status.pendingStale) 'sms.pending_stale'.tr(),
                if (status.lastError != null) 'sms.last_error'.tr(args: [translateErrorCode(status.lastError)]),
              ].join(' · '),
              style: AppText.body(size: 13),
            ),
          ),
        const SizedBox(height: 8),
        for (final m in ['gateway', 'brevo', 'none'])
          RadioListTile<String>(
            key: Key('sms-mode-$m'),
            value: m,
            // ignore: deprecated_member_use
            groupValue: _mode,
            contentPadding: EdgeInsets.zero,
            activeColor: AppColors.accent,
            title: Text('sms.mode.$m.title'.tr(args: [Product.name]), style: AppText.body(size: 14.5, weight: 600)),
            subtitle: Text(
              m == 'brevo' && sms?.brevoAvailable == false ? 'sms.brevo_unavailable'.tr(args: [Product.name]) : 'sms.mode.$m.text'.tr(),
              style: AppText.muted(size: 12),
            ),
            // ignore: deprecated_member_use
            onChanged: busy || (m == 'brevo' && sms?.brevoAvailable == false) ? null : (v) => setState(() => _mode = v ?? 'none'),
          ),
        if (_mode == 'gateway') ...[
          Text('sms.steps'.tr(), style: AppText.muted(size: 12.5)),
          const SizedBox(height: 8),
          TextField(
            key: const Key('sms-login'),
            controller: _login,
            decoration: InputDecoration(labelText: 'sms.login'.tr(), hintText: 'AB12CD', errorText: err('login')),
          ),
          const SizedBox(height: 10),
          TextField(
            key: const Key('sms-password'),
            controller: _password,
            obscureText: true,
            decoration: InputDecoration(
              labelText: 'sms.password'.tr(),
              helperText: sms?.gateway != null ? 'sms.password_kept'.tr() : null,
              errorText: err('password'),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            key: const Key('sms-sender'),
            controller: _sender,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: 'sms.sender_phone'.tr(), hintText: '+33 6 …', errorText: err('senderPhone')),
          ),
          const SizedBox(height: 10),
          TextField(
            key: const Key('sms-test-to'),
            controller: _testTo,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: 'sms.test_to'.tr(), hintText: '+33 6 …', errorText: err('to')),
          ),
          const SizedBox(height: 12),
        ],
        Row(
          children: [
            Expanded(
              child: GradientButton(
                key: const Key('sms-save'),
                label: _mode == 'gateway' ? 'sms.link'.tr() : 'sms.save'.tr(),
                busy: busy,
                onPressed: () => bloc.add(
                  ProSettingsSmsSaved(
                    SmsSettingsInput(mode: _mode, login: _login.text.trim(), password: _password.text, senderPhone: _sender.text.trim()),
                    testTo: _testTo.text.trim().isEmpty ? null : _testTo.text.trim(),
                  ),
                ),
              ),
            ),
            if (sms?.mode == 'gateway') ...[
              const SizedBox(width: 8),
              Expanded(
                child: OutlineAction(
                  key: const Key('sms-test'),
                  label: 'sms.send_test'.tr(),
                  onPressed: busy || _testTo.text.trim().isEmpty ? null : () => bloc.add(ProSettingsSmsTested(_testTo.text.trim())),
                ),
              ),
            ],
          ],
        ),
        if (sms != null && sms.mode != 'none') ...[
          const SizedBox(height: 8),
          TextButton(
            key: const Key('sms-disable'),
            onPressed: busy ? null : () => bloc.add(const ProSettingsSmsDisabled()),
            child: Text('sms.disable'.tr(), style: AppText.strong(size: 13.5, color: AppColors.danger)),
          ),
        ],
        const SizedBox(height: 6),
        Text('sms.footnote'.tr(args: [Product.name]), style: AppText.muted(size: 11.5)),
      ],
    );
  }
}
