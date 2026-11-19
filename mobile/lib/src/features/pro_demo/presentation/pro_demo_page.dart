import 'package:auto_route/auto_route.dart';
import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/constants/product.g.dart';
import '../../../core/error/exceptions.dart';
import '../../../core/router/app_router.dart';
import '../../../core/utils/error_message_handler.dart';
import '../../../di/locator.dart';
import '../../../shared/theme/theme.dart';
import '../../../shared/widgets/gradient_button.dart';
import '../../pro_auth/data/models/staff_model.dart';
import '../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../demo_data_source.dart';

/// 19/11/2026 (« pouvoir lancer l'app mobile Plazo Pro en mode démo avec le lien », choix « Lien + bouton »): the
/// prospects' demo in Plazo Pro, as /pro/demo of the web pro space (DemoEntryPage). Anyone opens it from the login's
/// « Essayer la démo »; https://pro.plazo.fr/pro/demo opens it from a link. A role, then « Entrer dans la démo »: a demo
/// session of « Parking des Cèdres », kept like any sign-in. Never guarded: a member who opens a demo link sees it, and
/// entering replaces their session.
@RoutePage()
class ProDemoPage extends StatelessWidget {
  const ProDemoPage({super.key});

  @override
  Widget build(BuildContext context) => const ProDemoView();
}

/// A prospect's own link, `/pro/demo/<token>`: the greeting with their parking, and the opens counted by the server.
@RoutePage()
class ProDemoLinkPage extends StatelessWidget {
  const ProDemoLinkPage({super.key, @PathParam('token') required this.token});

  final String token;

  @override
  Widget build(BuildContext context) => ProDemoView(token: token);
}

class ProDemoView extends StatefulWidget {
  const ProDemoView({super.key, this.token});

  final String? token;

  @override
  State<ProDemoView> createState() => _ProDemoViewState();
}

class _ProDemoViewState extends State<ProDemoView> {
  final DemoDataSource _source = locator<DemoDataSource>();
  String _role = 'manager';
  DemoLinkState? _link;
  bool _linkLoading = false;
  bool _entering = false;
  String? _error;

  /// The member the demo opened for, until the session shows them signed in.
  String? _enteredId;

  @override
  void initState() {
    super.initState();
    final token = widget.token;
    if (token != null && token.isNotEmpty) {
      _linkLoading = true;
      _readLink(token);
    }
  }

  Future<void> _readLink(String token) async {
    try {
      final link = await _source.link(token);
      if (mounted) setState(() => _link = link);
    } catch (_) {
      // Unreachable link check: as on the web, the demo opens without the link (not counted).
    } finally {
      if (mounted) setState(() => _linkLoading = false);
    }
  }

  Future<void> _enter() async {
    setState(() {
      _error = null;
      _entering = true;
    });
    // An expired or unknown link still lets the prospect in, without counting it.
    final usable = _link?.valid == true ? widget.token : null;
    try {
      final staff = await _source.enter(_role, token: usable);
      if (!mounted) return;
      final auth = context.read<ProAuthBloc>();
      final already = auth.state.status == ProAuthStatus.signedIn && auth.state.staff?.id == staff.id;
      _enteredId = staff.id;
      auth.add(ProAuthJoined(staff));
      // Already this demo member (a second entry): the session does not change, go straight in.
      if (already) _open(staff);
    } on DioException catch (e) {
      _failed(e.errorMessage);
    } on ServerException catch (e) {
      _failed(translateErrorCode(e.code));
    } catch (_) {
      _failed(translateErrorCode(null));
    }
  }

  void _failed(String message) {
    if (!mounted) return;
    setState(() {
      _error = message;
      _entering = false;
    });
  }

  /// As after a sign-in: the post of the day first when none is set, else the tabs.
  void _open(StaffModel? staff) {
    _enteredId = null;
    _maybeRouter(context)?.replaceAll([if (staff?.post == null) const ProPostRoute() else const ProShellRoute()]);
  }

  /// A member who opened a demo link keeps their own session until they enter the demo.
  bool get _signedIn => context.read<ProAuthBloc>().state.status == ProAuthStatus.signedIn;

  /// Back to the tabs for a member, else to the login.
  void _back() => _maybeRouter(context)?.replaceAll([if (_signedIn) const ProShellRoute() else const ProLoginRoute()]);

