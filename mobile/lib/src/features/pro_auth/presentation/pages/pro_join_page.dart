import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/join_code.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../bloc/pro_auth_bloc.dart';
import '../bloc/pro_join_bloc.dart';
import '../widgets/delete_account_sheet.dart';

/// The posts a person can ask for (« Je suis »): never manager, a manager promotes afterwards.
const joinPosts = ['agent', 'driver', 'valet'];

/// « Rejoindre un parking » (13/10/2026, mockups 2 and 3): after Apple or Google, the code du jour (variant A, one
/// field, the dash added by itself), the name and the post asked for, then « Demande envoyée » until a manager
/// accepts (asked every 10 s while the app is in front), « Demande refusée » with « Taper un nouveau code ».
@RoutePage()
class ProJoinPage extends StatefulWidget implements AutoRouteWrapper {
  const ProJoinPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<ProJoinBloc>()..add(ProJoinStarted(context.read<ProAuthBloc>().state.onboarding)), child: this);

  @override
  State<ProJoinPage> createState() => _ProJoinPageState();
}

class _ProJoinPageState extends State<ProJoinPage> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState lifecycle) {
    final bloc = context.read<ProJoinBloc>();
    if (lifecycle == AppLifecycleState.resumed) {
      bloc.add(const ProJoinResumed());
    } else if (lifecycle == AppLifecycleState.paused || lifecycle == AppLifecycleState.hidden) {
      bloc.add(const ProJoinPaused());
    }
  }

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<ProAuthBloc, ProAuthState>(
          listenWhen: (a, b) => a.status != b.status || a.deleteState != b.deleteState,
          listener: (context, auth) {
            if (auth.deleteState.isError && auth.errorCode != null) {
              _toast(translateErrorCode(auth.errorCode));
              context.read<ProAuthBloc>().add(const ProAuthAccountNoticeShown());
            }
            if (auth.status == ProAuthStatus.signedIn) {
              // A new member chooses the post of the day first, then (a driver) the vehicle, as after any sign-in.
              context.router.replaceAll([if (auth.staff?.post == null) const ProPostRoute() else const ProShellRoute()]);
            } else if (auth.status == ProAuthStatus.signedOut) {
              if (auth.deleteState.isSuccess) {
                _toast('join.deleted'.tr());
                context.read<ProAuthBloc>().add(const ProAuthAccountNoticeShown());
              }
              context.router.replaceAll([const ProLoginRoute()]);
            }
          },
        ),
        BlocListener<ProJoinBloc, ProJoinState>(
          listenWhen: (a, b) => a.session != b.session || (a.cancelState != b.cancelState && b.cancelState.isError),
          listener: (context, state) {
            final session = state.session;
            if (session != null) {
              context.read<ProAuthBloc>().add(ProAuthJoined(session));
            } else if (state.cancelState.isError) {
              _toast(translateErrorCode(state.errorCode));
              context.read<ProJoinBloc>().add(const ProJoinErrorShown());
            }
          },
        ),
      ],
      child: BlocBuilder<ProJoinBloc, ProJoinState>(
        builder: (context, state) => switch (state.view) {
          ProJoinView.form => _JoinForm(state: state),
          ProJoinView.waiting => _Waiting(state: state),
          ProJoinView.closed => _Closed(state: state),
          ProJoinView.accepted => _Accepted(state: state),
        },
      ),
    );
  }
}

String _providerName(String? provider) => provider == null ? '' : 'sign_in.$provider'.tr();

/// « Utiliser un autre compte »: ends the onboarding session, back to the login.
class _OtherAccountLink extends StatelessWidget {
  const _OtherAccountLink();

  @override
  Widget build(BuildContext context) {
    return TextButton(
      key: const Key('join-other-account'),
      style: TextButton.styleFrom(foregroundColor: AppColors.accent),
      onPressed: () => context.read<ProAuthBloc>().add(const ProAuthLogoutRequested()),
      child: Text('join.other_account'.tr(), style: AppText.strong(size: 14, color: AppColors.accent)),
    );
  }
}

