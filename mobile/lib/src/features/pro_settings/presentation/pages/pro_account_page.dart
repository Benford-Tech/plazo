import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/names.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/sign_in_widgets.dart';
import '../../../pro_auth/data/models/onboarding_models.dart';
import '../../../pro_auth/data/models/staff_model.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../../pro_auth/presentation/widgets/delete_account_sheet.dart';
import '../bloc/pro_settings_bloc.dart';

/// "Mon compte": who is signed in, their first and last name (« Votre nom », 09/10/2026), and a new password (the
/// server then closes every session). 13/10/2026 (mockup 5): « Connexion » (Apple / Google linked, « Lier … »,
/// « Retirer », the password only when the member has one), « Quitter ce parking », « Supprimer mon compte ».
@RoutePage()
class ProAccountPage extends StatefulWidget implements AutoRouteWrapper {
  const ProAccountPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProSettingsBloc>(), child: this);

  @override
  State<ProAccountPage> createState() => _ProAccountPageState();
}

class _ProAccountPageState extends State<ProAccountPage> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  late final TextEditingController _firstName, _lastName;

  @override
  void initState() {
    super.initState();
    final auth = context.read<ProAuthBloc>();
    final staff = auth.state.staff;
    // The start-up's question went unanswered (offline): asked again, « Lier … » needs the API's answer.
    if (auth.state.providers == const ProvidersModel() && auth.state.deviceProviders != const ProvidersModel()) {
      auth.add(const ProAuthProvidersRequested());
    }
    final name = nameParts(staff?.firstName, staff?.lastName, staff?.name);
    _firstName = TextEditingController(text: name.firstName);
    _lastName = TextEditingController(text: name.lastName);
  }

  @override
  void dispose() {
    for (final c in [_current, _next, _firstName, _lastName]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<ProAuthBloc>().state;
    final staff = auth.staff;
    String? nameErr(String f) => auth.nameErrors[f] == null ? null : translateErrorCode(auth.nameErrors[f]);
    void toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
    return MultiBlocListener(
      listeners: [
        BlocListener<ProAuthBloc, ProAuthState>(
          listenWhen: (a, b) => a.nameState != b.nameState,
          listener: (context, state) {
            if (state.nameState.isSuccess) {
              toast('account.name_saved'.tr());
              context.read<ProAuthBloc>().add(const ProAuthNameNoticeShown());
            } else if (state.nameState.isError && state.errorCode != null) {
              toast(translateErrorCode(state.errorCode));
            }
          },
        ),
        BlocListener<ProAuthBloc, ProAuthState>(
          listenWhen: (a, b) => a.linkState != b.linkState || a.leaveState != b.leaveState || a.deleteState != b.deleteState,
          listener: (context, state) {
            final auth = context.read<ProAuthBloc>();
            if (state.linkState.isSuccess && state.accountNotice != null) {
              toast(state.accountNotice!.tr());
              auth.add(const ProAuthAccountNoticeShown());
            } else if (state.leaveState.isSuccess) {
              toast('account.left'.tr());
              auth.add(const ProAuthAccountNoticeShown());
              // With Apple or Google, straight to « Rejoindre un parking »; else the login.
              context.router.replaceAll([if (state.status == ProAuthStatus.onboarding) const ProJoinRoute() else const ProLoginRoute()]);
            } else if (state.deleteState.isSuccess) {
              toast('account.deleted'.tr());
              auth.add(const ProAuthAccountNoticeShown());
              context.router.replaceAll([const ProLoginRoute()]);
            } else if ((state.linkState.isError || state.leaveState.isError || state.deleteState.isError) && state.errorCode != null) {
              final own = state.leaveState.isError ? 'account.leave_errors.${state.errorCode}' : null;
              final text = own != null && own.tr() != own ? own.tr() : translateErrorCode(state.errorCode);
              toast(text);
              auth.add(const ProAuthAccountNoticeShown());
            }
          },
        ),
      ],
      child: BlocConsumer<ProSettingsBloc, ProSettingsState>(
        listenWhen: (a, b) => a.errorCode != b.errorCode || a.notice != b.notice,
        listener: (context, state) {
          if (state.notice == 'account.password_changed') {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('account.password_changed'.tr())));
            // Every session is closed by the server: back to the login.
            context.read<ProAuthBloc>().add(const ProAuthLogoutRequested());
            context.router.replaceAll([const ProLoginRoute()]);
            return;
          }
          if (state.errorCode != null) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(translateErrorCode(state.errorCode))));
            context.read<ProSettingsBloc>().add(const ProSettingsNoticeShown());
          }
        },
        builder: (context, state) {
          final bloc = context.read<ProSettingsBloc>();
          String? err(String f) => state.fieldErrors[f] == null ? null : translateErrorCode(state.fieldErrors[f]);
          return Scaffold(
            appBar: BrandAppBar(pro: true, title: 'account.title'.tr()),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
              children: [
                Text(staff?.name ?? '', key: const Key('account-name'), style: AppText.strong(size: 17)),
                Text(
                  [
                    staff?.email ?? '',
                    if (staff?.role != null) 'pro_more.role.${staff!.role}'.tr(),
                    if (staff?.operatorName != null) staff!.operatorName!,
                  ].join(' · '),
                  style: AppText.muted(),
                ),
                const SizedBox(height: 18),
                if (staff != null) _SignInCard(staff: staff, auth: auth),
                const SizedBox(height: 22),
                Text('account.name_section'.tr().toUpperCase(), style: AppText.label(size: 11)),
                const SizedBox(height: 8),
                TextField(
                  key: const Key('account-first-name'),
                  controller: _firstName,
                  textCapitalization: TextCapitalization.words,
                  autofillHints: const [AutofillHints.givenName],
                  maxLength: 60,
                  decoration: InputDecoration(labelText: 'account.first_name'.tr(), errorText: nameErr('firstName'), counterText: ''),
                ),
                const SizedBox(height: 10),
                TextField(
                  key: const Key('account-last-name'),
                  controller: _lastName,
                  textCapitalization: TextCapitalization.words,
                  autofillHints: const [AutofillHints.familyName],
                  maxLength: 60,
                  decoration: InputDecoration(labelText: 'account.last_name'.tr(), errorText: nameErr('lastName'), counterText: ''),
                ),
                const SizedBox(height: 14),
                GradientButton(
                  key: const Key('account-name-submit'),
                  label: 'account.save_name'.tr(),
                  busy: auth.nameState.isProcessing,
                  onPressed: () => context.read<ProAuthBloc>().add(ProAuthNameSubmitted(firstName: _firstName.text, lastName: _lastName.text)),
                ),
                // The password form only when the member has one (an Apple or Google account has none).
                if (staff?.hasPassword ?? true) ...[
                  const SizedBox(height: 26),
                  Text('account.password_section'.tr().toUpperCase(), style: AppText.label(size: 11)),
                  const SizedBox(height: 8),
                  TextField(
                    key: const Key('account-current'),
                    controller: _current,
                    obscureText: true,
                    decoration: InputDecoration(labelText: 'account.current_password'.tr(), errorText: err('currentPassword')),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    key: const Key('account-new'),
                    controller: _next,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'account.new_password'.tr(),
                      helperText: 'account.password_rule'.tr(),
                      errorText: err('newPassword'),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text('account.relogin'.tr(), style: AppText.muted(size: 12.5)),
                  const SizedBox(height: 14),
                  GradientButton(
                    key: const Key('account-submit'),
                    label: 'account.submit'.tr(),
                    busy: state.actionState.isProcessing,
                    onPressed: () => bloc.add(ProSettingsPasswordChanged(currentPassword: _current.text, newPassword: _next.text)),
                  ),
                ],
                const SizedBox(height: 26),
                if (staff != null) _ParkingCard(staff: staff, busy: auth.leaveState.isProcessing),
                const SizedBox(height: 14),
                OutlinedButton(
                  key: const Key('account-delete'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppStatus.bad,
                    side: const BorderSide(color: Color(0xFFF3C4C4)),
                    shape: const StadiumBorder(),
                    minimumSize: const Size.fromHeight(44),
                  ),
                  onPressed: auth.deleteState.isProcessing ? null : () => showDeleteAccountSheet(context),
                  child: auth.deleteState.isProcessing
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: AppStatus.bad))
                      : Text('account.delete'.tr(), style: AppText.strong(size: 14.5, color: AppStatus.bad)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// « Connexion »: the Apple / Google identities linked (« Liée », « Retirer »), the ones this phone can link, and
/// whether the account has a password.
class _SignInCard extends StatelessWidget {
  const _SignInCard({required this.staff, required this.auth});
  final StaffModel staff;
  final ProAuthState auth;

  Future<void> _unlink(BuildContext context, String provider) async {
    final bloc = context.read<ProAuthBloc>();
    final name = 'sign_in.$provider'.tr();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('account.unlink_title'.tr(args: [name])),
        content: Text('account.unlink_text'.tr(args: [name])),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text('team.cancel'.tr())),
          TextButton(
            key: const Key('account-unlink-confirm'),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('account.unlink'.tr()),
          ),
        ],
      ),
    );
    if (ok == true) bloc.add(ProAuthIdentityUnlinkRequested(provider));
  }

  @override
  Widget build(BuildContext context) {
    final busy = auth.linkState.isProcessing;
    final rows = <Widget>[];
    for (final provider in const ['apple', 'google']) {
      final linked = staff.identity(provider);
      final canLink = provider == 'apple' ? auth.providers.apple : auth.providers.google;
      if (linked == null && !canLink) continue;
      final leading = provider == 'apple' ? const Icon(Icons.apple, size: 20, color: AppColors.ink) : const GoogleLogo(size: 18);
      if (linked == null) {
        // « Lier mon identifiant Apple » / « Lier mon compte Google »: the whole row is the action.
        rows.add(
          InkWell(
            key: Key('account-link-$provider'),
            onTap: busy ? null : () => context.read<ProAuthBloc>().add(ProAuthIdentityLinkRequested(provider)),
            child: _Line(
              first: rows.isEmpty,
              leading: leading,
              title: 'account.link_$provider'.tr(),
              accent: true,
              trailing: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Icon(Icons.add_link_rounded, size: 20, color: AppColors.accent),
              ),
            ),
          ),
        );
        continue;
      }
      rows.add(
        _Line(
          key: Key('account-identity-$provider'),
          first: rows.isEmpty,
          leading: leading,
          title: 'sign_in.$provider'.tr(),
          subtitle: linked.email,
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: const BoxDecoration(color: AppStatus.okSoft, borderRadius: AppRadius.pill),
                child: Text('account.linked_pill'.tr(), style: AppText.strong(size: 11.5, color: AppStatus.okText)),
              ),
              IconButton(
                key: Key('account-unlink-$provider'),
                tooltip: 'account.unlink'.tr(),
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.link_off_rounded, size: 20, color: AppColors.muted),
                onPressed: busy ? null : () => _unlink(context, provider),
              ),
            ],
          ),
        ),
      );
    }
    rows.add(
      _Line(
        key: const Key('account-password-row'),
        first: rows.isEmpty,
        title: 'account.password_row'.tr(),
        muted: true,
        trailing: Text(staff.hasPassword ? 'account.password_set'.tr() : 'account.password_none'.tr(), style: AppText.muted(size: 12.5)),
      ),
    );
    return Container(
      key: const Key('account-sign-in'),
      padding: const EdgeInsets.fromLTRB(13, 12, 8, 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('account.sign_in_section'.tr().toUpperCase(), style: AppText.label(size: 11)),
          const SizedBox(height: 4),
          ...rows,
          if (!staff.hasPassword) ...[
            const SizedBox(height: 2),
            Padding(
              padding: const EdgeInsets.only(right: 5, bottom: 8),
              child: Text('account.no_password_help'.tr(), style: AppText.muted(size: 12)),
            ),
          ],
        ],
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({
    super.key,
    required this.first,
    this.leading,
    required this.title,
    this.subtitle,
    this.muted = false,
    this.accent = false,
    required this.trailing,
  });
  final bool first;
  final Widget? leading;
  final String title;
  final String? subtitle;
  final bool muted;

  /// An action row (« Lier … »): the title in the accent colour.
  final bool accent;
  final Widget trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 46),
      padding: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        border: first ? null : const Border(top: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: [
          if (leading != null) ...[SizedBox(width: 22, child: Center(child: leading)), const SizedBox(width: 10)],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: muted
                      ? AppText.muted(size: 14)
                      : accent
                      ? AppText.strong(size: 14, color: AppColors.accent)
                      : AppText.strong(size: 14.5),
                ),
                if ((subtitle ?? '').isNotEmpty) Text(subtitle!, style: AppText.muted(size: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }
}

/// « Parking »: where the member works, and « Quitter ce parking ».
class _ParkingCard extends StatelessWidget {
  const _ParkingCard({required this.staff, required this.busy});
  final StaffModel staff;
  final bool busy;

  Future<void> _leave(BuildContext context) async {
    final bloc = context.read<ProAuthBloc>();
    final parking = staff.operatorName ?? '';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('account.leave_title'.tr(args: [parking])),
        content: Text('account.leave_text'.tr()),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text('team.cancel'.tr())),
          TextButton(
            key: const Key('account-leave-confirm'),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('account.leave_confirm'.tr()),
          ),
        ],
      ),
    );
    if (ok == true) bloc.add(const ProAuthLeaveRequested());
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      key: const Key('account-parking'),
      padding: const EdgeInsets.fromLTRB(13, 12, 13, 13),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('account.parking_section'.tr().toUpperCase(), style: AppText.label(size: 11)),
          const SizedBox(height: 6),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(text: staff.operatorName ?? '', style: AppText.strong(size: 15)),
                TextSpan(text: ' · ${'pro_more.role.${staff.role}'.tr()}', style: AppText.muted(size: 13)),
              ],
            ),
          ),
          const SizedBox(height: 10),
          OutlineAction(
            key: const Key('account-leave'),
            label: busy ? 'common.loading'.tr() : 'account.leave'.tr(),
            onPressed: busy ? null : () => _leave(context),
          ),
        ],
      ),
    );
  }
}
