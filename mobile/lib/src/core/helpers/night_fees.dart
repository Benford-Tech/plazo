/// Night fees in the traveller app (12/10/2026, « ajoute des frais de nuit pour les arrivées et départs en heure définie
/// par le parking », direction B « Dans le détail du prix seulement »). The API folds them into every total
/// (`priceCents`), so result cards, map pins, sorts and filters need nothing; the price detail says where they come
/// from (« Frais de nuit · dépôt à 23:30 ») and the parking's page states its rule. The app never computes a fee: it
/// reads the offer's (for the hours asked) or the booking's (frozen at booking) and the parking's rule as the API sends
/// them. Same texts and rules as the site (site/src/lib/night-fees.ts).
library;

import 'package:easy_localization/easy_localization.dart';

import '../../features/search/data/models/public_models.dart';
import 'money.dart';
import 'stay.dart';

/// The night fee a stay pays, or null when it pays none (or the API is older than night fees).
NightFeeModel? chargedNightFee(NightFeeModel? fee) => fee != null && fee.totalCents > 0 ? fee : null;

/// True when this result can be booked and its total includes a night fee (« frais de nuit compris » on the results).
bool hasNightFee(SearchResultModel result) => result.bookable && chargedNightFee(result.nightFee) != null;

/// The price grid's part of a total, printed on « Forfait N jours »: the API's `basePriceCents`, else (older API) the
/// total less its night fee. Null when the stay has no price.
int? basePriceOf({required int? priceCents, int? basePriceCents, NightFeeModel? nightFee}) {
  if (priceCents == null) return null;
  return basePriceCents ?? priceCents - (chargedNightFee(nightFee)?.totalCents ?? 0);
}

/// "2026-10-13T23:30" -> "23:30".
String _hourOf(String local) => local.length >= 16 ? local.substring(11, 16) : local;

/// The label of a stay's night fee line: « Frais de nuit · dépôt à 23:30 », « … · retour à 05:30 » or « … · dépôt à
/// 22:30 et retour à 05:30 », from the ends the fee was charged for and the booked local hours ("YYYY-MM-DDTHH:mm").
/// Null when the stay pays no night fee.
String? nightFeeLabel(NightFeeModel? fee, {required String arrivalAt, required String returnAt}) {
  final charged = chargedNightFee(fee);
  if (charged == null) return null;
  final dropOff = charged.arrivalCents > 0;
  final pickUp = charged.returnCents > 0;
  if (!dropOff && !pickUp) return 'night_fees.title'.tr();
  final when = dropOff && pickUp
      ? 'night_fees.both'.tr(args: [_hourOf(arrivalAt), _hourOf(returnAt)])
      : dropOff
      ? 'night_fees.drop_off'.tr(args: [_hourOf(arrivalAt)])
      : 'night_fees.return'.tr(args: [_hourOf(returnAt)]);
  return 'night_fees.line'.tr(args: [when]);
}

/// The parking's rule: « Ce parking ajoute 15 € pour un dépôt ou un retour entre 22:00 et 06:00. » (one amount for both
/// ends), « … 15 € pour un dépôt et 10 € pour un retour … » (two amounts), or one end only; the amounts in short euros
/// (15 €, 12,50 €). Null when the parking charges no night fee.
String? nightRuleSentence(NightRuleModel? rule) {
  if (rule == null) return null;
  final dropOff = rule.arrivalFeeCents ?? 0;
  final pickUp = rule.returnFeeCents ?? 0;
  if (dropOff <= 0 && pickUp <= 0) return null;
  final fees = dropOff > 0 && pickUp > 0
      ? dropOff == pickUp
            ? 'night_fees.rule_same'.tr(args: [formatShortEuros(dropOff)])
            : 'night_fees.rule_each'.tr(args: [formatShortEuros(dropOff), formatShortEuros(pickUp)])
      : dropOff > 0
      ? 'night_fees.rule_drop_off'.tr(args: [formatShortEuros(dropOff)])
      : 'night_fees.rule_return'.tr(args: [formatShortEuros(pickUp)]);
  return 'night_fees.rule'.tr(args: [fees, rule.start, rule.end]);
}

/// « Forfait 8 jours »: the price grid's line above the night fee.
String packageLabel(int days) => 'night_fees.package'.tr(args: [daysLabel(days)]);

/// « dont 15,00 € de frais de nuit », under the amount a booking was paid (« Ma réservation »). Null when none.
String? nightFeePaidPart(NightFeeModel? fee) {
  final charged = chargedNightFee(fee);
  return charged == null ? null : 'night_fees.paid_part'.tr(args: [formatEuros(charged.totalCents)]);
}
