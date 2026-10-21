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

/// Staff login, with the pro space's accounts (POST /internal/auth/login). Choice B of 21/10/2026 (« revois la page de
/// connexion », mockups https://claude.ai/artifact/2hNzBfHaph589Vdhjing8h, « Un champ à la fois »; replaces choice A of the
/// morning): a full lime screen with the pro wordmark, then a white sheet that asks one thing at a time: the email
/// address, then the password on a second step (« Changer d'adresse e-mail » goes back). Apple on an iPhone, Google on
/// Android (13/10/2026), when the build and the API allow it, sit under the email step; « Nouveau ? J'ai un code du
/// jour » explains how to join a parking. The app serves many car parks: nothing names one before the sign-in.
@RoutePage()
class ProLoginPage extends StatefulWidget {
  const ProLoginPage({super.key});

  @override
  State<ProLoginPage> createState() => _ProLoginPageState();
}

class _ProLoginPageState extends State<ProLoginPage> {
  final _emailForm = GlobalKey<FormState>();
  final _passwordForm = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _passwordFocus = FocusNode();
  bool _passwordStep = false;

  @override
  void initState() {
    super.initState();
    context.read<ProAuthBloc>().add(const ProAuthProvidersRequested());
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  void _next() {
    if (!_emailForm.currentState!.validate()) return;
    setState(() => _passwordStep = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _passwordFocus.requestFocus();
    });
  }

  void _back() {
    _password.clear();
    setState(() => _passwordStep = false);
  }

  void _submit() {
    if (!_passwordForm.currentState!.validate()) return;
    context.read<ProAuthBloc>().add(ProAuthLoginSubmitted(email: _email.text.trim(), password: _password.text));
  }

