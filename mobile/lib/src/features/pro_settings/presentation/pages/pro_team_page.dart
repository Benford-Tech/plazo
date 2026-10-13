import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/names.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../services/share_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/sign_in_widgets.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../data/models/settings_models.dart';
import '../../domain/usecases/settings_use_cases.dart';
import '../bloc/pro_team_bloc.dart';

const _roles = ['manager', 'agent', 'driver', 'valet'];

/// The roles a request can be accepted with (never manager: a manager promotes afterwards).
const _joinRoles = ['agent', 'driver', 'valet'];

/// The team (managers): members, their role and access, temporary passwords. 13/10/2026 (mockup 4): the « Code du
/// jour » card on top (Copier, Partager), the requests to join just under it (Refuser, Accepter with a role), and
/// how each member signs in.
@RoutePage()
class ProTeamPage extends StatelessWidget implements AutoRouteWrapper {
  const ProTeamPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProTeamBloc>()..add(const ProTeamStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    final me = context.watch<ProAuthBloc>().state.staff?.id;
    return BlocConsumer<ProTeamBloc, ProTeamState>(
      listenWhen: (a, b) => a.errorCode != b.errorCode || a.notice != b.notice,
      listener: (context, state) {
        final text = state.errorCode != null ? translateErrorCode(state.errorCode) : state.notice?.tr(args: [state.noticeArg ?? '']);
        if (text != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
          context.read<ProTeamBloc>().add(const ProTeamNoticeShown());
        }
      },
      builder: (context, state) {
        final bloc = context.read<ProTeamBloc>();
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: 'team.title'.tr()),
          floatingActionButton: FloatingActionButton.extended(
            key: const Key('team-add'),
            backgroundColor: AppColors.action,
            foregroundColor: AppColors.onAccent,
            icon: const Icon(Icons.person_add_alt_1_rounded),
            label: Text('team.add'.tr()),
            onPressed: () => _showNewMember(context),
          ),
          body: state.viewState.isProcessing && state.members.isEmpty
              ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
              : state.viewState.isError && state.members.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center),
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.accent,
                  onRefresh: () async {
                    bloc.add(const ProTeamStarted());
                    await bloc.stream.firstWhere((s) => !s.viewState.isProcessing).timeout(const Duration(seconds: 20), onTimeout: () => bloc.state);
                  },
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                    children: [
                      if (state.joinCode != null) ...[_JoinCodeCard(code: state.joinCode!), const SizedBox(height: 10)],
                      if (state.joinRequests.isNotEmpty) ...[
                        _JoinRequestsCard(
                          requests: state.joinRequests,
                          busyId: state.joinBusyId,
                          onAccept: (r) => _accept(context, r),
                          onRefuse: (r) => _refuse(context, r),
                        ),
                        const SizedBox(height: 10),
                      ],
                      for (final m in state.members)
                        _MemberTile(
                          member: m,
                          isMe: m.id == me,
                          busy: state.actionState.isProcessing,
                          onRole: (role) => bloc.add(ProTeamMemberUpdated(UpdateStaffParams(id: m.id, role: role))),
                          onActive: (v) => bloc.add(ProTeamMemberUpdated(UpdateStaffParams(id: m.id, isActive: v))),
                          onReset: () => _showReset(context, m),
                        ),
                    ],
                  ),
                ),
        );
      },
    );
  }

  /// « Accepter… »: the role sheet, preset to the post asked for.
  Future<void> _accept(BuildContext context, PendingJoinRequestModel request) async {
    final bloc = context.read<ProTeamBloc>();
    final role = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _AcceptSheet(request: request),
    );
    if (role != null) bloc.add(ProTeamJoinAccepted(id: request.id, role: role));
  }

  /// « Refuser », after a question (the person can ask again with a new code).
  Future<void> _refuse(BuildContext context, PendingJoinRequestModel request) async {
    final bloc = context.read<ProTeamBloc>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('team.refuse_title'.tr(args: [request.name])),
        content: Text('team.refuse_text'.tr()),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text('team.cancel'.tr())),
          TextButton(
            key: const Key('join-refuse-confirm'),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('team.refuse'.tr()),
          ),
        ],
      ),
    );
    if (ok == true) bloc.add(ProTeamJoinRefused(request.id));
  }

  Future<void> _showNewMember(BuildContext context) {
    final bloc = context.read<ProTeamBloc>()..add(const ProTeamNoticeShown());
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheet) => BlocProvider.value(value: bloc, child: const _NewMemberSheet()),
    );
  }

  Future<void> _showReset(BuildContext context, TeamMemberModel m) {
    final bloc = context.read<ProTeamBloc>();
    final controller = TextEditingController();
    return showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('team.reset_password'.tr()),
        content: TextField(
          key: const Key('team-reset-password'),
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(labelText: 'team.password'.tr(), helperText: 'team.password_help'.tr(), helperMaxLines: 3),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: Text('common.back'.tr())),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              bloc.add(ProTeamPasswordReset(ResetPasswordParams(id: m.id, password: controller.text)));
            },
            child: Text('common.confirm'.tr()),
          ),
        ],
      ),
    );
  }
}

