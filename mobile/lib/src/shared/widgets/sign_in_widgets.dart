import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../theme/theme.dart';

/// Google's « G », in its four colours (Google's sign-in branding).
class GoogleLogo extends StatelessWidget {
  const GoogleLogo({super.key, this.size = 18});
  final double size;

  static const _svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'
      '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>'
      '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
      '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
      '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
      '</svg>';

  @override
  Widget build(BuildContext context) => SvgPicture.string(_svg, width: size, height: size);
}

/// « Continuer avec Apple »: Apple's own button (black, its logo), as its guidelines ask.
class AppleSignInButton extends StatelessWidget {
  const AppleSignInButton({super.key, required this.label, required this.onPressed, this.busy = false, this.color});

  final String label;
  final VoidCallback? onPressed;
  final bool busy;

  /// Red for « Confirmer avec Apple » of « Supprimer mon compte »; Apple's black otherwise.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !busy;
    final button = color == null
        ? SignInWithAppleButton(text: label, height: 48, borderRadius: const BorderRadius.all(Radius.circular(10)), onPressed: enabled ? onPressed! : () {})
        : _PlainProviderButton(
            background: color!,
            foreground: Colors.white,
            leading: const Icon(Icons.apple, color: Colors.white, size: 22),
            label: label,
            onPressed: enabled ? onPressed : null,
          );
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      excludeSemantics: true,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Opacity(
            opacity: enabled ? 1 : 0.6,
            child: IgnorePointer(ignoring: !enabled, child: button),
          ),
          if (busy) const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white)),
        ],
      ),
    );
  }
}

/// « Continuer avec Google »: Google's white button (grey outline, the four-colour « G »).
class GoogleSignInButton extends StatelessWidget {
  const GoogleSignInButton({super.key, required this.label, required this.onPressed, this.busy = false});

  final String label;
  final VoidCallback? onPressed;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !busy;
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      excludeSemantics: true,
      child: Opacity(
        opacity: enabled ? 1 : 0.6,
        child: _PlainProviderButton(
          background: Colors.white,
          foreground: const Color(0xFF1F1F1F),
          border: const Color(0xFF747775),
          leading: busy
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: Color(0xFF1F1F1F)))
              : const GoogleLogo(),
          label: label,
          onPressed: enabled ? onPressed : null,
        ),
      ),
    );
  }
}

class _PlainProviderButton extends StatelessWidget {
  const _PlainProviderButton({required this.background, required this.foreground, this.border, required this.leading, required this.label, this.onPressed});

  final Color background;
  final Color foreground;
  final Color? border;
  final Widget leading;
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    const radius = BorderRadius.all(Radius.circular(10));
    return Material(
      color: background,
      shape: RoundedRectangleBorder(
        borderRadius: radius,
        side: border == null ? BorderSide.none : BorderSide(color: border!),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        child: SizedBox(
          height: 48,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              leading,
              const SizedBox(width: 10),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontFamily: 'Roboto', fontSize: 15, fontWeight: FontWeight.w600, color: foreground),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// « ou avec votre e-mail »: a rule on each side.
class OrDivider extends StatelessWidget {
  const OrDivider(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.line, height: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(label, style: AppText.muted(size: 12.5)),
        ),
        const Expanded(child: Divider(color: AppColors.line, height: 1)),
      ],
    );
  }
}

/// How someone signs in (13/10/2026): a small outlined pill « E-mail », « Apple » or « Google » with its mark.
class SignInBadge extends StatelessWidget {
  const SignInBadge(this.method, {super.key});

  /// password, apple, google
  final String method;

  @override
  Widget build(BuildContext context) {
    final Widget? mark = switch (method) {
      'apple' => const Icon(Icons.apple, size: 12, color: AppColors.ink),
      'google' => const GoogleLogo(size: 10),
      _ => null,
    };
    return Container(
      key: Key('sign-in-$method'),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: AppRadius.pill,
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (mark != null) ...[mark, const SizedBox(width: 3)],
          Text('sign_in.$method'.tr(), style: AppText.muted(size: 11)),
        ],
      ),
    );
  }
}
