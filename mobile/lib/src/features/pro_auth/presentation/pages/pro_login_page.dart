import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../bloc/pro_auth_bloc.dart';

/// Staff login, with the pro space's accounts (POST /internal/auth/login).
@RoutePage()
class ProLoginPage extends StatefulWidget {
  const ProLoginPage({super.key});

  @override
  State<ProLoginPage> createState() => _ProLoginPageState();
}

class _ProLoginPageState extends State<ProLoginPage> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_form.currentState!.validate()) return;
    context.read<ProAuthBloc>().add(ProAuthLoginSubmitted(email: _email.text, password: _password.text));
  }

  @override
  Widget build(BuildContext context) {
    String? required(String? v) => (v == null || v.isEmpty) ? 'open.required'.tr() : null;
    return Scaffold(
      appBar: const BrandAppBar(pro: true),
      body: BlocConsumer<ProAuthBloc, ProAuthState>(
        listenWhen: (a, b) => a.status != b.status && b.status == ProAuthStatus.signedIn,
        listener: (context, state) => context.router.replaceAll([if (!AppConstants.isPro) const AppShellRoute(), const ProShellRoute()]),
        builder: (context, state) => SafeArea(
          child: Form(
            key: _form,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('pro.login_title'.tr(), style: AppText.title()),
                const SizedBox(height: 4),
                Text('pro.login_intro'.tr(), style: AppText.muted()),
                const SizedBox(height: 18),
                TextFormField(
                  key: const Key('pro-email'),
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.username],
                  decoration: InputDecoration(labelText: 'pro.email'.tr()),
                  validator: required,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  key: const Key('pro-password'),
                  controller: _password,
                  obscureText: true,
                  autofillHints: const [AutofillHints.password],
                  decoration: InputDecoration(labelText: 'pro.password'.tr()),
                  validator: required,
                  onFieldSubmitted: (_) => _submit(),
                ),
                if (state.errorCode != null) ...[
                  const SizedBox(height: 10),
                  Text(translateErrorCode(state.errorCode), style: AppText.body(size: 14, color: AppColors.danger)),
                ],
                const SizedBox(height: 16),
                GradientButton(key: const Key('pro-login'), label: 'pro.login'.tr(), busy: state.viewState.isProcessing, onPressed: _submit),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
