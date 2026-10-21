import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/sign_in_widgets.dart';
import '../bloc/pro_auth_bloc.dart';

/// Staff login, with the pro space's accounts (POST /internal/auth/login). Choice A of 21/10/2026 (« Refais le design »,
/// mockups https://claude.ai/artifact/WqN5FFVZCtig7hdvuZv69U): a dark green band with the pro wordmark and a greeting,
/// then a light sheet up to the bottom with the sign-in, a word for the newcomers (the code of the day) and the lost
/// password. The app serves many car parks: nothing names one before the sign-in.
/// 13/10/2026 (mockup 1): « Continuer avec Apple » on an iPhone, « Continuer avec Google » on Android, first, when the
/// build and the API allow it (never on the web); the email form stays below for every existing account. Someone
/// who belongs to no parking goes on to « Rejoindre un parking ».
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
  void initState() {
    super.initState();
    context.read<ProAuthBloc>().add(const ProAuthProvidersRequested());
  }

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
    return Scaffold(
      backgroundColor: AppColors.accent,
      body: BlocConsumer<ProAuthBloc, ProAuthState>(
        listenWhen: (a, b) => a.status != b.status && (b.status == ProAuthStatus.signedIn || b.status == ProAuthStatus.onboarding),
        // First sign-in on this account: "Aujourd'hui, je suis…" (R-C); afterwards straight to the tabs. Signed in with
        // Apple or Google without a parking: « Rejoindre un parking ».
        listener: (context, state) => context.router.replaceAll([
          if (state.status == ProAuthStatus.onboarding)
            const ProJoinRoute()
          else if (state.staff?.post == null)
            const ProPostRoute()
          else
            const ProShellRoute(),
        ]),
        builder: (context, state) {
          final busy = state.viewState.isProcessing || state.signInState.isProcessing;
          return AnnotatedRegion<SystemUiOverlayStyle>(
            value: appSystemUiStyle.copyWith(statusBarIconBrightness: Brightness.light, statusBarBrightness: Brightness.dark),
            child: LayoutBuilder(
              builder: (context, box) => SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: box.maxHeight),
                  child: IntrinsicHeight(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SafeArea(
                          bottom: false,
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const _ProWordmark(),
                                const SizedBox(height: 22),
                                Semantics(
                                  header: true,
                                  child: Text(
                                    'pro.login_hello'.tr(),
                                    style: AppText.title(size: 34, color: AppColors.surface).copyWith(height: 1.05),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text('pro.login_roles'.tr(), style: AppText.body(size: 15, color: const Color(0xFFD6E9D9))),
                              ],
                            ),
                          ),
                        ),
                        Expanded(
                          child: Container(
                            key: const Key('pro-login-card'),
                            decoration: const BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                            ),
                            padding: EdgeInsets.fromLTRB(20, 26, 20, 20 + MediaQuery.paddingOf(context).bottom),
                            child: Form(key: _form, child: _sheet(context, state, busy)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _sheet(BuildContext context, ProAuthState state, bool busy) {
    String? required(String? v) => (v == null || v.isEmpty) ? 'open.required'.tr() : null;
    final withProvider = state.providers.apple || state.providers.google;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (state.providers.apple) ...[
          AppleSignInButton(
            key: const Key('pro-login-apple'),
            label: 'pro.continue_apple'.tr(),
            busy: state.signingInWith == 'apple',
            onPressed: busy ? null : () => context.read<ProAuthBloc>().add(const ProAuthProviderSignInRequested('apple')),
          ),
          const SizedBox(height: 10),
        ],
        if (state.providers.google) ...[
          GoogleSignInButton(
            key: const Key('pro-login-google'),
            label: 'pro.continue_google'.tr(),
            busy: state.signingInWith == 'google',
            onPressed: busy ? null : () => context.read<ProAuthBloc>().add(const ProAuthProviderSignInRequested('google')),
          ),
          const SizedBox(height: 10),
        ],
        if (withProvider) ...[OrDivider('pro.or_email'.tr()), const SizedBox(height: 12)],
        TextFormField(
          key: const Key('pro-email'),
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.username],
          decoration: InputDecoration(labelText: 'pro.email'.tr(), fillColor: AppColors.surface, filled: true),
          validator: required,
        ),
        const SizedBox(height: 12),
        TextFormField(
          key: const Key('pro-password'),
          controller: _password,
          obscureText: true,
          autofillHints: const [AutofillHints.password],
          decoration: InputDecoration(labelText: 'pro.password'.tr(), fillColor: AppColors.surface, filled: true),
          validator: required,
          onFieldSubmitted: (_) => _submit(),
        ),
        if (state.errorCode != null) ...[
          const SizedBox(height: 10),
          Text(
            translateErrorCode(state.errorCode),
            key: const Key('pro-login-error'),
            style: AppText.body(size: 14, color: AppColors.danger),
          ),
        ],
        const SizedBox(height: 18),
        GradientButton(
          key: const Key('pro-login'),
          label: 'pro.login'.tr(),
          busy: state.viewState.isProcessing,
          onPressed: busy ? null : _submit,
        ),
        const SizedBox(height: 24),
        const Spacer(),
        Container(
          key: const Key('pro-login-newcomer'),
          decoration: const BoxDecoration(color: AppColors.surface, borderRadius: AppRadius.card),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('pro.login_new_title'.tr(), style: AppText.strong(size: 14)),
              const SizedBox(height: 4),
              Text('pro.login_new_body'.tr(), style: AppText.body(size: 13, color: const Color(0xFF4B5563))),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Text(
          'pro.login_help'.tr(),
          textAlign: TextAlign.center,
          style: AppText.body(size: 13, color: const Color(0xFF4B5563)),
        ),
      ],
    );
  }
}

/// The pro wordmark on the green band: the name on a lime plate, « PRO » in lime beside it.
class _ProWordmark extends StatelessWidget {
  const _ProWordmark();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: Product.proName,
      excludeSemantics: true,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(color: AppColors.action, borderRadius: BorderRadius.circular(8)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              child: Text(Product.name, style: AppText.big(size: 20, color: AppColors.onAccent).copyWith(letterSpacing: -0.3)),
            ),
          ),
          const SizedBox(width: 10),
          Text('PRO', style: AppText.title(size: 20, color: AppColors.action)),
        ],
      ),
    );
  }
}
