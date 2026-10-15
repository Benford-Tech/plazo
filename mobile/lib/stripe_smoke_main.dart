// CI only (.github/workflows/mobile-android-emulator.yml), never shipped: the stores build lib/main.dart, and nothing
// in the app imports this file, so it exists only in an APK built with `-t lib/stripe_smoke_main.dart`.
//
// Opens Stripe's PaymentSheet in a RELEASE build (R8 on), without the Plazo API, to prove that the Stripe SDK
// survives R8 (a narrower keep rule must not break payments) and to screenshot the sheet edge-to-edge on Android 15
// and 16. Deferred intent: the sheet is set up from an amount (IntentConfiguration), so there is no PaymentIntent and
// no secret key; the confirm handler always refuses, so nothing can ever be paid. Only a Stripe TEST publishable key
// is accepted (public, not a secret).
//
//   flutter build apk --release --flavor traveller -t lib/stripe_smoke_main.dart \
//     --dart-define=APP_FLAVOR=traveller --dart-define=STRIPE_SMOKE_KEY=pk_test_…
//
// Every step is printed to logcat as « PLAZO_SMOKE <step> » (read by mobile/tool/emulator/e2e.sh).
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'src/shared/theme/theme.dart';

const _key = String.fromEnvironment('STRIPE_SMOKE_KEY');

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MaterialApp(debugShowCheckedModeBanner: false, home: _SmokePage()));
}

class _SmokePage extends StatefulWidget {
  const _SmokePage();

  @override
  State<_SmokePage> createState() => _SmokePageState();
}

class _SmokePageState extends State<_SmokePage> {
  String _status = 'starting';

  void _report(String status) {
    debugPrint('PLAZO_SMOKE $status');
    if (mounted) setState(() => _status = status);
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => unawaited(_run()));
  }

  Future<void> _run() async {
    if (!_key.startsWith('pk_test_')) {
      _report('refused: STRIPE_SMOKE_KEY must be a pk_test_ key');
      return;
    }
    try {
      Stripe.publishableKey = _key;
      await Stripe.instance.applySettings();
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          merchantDisplayName: 'Plazo (test)',
          style: ThemeMode.light,
          intentConfiguration: IntentConfiguration(
            mode: const IntentMode.paymentMode(currencyCode: 'EUR', amount: 4550),
            // Called only if someone pays: refused, no intent is ever created.
            confirmHandler: (paymentMethod, shouldSavePaymentMethod) => unawaited(
              Stripe.instance.intentCreationCallback(
                const IntentCreationCallbackParams(
                  error: StripeException(error: LocalizedErrorMessage(code: FailureCode.Failed, message: 'smoke test: no payment')),
                ),
              ),
            ),
          ),
          // Same Google Pay and look as the app (lib/src/services/payment_sheet_service.dart).
          googlePay: const PaymentSheetGooglePay(merchantCountryCode: 'FR', currencyCode: 'EUR', testEnv: true),
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(primary: AppColors.accent),
            shapes: PaymentSheetShape(borderRadius: 14),
            primaryButton: PaymentSheetPrimaryButtonAppearance(
              shapes: PaymentSheetPrimaryButtonShape(blurRadius: 0),
              colors: PaymentSheetPrimaryButtonTheme(light: PaymentSheetPrimaryButtonThemeColors(background: AppColors.accent)),
            ),
          ),
        ),
      );
      _report('initialised');
      final closed = Stripe.instance.presentPaymentSheet(options: const PaymentSheetPresentOptions(timeout: 90000));
      _report('present-requested');
      await closed;
      _report('result=completed');
    } on StripeException catch (e) {
      _report('result=${e.error.code.name} stripeErrorCode=${e.error.stripeErrorCode ?? '-'} message=${e.error.message ?? '-'}');
    } catch (e) {
      _report('result=error ${e.runtimeType}');
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(child: Text('Stripe smoke: $_status', key: const Key('smoke-status'), textAlign: TextAlign.center)),
    ),
  );
}
