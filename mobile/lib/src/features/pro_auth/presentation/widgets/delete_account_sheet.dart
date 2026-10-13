import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/sign_in_widgets.dart';
import '../../data/models/onboarding_models.dart';
import '../bloc/pro_auth_bloc.dart';

/// « Supprimer mon compte » (13/10/2026, required by Apple 5.1.1(v) and Google Play): a sheet that says what goes and
/// what stays, then confirms with the password, or with Apple / Google when the account has no password. Before
/// joining a parking ([identity] given), only the Apple or Google identity is deleted.
Future<void> showDeleteAccountSheet(BuildContext context, {IdentityModel? identity}) {
  final auth = context.read<ProAuthBloc>();
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (sheet) => BlocProvider.value(
      value: auth,
      child: DeleteAccountSheet(identity: identity),
    ),
  );
}

class DeleteAccountSheet extends StatefulWidget {
  const DeleteAccountSheet({super.key, this.identity});
  final IdentityModel? identity;

  @override
  State<DeleteAccountSheet> createState() => _DeleteAccountSheetState();
}

class _DeleteAccountSheetState extends State<DeleteAccountSheet> {
  final _password = TextEditingController();

  @override
  void initState() {
    super.initState();
    _password.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  void _confirm({String? password, String? provider}) {
    Navigator.of(context).pop();
    context.read<ProAuthBloc>().add(ProAuthDeleteRequested(password: password, provider: provider));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<ProAuthBloc>().state;
    final identity = widget.identity;
    final staff = auth.staff;
    final appleLinked = identity == null ? staff?.identity('apple') != null : identity.provider == 'apple';
    final googleLinked = identity == null ? staff?.identity('google') != null : identity.provider == 'google';
    final hasPassword = identity == null && (staff?.hasPassword ?? true);
    // The phone's own sign-ins count even before the API's answer is read (a restored session skips the login page).
    final canApple = auth.providers.apple || auth.deviceProviders.apple;
    final canGoogle = auth.providers.google || auth.deviceProviders.google;
    final List<Widget> confirm;
    if (identity != null) {
      confirm = [
        if (appleLinked && canApple)
          AppleSignInButton(
            key: const Key('delete-confirm-apple'),
            label: 'account.delete_with_apple'.tr(),
            color: AppStatus.bad,
            onPressed: () => _confirm(provider: 'apple'),
          )
        else
          DangerButton(
            key: const Key('delete-confirm'),
            label: 'account.delete'.tr(),
            onPressed: () => _confirm(provider: identity.provider),
          ),
      ];
    } else if (hasPassword) {
      confirm = [
        TextField(
          key: const Key('delete-password'),
          controller: _password,
          obscureText: true,
          autofillHints: const [AutofillHints.password],
          decoration: InputDecoration(labelText: 'account.delete_password'.tr()),
        ),
        const SizedBox(height: 12),
        DangerButton(
          key: const Key('delete-confirm'),
          label: 'account.delete'.tr(),
          onPressed: _password.text.isEmpty ? null : () => _confirm(password: _password.text),
        ),
      ];
    } else if (appleLinked && canApple) {
      confirm = [
        AppleSignInButton(
          key: const Key('delete-confirm-apple'),
          label: 'account.delete_with_apple'.tr(),
          color: AppStatus.bad,
          onPressed: () => _confirm(provider: 'apple'),
        ),
      ];
    } else if (googleLinked && canGoogle) {
      confirm = [
        GoogleSignInButton(
          key: const Key('delete-confirm-google'),
          label: 'account.delete_with_google'.tr(),
          onPressed: () => _confirm(provider: 'google'),
        ),
      ];
    } else {
      // An Apple account on Android (or the reverse): confirm on the phone that signs in, or with a password.
      confirm = [
        Text(
          'account.delete_elsewhere'.tr(args: ['sign_in.${appleLinked ? 'apple' : 'google'}'.tr()]),
          key: const Key('delete-elsewhere'),
          style: AppText.body(size: 14),
        ),
      ];
    }
    final text = identity != null
        ? 'join.delete_text'.tr(args: ['sign_in.${identity.provider}'.tr()])
        : [
            (appleLinked ? 'account.delete_text_apple' : 'account.delete_text').tr(args: [Product.proName]),
            if (staff?.role == 'manager') 'account.delete_manager_warning'.tr(),
          ].join('\n\n');
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.viewInsetsOf(context).bottom + 20),
      child: ListView(
        shrinkWrap: true,
        children: [
          Semantics(header: true, child: Text('account.delete_title'.tr(), style: AppText.title(size: 22))),
          const SizedBox(height: 8),
          Text(text, key: const Key('delete-text'), style: AppText.body(size: 14)),
          const SizedBox(height: 16),
          ...confirm,
          const SizedBox(height: 10),
          OutlineAction(key: const Key('delete-cancel'), label: 'team.cancel'.tr(), onPressed: () => Navigator.of(context).pop()),
        ],
      ),
    );
  }
}

/// A destructive action: filled red, white text (« Supprimer mon compte »).
class DangerButton extends StatelessWidget {
  const DangerButton({super.key, required this.label, required this.onPressed, this.busy = false});
  final String label;
  final VoidCallback? onPressed;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: busy ? null : onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: AppStatus.bad,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppStatus.bad.withValues(alpha: 0.45),
        disabledForegroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
        textStyle: AppText.strong(size: 15),
      ),
      child: busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white)) : Text(label),
    );
  }
}