class _MemberTile extends StatefulWidget {
  const _MemberTile({required this.member, required this.isMe, required this.busy, required this.onRole, required this.onActive, required this.onReset});
  final TeamMemberModel member;
  final bool isMe;
  final bool busy;
  final ValueChanged<String> onRole;
  final ValueChanged<bool> onActive;
  final VoidCallback onReset;

  @override
  State<_MemberTile> createState() => _MemberTileState();
}

class _MemberTileState extends State<_MemberTile> {
  /// « Modifier le nom » (09/10/2026): the inline form is open.
  bool _renaming = false;

  @override
  Widget build(BuildContext context) {
    final m = widget.member;
    final isMe = widget.isMe;
    final busy = widget.busy;
    return Container(
      key: Key('member-${m.id}'),
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: m.isActive ? AppColors.line : AppColors.canvas),
        borderRadius: AppRadius.chip,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  isMe ? '${m.name} · ${'team.you'.tr()}' : m.name,
                  style: AppText.strong(size: 15, color: m.isActive ? AppColors.ink : AppColors.muted),
                ),
              ),
              if (!m.isActive) Text('team.inactive'.tr(), style: AppText.label(size: 11, color: AppColors.danger)),
              if (m.isActive && m.post != null && m.post != m.role)
                Text('team.post_today'.tr(args: ['post.name.${m.post}'.tr()]), key: Key('post-${m.id}'), style: AppText.label(size: 11, color: AppColors.accent)),
            ],
          ),
          Text([m.email, if (m.phone != null) formatPhone(m.phone!)].join(' · '), style: AppText.muted(size: 12.5)),
          if (m.signIn.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 2),
              child: Wrap(spacing: 4, runSpacing: 4, children: [for (final method in m.signIn) SignInBadge(method)]),
            ),
          Text(
            m.lastLoginAt == null
                ? 'team.never_logged'.tr()
                : 'team.last_login'.tr(args: ['${DateFormat('EEE d MMM', 'fr_FR').format(m.lastLoginAt!.toLocal())} ${hhmm(m.lastLoginAt!)}']),
            style: AppText.muted(size: 12),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  key: Key('role-${m.id}'),
                  initialValue: m.role,
                  decoration: InputDecoration(
                    labelText: 'team.role'.tr(),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  items: [for (final r in _roles) DropdownMenuItem(value: r, child: Text('pro_more.role.$r'.tr()))],
                  onChanged: busy || isMe ? null : (v) => v == null || v == m.role ? null : widget.onRole(v),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                key: Key('reset-${m.id}'),
                tooltip: 'team.reset_password'.tr(),
                icon: const Icon(Icons.key_rounded, color: AppColors.accent),
                onPressed: busy ? null : widget.onReset,
              ),
              if (!isMe) Switch(key: Key('active-${m.id}'), value: m.isActive, activeTrackColor: AppColors.accent, onChanged: busy ? null : widget.onActive),
            ],
          ),
          if (_renaming)
            _RenameForm(member: m, onDone: () => setState(() => _renaming = false))
          else
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                key: Key('rename-${m.id}'),
                style: TextButton.styleFrom(foregroundColor: AppColors.accent, padding: const EdgeInsets.symmetric(horizontal: 4)),
                icon: const Icon(Icons.edit_rounded, size: 18),
                label: Text('team.rename'.tr()),
                onPressed: busy ? null : () => setState(() => _renaming = true),
              ),
            ),
        ],
      ),
    );
  }
}

/// « Modifier le nom » (09/10/2026): a manager corrects a member's first and last name, inline.
class _RenameForm extends StatefulWidget {
  const _RenameForm({required this.member, required this.onDone});
  final TeamMemberModel member;
  final VoidCallback onDone;

  @override
  State<_RenameForm> createState() => _RenameFormState();
}

class _RenameFormState extends State<_RenameForm> {
  late final TextEditingController _firstName, _lastName;

