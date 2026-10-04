import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../bloc/pro_settings_bloc.dart';

/// "Mon compte": who is signed in, and a new password (the server then closes every session).
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

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final staff = context.watch<ProAuthBloc>().state.staff;
    return BlocConsumer<ProSettingsBloc, ProSettingsState>(
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
    );
  }
}