  void _explainNewcomer(ProAuthState state) {
    final withProvider = state.providers.apple || state.providers.google;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (sheet) => Padding(
        padding: EdgeInsets.fromLTRB(22, 24, 22, 20 + MediaQuery.paddingOf(sheet).bottom),
        child: Column(
          key: const Key('pro-login-newcomer-sheet'),
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('pro.login_new_title'.tr(), style: AppText.title(size: 22)),
            const SizedBox(height: 8),
            Text(
              withProvider ? 'pro.login_new_providers'.tr() : 'pro.login_new_body'.tr(),
              style: AppText.body(size: 15, color: const Color(0xFF4B5563)),
            ),
            const SizedBox(height: 20),
            GradientButton(label: 'pro.login_new_ok'.tr(), onPressed: () => Navigator.of(sheet).pop()),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.action,
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
            value: appSystemUiStyle,
            child: LayoutBuilder(
              builder: (context, box) => SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: box.maxHeight),
                  child: IntrinsicHeight(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: SafeArea(
                            bottom: false,
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const _ProWordmark(),
                                  const SizedBox(height: 14),
                                  Text(
                                    'pro.login_tagline'.tr(),
                                    textAlign: TextAlign.center,
                                    style: AppText.strong(size: 16, color: AppColors.onAccent),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Container(
                          key: const Key('pro-login-card'),
                          decoration: const BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                          ),
                          padding: EdgeInsets.fromLTRB(20, 18, 20, 20 + MediaQuery.paddingOf(context).bottom),
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 180),
                            child: _passwordStep ? _passwordSheet(state, busy) : _emailSheet(state, busy),
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

  /// Step 1: the email address, then Apple or Google, then the newcomers' link.
  Widget _emailSheet(ProAuthState state, bool busy) {
    final withProvider = state.providers.apple || state.providers.google;
    return Form(
      key: _emailForm,
      child: Column(
        key: const Key('pro-login-step-email'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _StepDots(step: 0),
          const SizedBox(height: 14),
          Semantics(header: true, child: Text('pro.login_email_title'.tr(), style: AppText.title(size: 22))),
          const SizedBox(height: 12),
          TextFormField(
            key: const Key('pro-email'),
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.username, AutofillHints.email],
            autocorrect: false,
            decoration: InputDecoration(labelText: 'pro.email'.tr(), fillColor: AppColors.background, filled: true),
            validator: (v) {
              final value = v?.trim() ?? '';
              if (value.isEmpty) return 'open.required'.tr();
              if (!value.contains('@')) return 'pro.login_invalid_email'.tr();
              return null;
            },
            onFieldSubmitted: (_) => _next(),
          ),
          if (state.errorCode != null && !_passwordStep) ...[
            const SizedBox(height: 10),
            Text(translateErrorCode(state.errorCode), key: const Key('pro-login-error'), style: AppText.body(size: 14, color: AppColors.danger)),
          ],
          const SizedBox(height: 14),
          GradientButton(key: const Key('pro-login-next'), label: 'pro.login_next'.tr(), onPressed: busy ? null : _next),
          if (withProvider) ...[
            const SizedBox(height: 14),
            OrDivider('pro.login_or'.tr()),
            const SizedBox(height: 14),
          ],
          if (state.providers.apple) ...[
            AppleSignInButton(
              key: const Key('pro-login-apple'),
              label: 'pro.continue_apple'.tr(),
              busy: state.signingInWith == 'apple',
              onPressed: busy ? null : () => context.read<ProAuthBloc>().add(const ProAuthProviderSignInRequested('apple')),
            ),
            if (state.providers.google) const SizedBox(height: 10),
          ],
          if (state.providers.google)
            GoogleSignInButton(
              key: const Key('pro-login-google'),
              label: 'pro.continue_google'.tr(),
              busy: state.signingInWith == 'google',
              onPressed: busy ? null : () => context.read<ProAuthBloc>().add(const ProAuthProviderSignInRequested('google')),
            ),
          const SizedBox(height: 14),
          Center(
            child: TextButton(
              key: const Key('pro-login-newcomer'),
              onPressed: () => _explainNewcomer(state),
              child: Text('pro.login_new_link'.tr(), style: AppText.strong(size: 14, color: AppColors.accent)),
            ),
          ),
        ],
      ),
    );
  }

  /// Step 2: the password, with the address to change and the lost-password word.
  Widget _passwordSheet(ProAuthState state, bool busy) {
    return Form(
      key: _passwordForm,
      child: Column(
        key: const Key('pro-login-step-password'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _StepDots(step: 1),
          const SizedBox(height: 14),
          Semantics(header: true, child: Text('pro.login_password_title'.tr(), style: AppText.title(size: 22))),
          const SizedBox(height: 4),
          Row(
            children: [
              Flexible(
                child: Text(_email.text.trim(), overflow: TextOverflow.ellipsis, style: AppText.body(size: 14, color: const Color(0xFF4B5563))),
              ),
              TextButton(
                key: const Key('pro-login-back'),
                onPressed: busy ? null : _back,
                child: Text('pro.login_change_email'.tr(), style: AppText.strong(size: 13, color: AppColors.accent)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          TextFormField(
            key: const Key('pro-password'),
            controller: _password,
            focusNode: _passwordFocus,
            obscureText: true,
            autofillHints: const [AutofillHints.password],
            decoration: InputDecoration(labelText: 'pro.password'.tr(), fillColor: AppColors.background, filled: true),
            validator: (v) => (v == null || v.isEmpty) ? 'open.required'.tr() : null,
            onFieldSubmitted: (_) => _submit(),
          ),
          if (state.errorCode != null) ...[
            const SizedBox(height: 10),
            Text(translateErrorCode(state.errorCode), key: const Key('pro-login-error'), style: AppText.body(size: 14, color: AppColors.danger)),
          ],
          const SizedBox(height: 14),
          GradientButton(
            key: const Key('pro-login'),
            label: 'pro.login'.tr(),
            busy: state.viewState.isProcessing,
            onPressed: busy ? null : _submit,
          ),
          const SizedBox(height: 14),
          Text(
            'pro.login_help'.tr(),
            textAlign: TextAlign.center,
            style: AppText.body(size: 13, color: const Color(0xFF4B5563)),
          ),
        ],
      ),
    );
  }
}

/// Where the sheet is: e-mail (1 of 2), then the password.
class _StepDots extends StatelessWidget {
  const _StepDots({required this.step});
  final int step;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var i = 0; i < 2; i++)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: i == step ? 18 : 7,
              height: 7,
              decoration: BoxDecoration(
                color: i == step ? AppColors.accent : const Color(0xFFC9D2C4),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
        ],
      ),
    );
  }
}

/// The pro wordmark on the lime screen: the name in lime on a dark green plate, « PRO » beside it in dark green.
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
            decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(10)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              child: Text(Product.name, style: AppText.big(size: 30, color: AppColors.action).copyWith(letterSpacing: -0.4)),
            ),
          ),
          const SizedBox(width: 10),
          Text('PRO', style: AppText.title(size: 26, color: AppColors.accent)),
        ],
      ),
    );
  }
}
