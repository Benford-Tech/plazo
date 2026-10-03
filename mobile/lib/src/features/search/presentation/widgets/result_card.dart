import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/highlights.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/demo_tag.dart';
import '../../../../shared/widgets/highlights.dart';
import '../../../../shared/widgets/striped_placeholder.dart';
import '../../data/models/public_models.dart';

/// One parking of the results (mockup F2): photo with its badges, name, fact chips, total price
/// for the stay with the price per day, and "Voir". Unavailable parkings are dimmed with
/// "Complet" (or "Pas de tarif").
class ResultCard extends StatelessWidget {
  const ResultCard({super.key, required this.result, required this.onTap, this.highlighted = false, this.badges = const [], this.compact = false});

  final SearchResultModel result;
  final VoidCallback onTap;
  final bool highlighted;

  /// "Le moins cher", "Navette la plus rapide" (computed over the displayed results).
  final List<ResultBadge> badges;

  /// On the map: no photo.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final bookable = result.bookable;
    final chips = factChips(services: result.services, shuttleMinutes: result.shuttleMinutes, cancellationPolicy: result.cancellationPolicy);
    final price = bookable ? formatEuros(result.priceCents!) : null;
    return Semantics(
      container: true,
      button: true,
      label: [
        result.title,
        for (final b in badges) badgeLabel(b),
        if (chips.isNotEmpty) chips.map((c) => c.title ?? c.label).join(', '),
        if (price != null) '$price, ${'results.all_in'.tr(args: [daysLabel(result.days)])}, ${perDayLabel(result.priceCents!, result.days)}',
        if (!bookable) result.priceCents == null ? 'results.no_price'.tr() : 'results.full'.tr(),
        if (result.isDemo) 'results.demo_hint'.tr(),
      ].join('. '),
      excludeSemantics: true,
      child: Opacity(
        opacity: bookable ? 1 : 0.6,
        child: Material(
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: highlighted ? AppColors.violet : AppColors.line, width: highlighted ? 2 : 1),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            key: Key('result-${result.slug}'),
            onTap: onTap,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (!compact)
                  Stack(
                    children: [
                      ParkingPhoto(url: result.photo, height: 92),
                      if (badges.isNotEmpty) Positioned(top: 8, right: 8, child: ResultBadges(badges: badges, alignEnd: true)),
                    ],
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (compact && badges.isNotEmpty) ...[ResultBadges(badges: badges), const SizedBox(height: 6)],
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Flexible(child: Text(result.title, style: AppText.title(size: 18))),
                          if (result.isDemo) ...[const SizedBox(width: 8), const DemoTag()],
                        ],
                      ),
                      if (chips.isNotEmpty) ...[const SizedBox(height: 6), FactChips(chips: chips)],
                      const SizedBox(height: 10),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: bookable
                                ? Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text.rich(
                                        TextSpan(
                                          children: [
                                            TextSpan(text: price, style: AppText.strong(size: 20)),
                                            TextSpan(text: ' · ${perDayLabel(result.priceCents!, result.days)}', style: AppText.muted(size: 12.5)),
                                          ],
                                        ),
                                      ),
                                      Text('results.all_in'.tr(args: [daysLabel(result.days)]), style: AppText.muted(size: 12)),
                                    ],
                                  )
                                : Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        result.priceCents == null ? 'results.no_price'.tr() : 'results.full'.tr(),
                                        style: AppText.strong(size: 15, color: AppColors.muted),
                                      ),
                                      Text(
                                        result.priceCents == null ? 'results.no_price_hint'.tr() : 'results.full_hint'.tr(),
                                        style: AppText.muted(size: 12.5),
                                      ),
                                    ],
                                  ),
                          ),
                          if (bookable)
                            Container(
                              height: 40,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(gradient: AppColors.primaryGradient, borderRadius: BorderRadius.circular(20)),
                              child: Text('results.see'.tr(), style: AppText.strong(size: 14, color: Colors.white)),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
