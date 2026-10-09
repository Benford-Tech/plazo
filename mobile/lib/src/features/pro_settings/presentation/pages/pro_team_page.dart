import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/names.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../data/models/settings_models.dart';
import '../../domain/usecases/settings_use_cases.dart';
import '../bloc/pro_team_bloc.dart';

const _roles = ['manager', 'agent', 'driver', 'valet'];

/// The team (managers): members, their role and access, temporary passwords.
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
        final text = state.errorCode != null ? translateErrorCode(state.errorCode) : state.notice?.tr();
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
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                  children: [
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
        );
      },
    );
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
