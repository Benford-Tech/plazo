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

  /// 13/11/2026 (« B avec plus de couleur »): the payment step on Plazo's own page. Google Pay (Android) or Apple Pay
  /// (iPhone, with a merchant id) can be offered on this phone.
  Future<bool> walletSupported({required String publishableKey, required String currency});

  /// Stripe's secure card field (the card never reaches Plazo): tells whether number, expiry and CVC are complete.
  Widget cardField({required ValueChanged<bool> onComplete, bool enabled = true});

  /// The platform's own button (« G Pay », «  Pay »).
  Widget walletButton({required VoidCallback onPressed});

  /// Confirms the PaymentIntent with the card typed in [cardField] (3D Secure opens when the bank asks).
  Future<PaymentSheetOutcome> payByCard({required String publishableKey, required String clientSecret, String? name, String? email, String? phone});

  /// Confirms the PaymentIntent with Google Pay or Apple Pay.
  Future<PaymentSheetOutcome> payByWallet({
    required String publishableKey,
    required String clientSecret,
    required String merchantDisplayName,
    required String merchantCountryCode,
    required String currency,
    required int amountCents,
  });
}

/// A Stripe failure as an outcome: cancelled, or Stripe's own message (never logged).
PaymentSheetOutcome _outcomeOf(Object e, String publishableKey) {
  if (e is StripeException) {
    if (e.error.code == FailureCode.Canceled) return const PaymentSheetOutcome(PaymentSheetResult.canceled);
    return PaymentSheetOutcome(PaymentSheetResult.failed, message: e.error.localizedMessage);
  }
  debugPrint('Payment error: ${e.runtimeType}');
  final testKeys = publishableKey.startsWith('pk_test_');
  return PaymentSheetOutcome(PaymentSheetResult.failed, message: testKeys ? '[test] ${e.runtimeType} : $e' : null);
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
      // Reading `Stripe.publishableKey` before it is set throws StripeConfigException: the setter
      // itself ignores an unchanged value, so set it every time and apply the settings once needed.
      Stripe.publishableKey = publishableKey;
      if (AppConstants.appleMerchantId.isNotEmpty) Stripe.merchantIdentifier = AppConstants.appleMerchantId;
      await Stripe.instance.applySettings();
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: merchantDisplayName,
          style: ThemeMode.light,
          applePay: AppConstants.appleMerchantId.isEmpty ? null : PaymentSheetApplePay(merchantCountryCode: merchantCountryCode),
          googlePay: PaymentSheetGooglePay(
            merchantCountryCode: merchantCountryCode,
            currencyCode: currency.toUpperCase(),
            // Follows the key the server hands out, so an installed build keeps working when Stripe goes live.
            testEnv: !publishableKey.startsWith('pk_live_'),
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
      // Test keys only: the raw error helps diagnose a device or setup problem; never with live keys.
      final testKeys = publishableKey.startsWith('pk_test_');
      return PaymentSheetOutcome(PaymentSheetResult.failed, message: testKeys ? '[test] ${e.runtimeType} : $e' : null);
    }
  }

  Future<void> _setUp(String publishableKey) async {
    Stripe.publishableKey = publishableKey;
    if (AppConstants.appleMerchantId.isNotEmpty) Stripe.merchantIdentifier = AppConstants.appleMerchantId;
    await Stripe.instance.applySettings();
  }

  bool get _ios => defaultTargetPlatform == TargetPlatform.iOS;

  @override
  Future<bool> walletSupported({required String publishableKey, required String currency}) async {
    if (!supported) return false;
    if (_ios && AppConstants.appleMerchantId.isEmpty) return false;
    try {
      await _setUp(publishableKey);
      return await Stripe.instance.isPlatformPaySupported(googlePay: IsGooglePaySupportedParams(testEnv: !publishableKey.startsWith('pk_live_')));
    } catch (e) {
      debugPrint('Wallet check error: ${e.runtimeType}');
      return false;
    }
  }

  @override
  Widget cardField({required ValueChanged<bool> onComplete, bool enabled = true}) => CardField(
    key: const Key('payment-card-field'),
    enablePostalCode: false,
    countryCode: 'FR',
    disabled: !enabled,
    cursorColor: AppColors.accent,
    style: const TextStyle(fontFamily: AppFonts.body, fontSize: 16, color: AppColors.ink),
    decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.symmetric(horizontal: 4)),
    numberHintText: '1234 1234 1234 1234',
    expirationHintText: 'MM/AA',
    cvcHintText: 'CVC',
    onCardChanged: (details) => onComplete(details?.complete ?? false),
  );

  @override
  Widget walletButton({required VoidCallback onPressed}) => PlatformPayButton(
    key: const Key('payment-wallet'),
    type: PlatformButtonType.pay,
    appearance: PlatformButtonStyle.black,
    borderRadius: 16,
    constraints: const BoxConstraints.tightFor(height: 52),
    onPressed: onPressed,
  );

  @override
  Future<PaymentSheetOutcome> payByCard({
    required String publishableKey,
    required String clientSecret,
    String? name,
    String? email,
    String? phone,
  }) async {
    try {
      await _setUp(publishableKey);
      await Stripe.instance.confirmPayment(
        paymentIntentClientSecret: clientSecret,
        data: PaymentMethodParams.card(
          paymentMethodData: PaymentMethodData(
            billingDetails: BillingDetails(name: name, email: email, phone: phone),
          ),
        ),
      );
      return const PaymentSheetOutcome(PaymentSheetResult.completed);
    } catch (e) {
      return _outcomeOf(e, publishableKey);
    }
  }

  @override
  Future<PaymentSheetOutcome> payByWallet({
    required String publishableKey,
    required String clientSecret,
    required String merchantDisplayName,
    required String merchantCountryCode,
    required String currency,
    required int amountCents,
  }) async {
    try {
      await _setUp(publishableKey);
      await Stripe.instance.confirmPlatformPayPaymentIntent(
        clientSecret: clientSecret,
        confirmParams: _ios
            ? PlatformPayConfirmParams.applePay(
                applePay: ApplePayParams(
                  merchantCountryCode: merchantCountryCode,
                  currencyCode: currency.toUpperCase(),
                  cartItems: [ApplePayCartSummaryItem.immediate(label: merchantDisplayName, amount: (amountCents / 100).toStringAsFixed(2))],
                ),
              )
            : PlatformPayConfirmParams.googlePay(
                googlePay: GooglePayParams(
                  testEnv: !publishableKey.startsWith('pk_live_'),
                  merchantName: merchantDisplayName,
                  merchantCountryCode: merchantCountryCode,
                  currencyCode: currency.toUpperCase(),
                ),
              ),
      );
      return const PaymentSheetOutcome(PaymentSheetResult.completed);
    } catch (e) {
      return _outcomeOf(e, publishableKey);
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
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: const Color(0xFFDDDDDD), borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Text('Total', style: AppText.strong()),
                  const Spacer(),
                  Text(amountLabel ?? '', style: AppText.strong()),
                ],
              ),
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
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.line),
                  borderRadius: BorderRadius.circular(12),
                ),
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
    return _demoOutcome;
  }

  PaymentSheetOutcome get _demoOutcome => mode == 'fail'
      ? const PaymentSheetOutcome(PaymentSheetResult.failed, message: 'Votre carte a été refusée.')
      : const PaymentSheetOutcome(PaymentSheetResult.completed);

  @override
  Future<bool> walletSupported({required String publishableKey, required String currency}) async => true;

  @override
  Widget cardField({required ValueChanged<bool> onComplete, bool enabled = true}) => TextField(
    key: const Key('payment-card-field'),
    enabled: enabled,
    keyboardType: TextInputType.number,
    style: AppText.tabular(size: 16),
    decoration: const InputDecoration(border: InputBorder.none, hintText: '1234 1234 1234 1234   MM/AA   CVC'),
    // Démonstration : 4 chiffres suffisent.
    onChanged: (v) => onComplete(v.replaceAll(RegExp(r'\D'), '').length >= 4),
  );

  @override
  Widget walletButton({required VoidCallback onPressed}) => Material(
    color: Colors.black,
    borderRadius: BorderRadius.circular(16),
    child: InkWell(
      key: const Key('payment-wallet'),
      borderRadius: BorderRadius.circular(16),
      onTap: onPressed,
      child: SizedBox(
        height: 52,
        child: Center(
          child: Text('G Pay', style: AppText.strong(size: 17, color: Colors.white)),
        ),
      ),
    ),
  );

  @override
  Future<PaymentSheetOutcome> payByCard({
    required String publishableKey,
    required String clientSecret,
    String? name,
    String? email,
    String? phone,
  }) async => _demoOutcome;

  @override
  Future<PaymentSheetOutcome> payByWallet({
    required String publishableKey,
    required String clientSecret,
    required String merchantDisplayName,
    required String merchantCountryCode,
    required String currency,
    required int amountCents,
  }) async => _demoOutcome;
}