  /// The names this form sent, null before: the bloc's field errors are then its own, and it closes once the member
  /// carries them (another member's update does not close it).
  NameParts? _sent;

  @override
  void initState() {
    super.initState();
    final m = widget.member;
    final name = nameParts(m.firstName, m.lastName, m.name);
    _firstName = TextEditingController(text: name.firstName);
    _lastName = TextEditingController(text: name.lastName);
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    super.dispose();
  }

  void _cancel() {
    if (_sent != null) context.read<ProTeamBloc>().add(const ProTeamNoticeShown());
    widget.onDone();
  }

  static String _clean(String v) => v.trim().replaceAll(RegExp(r'\s+'), ' ');

  bool _saved(ProTeamState state) {
    final sent = _sent;
    final m = state.members.where((x) => x.id == widget.member.id).firstOrNull;
    return sent != null && m != null && m.firstName == _clean(sent.firstName) && m.lastName == _clean(sent.lastName);
  }

  @override
  Widget build(BuildContext context) {
    final id = widget.member.id;
    return BlocConsumer<ProTeamBloc, ProTeamState>(
      listenWhen: (a, b) => _sent != null && a.actionState != b.actionState,
      listener: (context, state) {
        if (state.actionState.isSuccess && _saved(state)) widget.onDone();
      },
      builder: (context, state) {
        String? err(String f) => _sent == null || state.fieldErrors[f] == null ? null : translateErrorCode(state.fieldErrors[f]);
        final busy = state.actionState.isProcessing;
        return Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('team.rename_title'.tr(args: [widget.member.name]), style: AppText.strong(size: 14)),
              const SizedBox(height: 8),
              TextField(
                key: Key('rename-first-$id'),
                controller: _firstName,
                textCapitalization: TextCapitalization.words,
                maxLength: 60,
                decoration: InputDecoration(labelText: 'team.first_name'.tr(), errorText: err('firstName'), counterText: '', isDense: true),
              ),
              const SizedBox(height: 8),
              TextField(
                key: Key('rename-last-$id'),
                controller: _lastName,
                textCapitalization: TextCapitalization.words,
                maxLength: 60,
                decoration: InputDecoration(labelText: 'team.last_name'.tr(), errorText: err('lastName'), counterText: '', isDense: true),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: GradientButton(
                      key: Key('rename-save-$id'),
                      label: 'team.save'.tr(),
                      busy: busy && _sent != null,
                      onPressed: busy
                          ? null
                          : () {
                              final names = (firstName: _firstName.text.trim(), lastName: _lastName.text.trim());
                              setState(() => _sent = names);
                              context.read<ProTeamBloc>().add(ProTeamMemberUpdated(UpdateStaffParams(id: id, firstName: names.firstName, lastName: names.lastName)));
                            },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton(
                      key: Key('rename-cancel-$id'),
                      onPressed: busy ? null : _cancel,
                      child: Text('team.cancel'.tr()),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _NewMemberSheet extends StatefulWidget {
  const _NewMemberSheet();
  @override
  State<_NewMemberSheet> createState() => _NewMemberSheetState();
}

class _NewMemberSheetState extends State<_NewMemberSheet> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  String _role = 'agent';

  @override
  void dispose() {
    for (final c in [_firstName, _lastName, _email, _phone, _password]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProTeamBloc, ProTeamState>(
      listenWhen: (a, b) => a.notice != b.notice && b.notice == 'team.created',
      listener: (context, state) => Navigator.of(context).pop(),
      builder: (context, state) {
        final bloc = context.read<ProTeamBloc>();
        String? err(String f) => state.fieldErrors[f] == null ? null : translateErrorCode(state.fieldErrors[f]);
        return Padding(
          padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.viewInsetsOf(context).bottom + 16),
          child: ListView(
            shrinkWrap: true,
            children: [
              Text('team.add'.tr(), style: AppText.title(size: 20)),
              const SizedBox(height: 12),
              TextField(
                key: const Key('new-first-name'),
                controller: _firstName,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(labelText: 'team.first_name'.tr(), errorText: err('firstName')),
              ),
              const SizedBox(height: 10),
              TextField(
                key: const Key('new-last-name'),
                controller: _lastName,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(labelText: 'team.last_name'.tr(), errorText: err('lastName')),
              ),
              const SizedBox(height: 10),
              TextField(
                key: const Key('new-email'),
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(labelText: 'team.email'.tr(), errorText: err('email')),
              ),
              const SizedBox(height: 10),
              TextField(
                key: const Key('new-phone'),
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(labelText: 'team.phone_optional'.tr(), errorText: err('phone')),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                key: const Key('new-role'),
                initialValue: _role,
                decoration: InputDecoration(labelText: 'team.role'.tr()),
                items: [for (final r in _roles) DropdownMenuItem(value: r, child: Text('pro_more.role.$r'.tr()))],
                onChanged: (v) => setState(() => _role = v ?? 'agent'),
              ),
              const SizedBox(height: 10),
              TextField(
                key: const Key('new-password'),
                controller: _password,
                decoration: InputDecoration(
                  labelText: 'team.password'.tr(),
                  helperText: 'team.password_help'.tr(),
                  helperMaxLines: 3,
                  errorText: err('password'),
                ),
              ),
              const SizedBox(height: 16),
              GradientButton(
                key: const Key('new-create'),
                label: 'team.create'.tr(),
                busy: state.actionState.isProcessing,
                onPressed: () => bloc.add(
                  ProTeamMemberCreated(
                    NewStaffParams(firstName: _firstName.text.trim(), lastName: _lastName.text.trim(), email: _email.text.trim(), phone: _phone.text, role: _role, password: _password.text),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// « Code du jour » (13/10/2026, mockup 4): the big code, until midnight, « Copier » and « Partager » (the phone's
/// share sheet, with the same ready-made message as the web's).
class _JoinCodeCard extends StatelessWidget {
  const _JoinCodeCard({required this.code});
  final JoinCodeModel code;

  String get _message => 'team.join_message'.tr(args: [code.operatorName, Product.proName, code.code]);

  @override
  Widget build(BuildContext context) {
    return Container(
      key: const Key('join-code-card'),
      padding: const EdgeInsets.fromLTRB(13, 12, 13, 13),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.action, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'team.code_title'.tr().toUpperCase(),
                  style: AppText.tabular(size: 11.5, weight: 500, color: AppColors.accentDeep).copyWith(letterSpacing: 0.7),
                ),
              ),
              Text('team.code_until'.tr(), style: AppText.muted(size: 12)),
            ],
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SelectableText(
              code.code,
              key: const Key('join-code-value'),
              textAlign: TextAlign.center,
              style: AppText.tabular(size: 28).copyWith(letterSpacing: 1.4),
            ),
          ),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  key: const Key('join-code-copy'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.ink,
                    side: const BorderSide(color: AppColors.line),
                    shape: const StadiumBorder(),
                    minimumSize: const Size.fromHeight(40),
                  ),
                  icon: const Icon(Icons.copy_rounded, size: 17),
                  label: Text('team.code_copy'.tr()),
                  onPressed: () async {
                    await Clipboard.setData(ClipboardData(text: code.code));
                    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('team.code_copied'.tr())));
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton.icon(
                  key: const Key('join-code-share'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.action,
                    foregroundColor: AppColors.onAccent,
                    shape: const StadiumBorder(),
                    minimumSize: const Size.fromHeight(40),
                  ),
                  icon: const Icon(Icons.ios_share_rounded, size: 17),
                  label: Text('team.code_share'.tr()),
                  onPressed: () =>
                      locator<ShareService>().shareText(_message, subject: 'team.code_share_subject'.tr(args: [code.operatorName, Product.proName])),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('team.code_help'.tr(), style: AppText.muted(size: 12.5)),
        ],
      ),
    );
  }
}

/// « il y a 3 min », « il y a 2 h », « il y a 3 j ».
String _ago(DateTime at) {
  final d = DateTime.now().difference(at);
  if (d.inMinutes < 1) return 'team.ago_now'.tr();
  if (d.inMinutes < 60) return 'team.ago_min'.tr(args: ['${d.inMinutes}']);
  if (d.inHours < 24) return 'team.ago_h'.tr(args: ['${d.inHours}']);
  return 'team.ago_d'.tr(args: ['${d.inDays}']);
}

/// « Demandes · N à valider »: who asks, with which post, since when, through Apple or Google; Refuser / Accepter.
class _JoinRequestsCard extends StatelessWidget {
  const _JoinRequestsCard({required this.requests, required this.busyId, required this.onAccept, required this.onRefuse});
  final List<PendingJoinRequestModel> requests;
  final String? busyId;
  final ValueChanged<PendingJoinRequestModel> onAccept;
  final ValueChanged<PendingJoinRequestModel> onRefuse;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: const Key('join-requests'),
      padding: const EdgeInsets.fromLTRB(13, 12, 13, 13),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: Text('team.requests_title'.tr().toUpperCase(), style: AppText.label(size: 11))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: const BoxDecoration(color: AppStatus.warnSoft, borderRadius: AppRadius.pill),
                child: Text(
                  'team.requests_count'.tr(args: ['${requests.length}']),
                  style: AppText.strong(size: 11.5, color: AppStatus.warnText),
                ),
              ),
            ],
          ),
          for (final (i, r) in requests.indexed)
            Container(
              key: Key('join-request-${r.id}'),
              padding: const EdgeInsets.only(top: 10, bottom: 2),
              decoration: BoxDecoration(
                border: i == 0 ? null : const Border(top: BorderSide(color: AppColors.line)),
              ),
              margin: EdgeInsets.only(top: i == 0 ? 2 : 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: AppColors.tint,
                        child: Text(r.initials, style: AppText.strong(size: 12, color: AppColors.accent)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(r.name, style: AppText.strong(size: 14.5)),
                            Text(['post.name.${r.wishedRole}'.tr(), _ago(r.createdAt)].join(' · '), style: AppText.muted(size: 12.5)),
                            if ((r.email ?? '').isNotEmpty) Text(r.email!, style: AppText.muted(size: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                      SignInBadge(r.provider),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          key: Key('join-refuse-${r.id}'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.ink,
                            side: const BorderSide(color: AppColors.line),
                            shape: const StadiumBorder(),
                            minimumSize: const Size.fromHeight(38),
                          ),
                          onPressed: busyId != null ? null : () => onRefuse(r),
                          child: Text('team.refuse'.tr()),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: FilledButton(
                          key: Key('join-accept-${r.id}'),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.action,
                            foregroundColor: AppColors.onAccent,
                            shape: const StadiumBorder(),
                            minimumSize: const Size.fromHeight(38),
                          ),
                          onPressed: busyId != null ? null : () => onAccept(r),
                          child: busyId == r.id
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: AppColors.onAccent))
                              : Text('team.accept'.tr()),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// « Accepter Julie Martin »: the role (Accueil, Chauffeur, Voiturier), preset to the post asked for; the role can be
/// changed afterwards in Équipe, as for anyone.
class _AcceptSheet extends StatefulWidget {
  const _AcceptSheet({required this.request});
  final PendingJoinRequestModel request;

  @override
  State<_AcceptSheet> createState() => _AcceptSheetState();
}

class _AcceptSheetState extends State<_AcceptSheet> {
  late String _role = _joinRoles.contains(widget.request.wishedRole) ? widget.request.wishedRole : 'agent';

  static const _icons = {'agent': Icons.support_agent_rounded, 'driver': Icons.directions_bus_rounded, 'valet': Icons.key_rounded};

  @override
  Widget build(BuildContext context) {
    final r = widget.request;
    final sub = [
      if ((r.email ?? '').isNotEmpty) r.email!,
      'team.request_sent_at'.tr(args: [hhmm(r.createdAt)]),
    ].join(' · ');
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.viewInsetsOf(context).bottom + 20),
      child: ListView(
        shrinkWrap: true,
        children: [
          Semantics(
            header: true,
            child: Text('team.accept_title'.tr(args: [r.name]), style: AppText.title(size: 22)),
          ),
          Text(sub, style: AppText.muted(size: 12.5)),
          const SizedBox(height: 12),
          Text('team.accept_role'.tr().toUpperCase(), style: AppText.label(size: 11)),
          const SizedBox(height: 8),
          for (final role in _joinRoles) ...[
            _RoleOption(role: role, icon: _icons[role]!, selected: _role == role, onTap: () => setState(() => _role = role)),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 4),
          GradientButton(
            key: const Key('join-accept-confirm'),
            label: 'team.accept_as'.tr(args: ['post.name.$_role'.tr().toLowerCase()]),
            onPressed: () => Navigator.of(context).pop(_role),
          ),
        ],
      ),
    );
  }
}

class _RoleOption extends StatelessWidget {
  const _RoleOption({required this.role, required this.icon, required this.selected, required this.onTap});
  final String role;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.field,
        side: BorderSide(color: selected ? AppColors.accent : AppColors.line, width: selected ? 1.5 : 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        key: Key('join-role-$role'),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(color: selected ? AppColors.accent : AppColors.tint, borderRadius: AppRadius.small),
                child: Icon(icon, size: 18, color: selected ? Colors.white : AppColors.accent),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('post.name.$role'.tr(), style: AppText.title(size: 16)),
                    Text('team.role_text.$role'.tr(), style: AppText.muted(size: 12)),
                  ],
                ),
              ),
              Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded, color: selected ? AppColors.accent : AppColors.line),
            ],
          ),
        ),
      ),
    );
  }
}
