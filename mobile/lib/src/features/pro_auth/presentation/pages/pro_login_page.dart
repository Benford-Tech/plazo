import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_logo.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../bloc/pro_auth_bloc.dart';

/// Staff login, with the pro space's accounts (POST /internal/auth/login). Direction C-C "Tableau
/// des vols" (04/10/2026): the grid of a departures board under a black veil, the form in a card
/// bordered in yellow. The app serves many car parks: nothing names one before the sign-in.
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
      backgroundColor: AppColors.brand,
      body: BlocConsumer<ProAuthBloc, ProAuthState>(
        listenWhen: (a, b) => a.status != b.status && b.status == ProAuthStatus.signedIn,
        // First sign-in on this account: "Aujourd'hui, je suis…" (R-C); afterwards straight to the tabs.
        listener: (context, state) => context.router.replaceAll([if (state.staff?.post == null) const ProPostRoute() else const ProShellRoute()]),
        builder: (context, state) => Stack(
          fit: StackFit.expand,
          children: [
            const CustomPaint(painter: _BoardGridPainter()),
            SafeArea(
              child: Form(
                key: _form,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
                  children: [
                    const BrandLogo(height: 32, pro: true),
                    const SizedBox(height: 40),
                    Container(
                      key: const Key('pro-login-card'),
                      decoration: BoxDecoration(color: AppColors.brand, border: Border.all(color: AppColors.accent, width: 1.2)),
                      padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('pro.login_eyebrow'.tr().toUpperCase(), style: AppText.tabular(size: 13, color: AppColors.accent).copyWith(letterSpacing: 0.6)),
                          const SizedBox(height: 3),
                          Text('pro.login_roles'.tr(), style: AppText.label(size: 11)),
                          const SizedBox(height: 18),
                          Semantics(header: true, child: Text('pro.login_title'.tr(), style: AppText.title(size: 26))),
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
                            Text(translateErrorCode(state.errorCode), key: const Key('pro-login-error'), style: AppText.body(size: 14, color: AppColors.danger)),
                          ],
                          const SizedBox(height: 16),
                          GradientButton(key: const Key('pro-login'), label: 'pro.login'.tr(), busy: state.viewState.isProcessing, onPressed: _submit),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text('pro.login_help'.tr(), textAlign: TextAlign.center, style: AppText.muted(size: 12.5)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The grid of a departures board: faint yellow rules, darker towards the bottom.
class _BoardGridPainter extends CustomPainter {
  const _BoardGridPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final line = Paint()
      ..color = AppColors.accent.withValues(alpha: 0.16)
      ..strokeWidth = 1;
    for (var y = 34.0; y < size.height; y += 34) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), line);
    }
    for (var x = 68.0; x < size.width; x += 68) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), line);
    }
    final veil = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [AppColors.brand.withValues(alpha: 0.35), AppColors.brand.withValues(alpha: 0.92)],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, veil);
  }

  @override
  bool shouldRepaint(_BoardGridPainter oldDelegate) => false;
}