class _JoinForm extends StatefulWidget {
  const _JoinForm({required this.state});
  final ProJoinState state;

  @override
  State<_JoinForm> createState() => _JoinFormState();
}

class _JoinFormState extends State<_JoinForm> {
  final _code = TextEditingController();
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  String? _post;

  @override
  void initState() {
    super.initState();
    final identity = widget.state.identity;
    final request = widget.state.request;
    // Apple or Google gave the name (Apple only the first time): prefilled, asked when missing.
    _firstName = TextEditingController(text: (request?.firstName ?? '').isNotEmpty ? request!.firstName : identity?.firstName ?? '');
    _lastName = TextEditingController(text: (request?.lastName ?? '').isNotEmpty ? request!.lastName : identity?.lastName ?? '');
    _post = request?.wishedRole;
  }

  @override
  void dispose() {
    for (final c in [_code, _firstName, _lastName]) {
      c.dispose();
    }
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    context.read<ProJoinBloc>().add(ProJoinSubmitted(code: _code.text, firstName: _firstName.text, lastName: _lastName.text, wishedRole: _post));
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final identity = state.identity;
    String? field(String f) => state.fieldErrors[f] == null ? null : translateErrorCode(state.fieldErrors[f]);
    final codeError = state.codeError == null ? null : _generalError(state.codeError!);
    final general = state.errorCode == null ? null : _generalError(state.errorCode!);
    final connected = identity == null
        ? null
        : [
            'join.connected_with'.tr(args: [_providerName(identity.provider)]),
            if ((identity.email ?? '').isNotEmpty) identity.email!,
          ].join(' · ');
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: 'join.title'.tr(), subtitle: connected, leading: const SizedBox.shrink()),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
          children: [
            _Card(
              children: [
                _Label('join.code_label'.tr()),
                const SizedBox(height: 8),
                TextField(
                  key: const Key('join-code'),
                  controller: _code,
                  textAlign: TextAlign.center,
                  autocorrect: false,
                  enableSuggestions: false,
                  textCapitalization: TextCapitalization.characters,
                  keyboardType: TextInputType.visiblePassword,
                  inputFormatters: const [JoinCodeFormatter()],
                  style: AppText.tabular(size: 24).copyWith(letterSpacing: 1.6),
                  decoration: InputDecoration(
                    hintText: 'join.code_hint'.tr(),
                    hintStyle: AppText.tabular(size: 24, weight: 500, color: AppColors.line).copyWith(letterSpacing: 1.6),
                    contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: AppRadius.field,
                      borderSide: BorderSide(color: codeError != null ? AppColors.danger : AppColors.accent, width: 1.5),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: AppRadius.field,
                      borderSide: BorderSide(color: codeError != null ? AppColors.danger : AppColors.accent, width: 2),
                    ),
                  ),
                  onSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: 8),
                if (codeError != null)
                  Text(
                    codeError,
                    key: const Key('join-code-error'),
                    style: AppText.body(size: 13, color: AppColors.danger),
                  )
                else
                  Text('join.code_help'.tr(), style: AppText.muted(size: 12.5)),
              ],
            ),
            const SizedBox(height: 10),
            _Card(
              children: [
                _Label('join.you'.tr()),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: TextField(
                        key: const Key('join-first-name'),
                        controller: _firstName,
                        textCapitalization: TextCapitalization.words,
                        autofillHints: const [AutofillHints.givenName],
                        maxLength: 60,
                        decoration: InputDecoration(labelText: 'account.first_name'.tr(), errorText: field('firstName'), counterText: '', isDense: true),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        key: const Key('join-last-name'),
                        controller: _lastName,
                        textCapitalization: TextCapitalization.words,
                        autofillHints: const [AutofillHints.familyName],
                        maxLength: 60,
                        decoration: InputDecoration(labelText: 'account.last_name'.tr(), errorText: field('lastName'), counterText: '', isDense: true),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _Label('join.i_am'.tr()),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final p in joinPosts)
                      ChoiceChip(
                        key: Key('join-post-$p'),
                        label: Text('post.name.$p'.tr()),
                        selected: _post == p,
                        showCheckmark: false,
                        selectedColor: AppColors.action,
                        backgroundColor: AppColors.surface,
                        side: BorderSide(color: _post == p ? AppColors.action : AppColors.line),
                        shape: const StadiumBorder(),
                        labelStyle: AppText.strong(size: 13, color: _post == p ? AppColors.onAccent : AppColors.ink),
                        onSelected: (_) => setState(() => _post = p),
                      ),
                  ],
                ),
                if (field('wishedRole') != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    field('wishedRole')!,
                    key: const Key('join-post-error'),
                    style: AppText.body(size: 13, color: AppColors.danger),
                  ),
                ],
              ],
            ),
            if (general != null) ...[
              const SizedBox(height: 12),
              Text(
                general,
                key: const Key('join-error'),
                style: AppText.body(size: 14, color: AppColors.danger),
              ),
            ],
            const SizedBox(height: 14),
            GradientButton(key: const Key('join-submit'), label: 'join.submit'.tr(), busy: state.submitState.isProcessing, onPressed: _submit),
            const SizedBox(height: 6),
            const Center(child: _OtherAccountLink()),
          ],
        ),
      ),
    );
  }
}

