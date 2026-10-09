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
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../bloc/pro_settings_bloc.dart';

/// "Mon compte": who is signed in, their first and last name (« Votre nom », 09/10/2026), and a new password (the
/// server then closes every session).
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
    final staff = context.read<ProAuthBloc>().state.staff;
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
    return BlocListener<ProAuthBloc, ProAuthState>(
      listenWhen: (a, b) => a.nameState != b.nameState,
      listener: (context, state) {
        if (state.nameState.isSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('account.name_saved'.tr())));
          context.read<ProAuthBloc>().add(const ProAuthNameNoticeShown());
        } else if (state.nameState.isError && state.errorCode != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(translateErrorCode(state.errorCode))));
        }
      },
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
                  decoration: InputDecoration(labelText: 'account.new_password'.tr(), helperText: 'account.password_rule'.tr(), errorText: err('newPassword')),
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
            ),
          );
        },
      ),
    );
  }
}
