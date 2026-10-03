import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import '../core/constants/app_constants.dart';
import '../shared/theme/theme.dart';

/// What happened in the payment sheet.
enum PaymentSheetResult { completed, canceled, failed }

class PaymentSheetOutcome {
  const PaymentSheetOutcome(this.result, {this.message});
  final PaymentSheetResult result;

  /// Stripe's own (localised) message of a failure, safe to show; never logged.
  final String? message;
}

/// The native payment sheet (Stripe PaymentSheet: card, Apple Pay, Google Pay). Web builds have
/// none: [supported] is false and the app sends the traveller to Stripe Checkout instead.
abstract class PaymentSheetService {
  bool get supported;

  Future<PaymentSheetOutcome> present({
    required String publishableKey,
    required String clientSecret,
    required String merchantDisplayName,
    required String merchantCountryCode,
    required String currency,
    String? amountLabel,
  });
}

class StripePaymentSheetService implements PaymentSheetService {
  @override
  bool get supported => !kIsWeb && (defaultTargetPlatform == TargetPlatform.iOS || defaultTargetPlatform == TargetPlatform.android);

  @override
  Future<PaymentSheetOutcome> present({
    required String publishableKey,
    required String clientSecret,
    required String merchantDisplayName,
    required String merchantCountryCode,
    required String currency,
    String? amountLabel,
  }) async {
    try {
      if (Stripe.publishableKey != publishableKey) {
        Stripe.publishableKey = publishableKey;
        if (AppConstants.appleMerchantId.isNotEmpty) Stripe.merchantIdentifier = AppConstants.appleMerchantId;
        await Stripe.instance.applySettings();
      }
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: merchantDisplayName,
          style: ThemeMode.light,
          applePay: AppConstants.appleMerchantId.isEmpty ? null : PaymentSheetApplePay(merchantCountryCode: merchantCountryCode),
          googlePay: PaymentSheetGooglePay(
            merchantCountryCode: merchantCountryCode,
            currencyCode: currency.toUpperCase(),
            testEnv: AppConstants.googlePayTestEnv,
          ),
          // Direction D in the sheet: violet actions, rounded like the app's cards.
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
      await Stripe.instance.presentPaymentSheet();
      return const PaymentSheetOutcome(PaymentSheetResult.completed);
    } on StripeException catch (e) {
      if (e.error.code == FailureCode.Canceled) return const PaymentSheetOutcome(PaymentSheetResult.canceled);
      return PaymentSheetOutcome(PaymentSheetResult.failed, message: e.error.localizedMessage);
    } catch (e) {
      debugPrint('Payment sheet error: ${e.runtimeType}');
      return const PaymentSheetOutcome(PaymentSheetResult.failed);
    }
  }
}

/// Browser trials only (`--dart-define=PAYMENT_SHEET_DEMO=success|fail`): a stand-in for Stripe's
/// sheet, drawn like it, so that the payment step's states can be tried on a web build against a
/// fake Stripe. "Payer" completes (or fails, with "fail"); closing the sheet cancels. Never used
/// unless that build setting is given.
class DemoPaymentSheetService implements PaymentSheetService {
  DemoPaymentSheetService(this._context, {this.mode = 'success'});

  static const configuredMode = String.fromEnvironment('PAYMENT_SHEET_DEMO');

  final BuildContext? Function() _context;
  final String mode;

  @override
  bool get supported => true;

  @override
  Future<PaymentSheetOutcome> present({
    required String publishableKey,
    required String clientSecret,
    required String merchantDisplayName,
    required String merchantCountryCode,
    required String currency,
    String? amountLabel,
  }) async {
    final context = _context();
    if (context == null) return const PaymentSheetOutcome(PaymentSheetResult.failed);
    final paid = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      barrierColor: const Color(0x731E0A28),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFDDDDDD), borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 14),
              Row(children: [Text('Total', style: AppText.strong()), const Spacer(), Text(amountLabel ?? '', style: AppText.strong())]),
              const SizedBox(height: 10),
              Container(
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(12)),
                child: Text('Apple Pay', style: AppText.strong(size: 17, color: Colors.white)),
              ),
              const SizedBox(height: 10),
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                alignment: Alignment.centerLeft,
                decoration: BoxDecoration(border: Border.all(color: AppColors.line), borderRadius: BorderRadius.circular(12)),
                child: Text('Carte · Numéro, MM/AA, CVC', style: AppText.muted()),
              ),
              const SizedBox(height: 12),
              FilledButton(
                key: const Key('demo-sheet-pay'),
                onPressed: () => Navigator.of(context).pop(true),
                style: FilledButton.styleFrom(backgroundColor: AppColors.accent, minimumSize: const Size.fromHeight(50)),
                child: Text('Payer ${amountLabel ?? ''}'),
              ),
              const SizedBox(height: 8),
              Text('🔒 Stripe (démonstration)', textAlign: TextAlign.center, style: AppText.muted(size: 12.5)),
            ],
          ),
        ),
      ),
    );
    if (paid != true) return const PaymentSheetOutcome(PaymentSheetResult.canceled);
    if (mode == 'fail') return const PaymentSheetOutcome(PaymentSheetResult.failed, message: 'Votre carte a été refusée.');
    return const PaymentSheetOutcome(PaymentSheetResult.completed);
  }
}