/// The page's own text of an API code (join.errors.*), else the app's (errors.*).
String _generalError(String code) {
  final own = 'join.errors.$code';
  final text = own.tr();
  return text == own ? translateErrorCode(code) : text;
}

class _Card extends StatelessWidget {
  const _Card({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(13, 12, 13, 13),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.line),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(text.toUpperCase(), style: AppText.label(size: 11));
}

/// The centred layout of the waiting, refused and accepted screens: a tile, a title, a text.
class _Centered extends StatelessWidget {
  const _Centered({super.key, required this.icon, required this.title, required this.text, this.danger = false, required this.children});
  final IconData icon;
  final String title;
  final InlineSpan text;
  final bool danger;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 28),
            children: [
              Center(
                child: Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(color: danger ? AppStatus.badSoft : AppColors.tint, borderRadius: AppRadius.card),
                  child: Icon(icon, size: 28, color: danger ? AppStatus.bad : AppColors.accent),
                ),
              ),
              const SizedBox(height: 12),
              Semantics(
                header: true,
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  style: AppText.title(size: 26, color: danger ? AppColors.ink : AppColors.accent),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 320),
                  child: Text.rich(text, textAlign: TextAlign.center, style: AppText.muted(size: 14.5)),
                ),
              ),
              const SizedBox(height: 18),
              ...children,
            ],
          ),
        ),
      ),
    );
  }
}

/// « … pour **Parkair Lyon**. … »: the parking's name in bold inside a sentence with one `{}`.
InlineSpan _withParking(String key, String parking) {
  final parts = key.tr(args: ['\u0000']).split('\u0000');
  return TextSpan(
    children: [
      TextSpan(text: parts.first),
      TextSpan(text: parking, style: AppText.strong(size: 14.5)),
      if (parts.length > 1) TextSpan(text: parts.sublist(1).join()),
    ],
  );
}

/// « aujourd'hui à 09:38 », « hier à 18:02 », « le 11 oct. à 07:15 ».
String _sentAt(DateTime at, DateTime now) {
  final local = at.toLocal();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(local.year, local.month, local.day);
  final diff = today.difference(day).inDays;
  final time = hhmm(at);
  if (diff == 0) return 'join.sent_today'.tr(args: [time]);
  if (diff == 1) return 'join.sent_yesterday'.tr(args: [time]);
  return 'join.sent_on'.tr(args: [DateFormat('d MMM', 'fr_FR').format(local), time]);
}

class _Waiting extends StatelessWidget {
  const _Waiting({required this.state});
  final ProJoinState state;

