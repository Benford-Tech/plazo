import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/listing.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/striped_placeholder.dart';
import '../../data/models/public_models.dart';

/// One parking of the results (mockup A2): photo, name, facts, cancellation terms, total price for
/// the stay and "Voir". Unavailable parkings are dimmed with "Complet" (or "Pas de tarif").
class ResultCard extends StatelessWidget {
  const ResultCard({super.key, required this.result, required this.onTap, this.highlighted = false, this.badge, this.compact = false});

  final SearchResultModel result;
  final VoidCallback onTap;
  final bool highlighted;
  final String? badge;

  /// On the map: no photo.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final bookable = result.bookable;
    final facts = listingFacts(shuttleMinutes: result.shuttleMinutes, distanceKm: result.distanceKm, services: result.services);
    final price = bookable ? formatEuros(result.priceCents!) : null;
    return Semantics(
      container: true,
      button: true,
      label: [
        result.title,
        if (facts.isNotEmpty) facts,
        if (price != null) '$price, ${'results.all_in'.tr(args: [daysLabel(result.days)])}',
        if (!bookable) result.priceCents == null ? 'results.no_price'.tr() : 'results.full'.tr(),
        ?badge,
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
                if (!compact) ParkingPhoto(url: result.photo, height: 92),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (badge != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: AppColors.violet, borderRadius: BorderRadius.circular(12)),
                          child: Text(badge!, style: AppText.strong(size: 11.5, color: Colors.white)),
                        ),
                        const SizedBox(height: 6),
                      ],
                      Text(result.title, style: AppText.title(size: 18)),
                      if (facts.isNotEmpty) ...[const SizedBox(height: 3), Text(facts, style: AppText.muted(size: 12.5))],
                      if (bookable) ...[
                        const SizedBox(height: 3),
                        Text(
                          cancellationLabel(result.cancellationPolicy),
                          style: AppText.body(
                            size: 12.5,
                            weight: 600,
                            color: isFreeCancellation(result.cancellationPolicy) ? const Color(0xFF1F7A3F) : AppColors.muted,
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: bookable
                                ? Text.rich(
                                    TextSpan(
                                      children: [
                                        TextSpan(text: price, style: AppText.strong(size: 20)),
                                        TextSpan(text: '  ${'results.all_in'.tr(args: [daysLabel(result.days)])}', style: AppText.muted(size: 12.5)),
                                      ],
                                    ),
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