  @override
  Widget build(BuildContext context) {
    final link = _link;
    return BlocListener<ProAuthBloc, ProAuthState>(
      listenWhen: (a, b) => _enteredId != null && b.status == ProAuthStatus.signedIn && b.staff?.id == _enteredId,
      listener: (context, state) => _open(state.staff),
      child: Scaffold(
        backgroundColor: AppColors.accent,
        body: AnnotatedRegion<SystemUiOverlayStyle>(
          value: SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent),
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
                          padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _DemoWordmark(),
                              const SizedBox(height: 18),
                              Semantics(
                                header: true,
                                child: Text('demo.title'.tr(), style: AppText.title(size: 30, color: Colors.white).copyWith(height: 1.1)),
                              ),
                              const SizedBox(height: 10),
                              Text('demo.intro'.tr(), style: AppText.body(size: 15, color: const Color(0xFFD6E9D9))),
                              if (link != null && link.valid && (link.companyName ?? '').isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Text(
                                  'demo.welcome'.tr(namedArgs: {'company': link.companyName!}),
                                  key: const Key('demo-welcome'),
                                  style: AppText.strong(size: 15, color: AppColors.action),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      Expanded(
                        child: Container(
                          decoration: const BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                          ),
                          padding: EdgeInsets.fromLTRB(20, 22, 20, 20 + MediaQuery.paddingOf(context).bottom),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (link != null && !link.valid) ...[
                                _Notice(
                                  key: const Key('demo-link-notice'),
                                  text: link.status == 'expired' ? 'demo.link_expired'.tr() : 'demo.link_unknown'.tr(),
                                ),
                                const SizedBox(height: 12),
                              ],
                              if (_error != null) ...[
                                _Notice(key: const Key('demo-error'), text: _error!, danger: true),
                                const SizedBox(height: 12),
                              ],
                              Semantics(header: true, child: Text('demo.choose_role'.tr(), style: AppText.strong(size: 15))),
                              const SizedBox(height: 12),
                              for (final role in demoRoles) ...[
                                _RoleCard(
                                  role: role,
                                  selected: role == _role,
                                  onTap: _entering ? null : () => setState(() => _role = role),
                                ),
                                const SizedBox(height: 10),
                              ],
                              const SizedBox(height: 10),
                              GradientButton(
                                key: const Key('demo-enter'),
                                label: 'demo.enter'.tr(),
                                busy: _entering,
                                onPressed: _entering || _linkLoading ? null : _enter,
                              ),
                              const SizedBox(height: 10),
                              Text(
                                'demo.footnote'.tr(),
                                textAlign: TextAlign.center,
                                style: AppText.body(size: 12.5, color: const Color(0xFF4B5563)),
                              ),
                              const Spacer(),
                              Center(
                                child: TextButton(
                                  key: const Key('demo-back'),
                                  onPressed: _entering ? null : _back,
                                  child: Text(
                                    _signedIn ? 'common.back'.tr() : 'demo.back'.tr(),
                                    style: AppText.strong(size: 14, color: AppColors.accent),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// One role to try the demo in: its name (the post's) and what it shows.
class _RoleCard extends StatelessWidget {
  const _RoleCard({required this.role, required this.selected, required this.onTap});

  final String role;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      inMutuallyExclusiveGroup: true,
      checked: selected,
      button: true,
      child: Material(
        color: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.card,
          side: BorderSide(color: selected ? AppColors.action : const Color(0xFFD4D8D2), width: selected ? 2.5 : 1),
        ),
        child: InkWell(
          key: Key('demo-role-$role'),
          borderRadius: AppRadius.card,
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('post.name.$role'.tr(), style: AppText.strong(size: 16)),
                      const SizedBox(height: 2),
                      Text('demo.hint.$role'.tr(), style: AppText.body(size: 13, color: const Color(0xFF4B5563))),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Icon(
                  selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                  color: selected ? AppColors.accent : AppColors.muted,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({super.key, required this.text, this.danger = false});

  final String text;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: danger ? AppStatus.badSoft : AppStatus.warnSoft,
        borderRadius: AppRadius.chip,
      ),
      child: Text(text, style: AppText.body(size: 14, color: danger ? AppStatus.badText : const Color(0xFF92400E))),
    );
  }
}

/// The pro wordmark of the demo: the name in dark green on a lime plate, « PRO » in lime, the « Démo » pill.
class _DemoWordmark extends StatelessWidget {
  const _DemoWordmark();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Semantics(
          label: Product.proName,
          excludeSemantics: true,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(color: AppColors.action, borderRadius: BorderRadius.circular(8)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  child: Text(Product.name, style: AppText.big(size: 20, color: AppColors.onAccent)),
                ),
              ),
              const SizedBox(width: 8),
              Text('PRO', style: AppText.title(size: 20, color: AppColors.action)),
            ],
          ),
        ),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
          decoration: BoxDecoration(border: Border.all(color: AppColors.action), borderRadius: AppRadius.pill),
          child: Text('demo.badge'.tr().toUpperCase(), style: AppText.label(size: 11.5, color: AppColors.action)),
        ),
      ],
    );
  }
}

/// The app's router, or null outside it (widget tests).
StackRouter? _maybeRouter(BuildContext context) {
  try {
    return context.router;
  } catch (_) {
    return null;
  }
}
