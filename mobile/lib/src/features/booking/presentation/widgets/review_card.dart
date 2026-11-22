import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';

/// Lien d'avis Google, option B (22/11/2026): once the car is handed back, « Ma réservation » asks for a review on the
/// parking's Google page (the link the parking gave in « Ma fiche »; the API sends it only after « Rendu »).
class ReviewCard extends StatelessWidget {
  const ReviewCard({super.key, required this.parking, required this.url});

  final String parking;
  final String url;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        key: const Key('booking-review'),
        padding: const EdgeInsets.all(18),
        decoration: const BoxDecoration(color: AppColors.action, borderRadius: AppRadius.card),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ExcludeSemantics(child: Text('★★★★★', style: AppText.strong(size: 18, color: AppColors.onAccent))),
            const SizedBox(height: 6),
            Text('booking.review_title'.tr(), style: AppText.big(size: 21, color: AppColors.onAccent)),
            const SizedBox(height: 6),
            Text('booking.review_text'.tr(args: [parking]), style: AppText.body(size: 14, color: AppColors.onAccent, height: 1.45)),
            const SizedBox(height: 12),
            FilledButton(
              key: const Key('booking-review-open'),
              onPressed: () => locator<LinkService>().open(Uri.parse(url)),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.surface,
                foregroundColor: AppColors.dark,
                minimumSize: const Size(0, 48),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                shape: const StadiumBorder(),
              ),
              child: Text('booking.review_cta'.tr(), style: AppText.strong(size: 15, color: AppColors.dark)),
            ),
          ],
        ),
      ),
    );
  }
}