  @override
  Widget build(BuildContext context) {
    final request = state.request!;
    final deleting = context.select((ProAuthBloc b) => b.state.deleteState.isProcessing);
    return _Centered(
      icon: Icons.hourglass_top_rounded,
      title: 'join.waiting_title'.tr(),
      text: _withParking('join.waiting_text', request.operatorName),
      children: [
        Container(
          key: const Key('join-waiting'),
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppRadius.card,
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            children: [
              _Row(label: 'join.row_name'.tr(), value: request.name, first: true),
              _Row(label: 'join.row_post'.tr(), value: 'post.name.${request.wishedRole}'.tr()),
              _Row(label: 'join.row_sent'.tr(), value: _sentAt(request.createdAt, DateTime.now())),
            ],
          ),
        ),
        const SizedBox(height: 14),
        OutlineAction(
          key: const Key('join-cancel'),
          label: state.cancelState.isProcessing ? 'common.loading'.tr() : 'join.cancel'.tr(),
          onPressed: state.cancelState.isProcessing ? null : () => context.read<ProJoinBloc>().add(const ProJoinCancelRequested()),
        ),
        const SizedBox(height: 4),
        Center(
          child: TextButton(
            key: const Key('join-delete'),
            style: TextButton.styleFrom(foregroundColor: AppColors.muted),
            onPressed: deleting ? null : () => showDeleteAccountSheet(context, identity: state.identity),
            child: Text(deleting ? 'common.loading'.tr() : 'account.delete'.tr(), style: AppText.muted(size: 13.5)),
          ),
        ),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.first = false});
  final String label;
  final String value;
  final bool first;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        border: first ? null : const Border(top: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: [
          Text(label, style: AppText.muted(size: 13.5)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(value, textAlign: TextAlign.end, style: AppText.strong(size: 14)),
          ),
        ],
      ),
    );
  }
}

/// Refused, expired or cancelled: say so, and « Taper un nouveau code ».
class _Closed extends StatelessWidget {
  const _Closed({required this.state});
  final ProJoinState state;

  @override
  Widget build(BuildContext context) {
    final request = state.request!;
    final status = const {'refused', 'expired', 'cancelled'}.contains(request.status) ? request.status : 'refused';
    return _Centered(
      key: Key('join-closed-$status'),
      icon: status == 'cancelled' ? Icons.undo_rounded : Icons.hourglass_disabled_rounded,
      danger: status == 'refused',
      title: 'join.closed_title.$status'.tr(),
      text: _withParking('join.closed_text.$status', request.operatorName),
      children: [
        GradientButton(
          key: const Key('join-new-code'),
          label: 'join.new_code'.tr(),
          onPressed: () => context.read<ProJoinBloc>().add(const ProJoinNewCodeRequested()),
        ),
        const SizedBox(height: 6),
        const Center(child: _OtherAccountLink()),
      ],
    );
  }
}

/// Accepted: the staff session opens (or says why not, with « Réessayer »).
class _Accepted extends StatelessWidget {
  const _Accepted({required this.state});
  final ProJoinState state;

  @override
  Widget build(BuildContext context) {
    final failed = state.sessionState.isError;
    return _Centered(
      key: const Key('join-accepted'),
      icon: Icons.check_circle_rounded,
      title: 'join.accepted_title'.tr(),
      text: _withParking('join.accepted_text', state.request?.operatorName ?? ''),
      children: [
        if (failed) ...[
          Text(
            translateErrorCode(state.errorCode),
            textAlign: TextAlign.center,
            style: AppText.body(size: 14, color: AppColors.danger),
          ),
          const SizedBox(height: 12),
          GradientButton(key: const Key('join-retry'), label: 'common.retry'.tr(), onPressed: () => context.read<ProJoinBloc>().add(const ProJoinRefreshed())),
        ] else
          const Center(child: CircularProgressIndicator(color: AppColors.accent)),
      ],
    );
  }
}
