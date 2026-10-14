import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/highlights.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/demo_tag.dart';
import '../../../../shared/widgets/highlights.dart';
import '../../../../shared/widgets/live_dot.dart';
import '../../../../shared/widgets/shuttle_icon.dart';
import '../../../../shared/widgets/striped_placeholder.dart';
import '../../data/models/public_models.dart';
import '../../domain/logic/shuttle_rail.dart';
import 'shuttle_box.dart';

/// Under this width a card is narrow (every phone): short tags (« Clés à remettre », « 24h/24 »), « ATTENTE ».
const narrowCardWidth = 512.0;

/// One parking of the results (mockup F2): photo with its badges, name, the shuttle box (direction C, 14/10/2026:
/// ride, declared wait and, for a parking whose shuttles are shown live, the live rail L3 fed by the screen's shared
/// poll), the tags, total price for the stay with the price per day, and "Voir". Unavailable parkings are dimmed
/// with "Complet" (or "Pas de tarif").
class ResultCard extends StatelessWidget {
  const ResultCard({
    super.key,
    required this.result,
    required this.onTap,
    this.highlighted = false,
    this.badges = const [],
    this.compact = false,
    this.rail,
    this.liveAt,
    this.airportCode,
  });

  final SearchResultModel result;
  final VoidCallback onTap;
  final bool highlighted;

  /// "Le moins cher", "Navette la plus rapide" (computed over the displayed results).
  final List<ResultBadge> badges;

  /// On the map: no photo, and the shuttle box on one line without the live rail (the card leaves the map in view).
  final bool compact;

  /// L3: this parking's rail from the screen's live answer (null before the first one) and when it came.
  final RailState? rail;
  final DateTime? liveAt;

  /// The airport of the results: « Terminal 1 » at the end of the rail at LYS.
  final String? airportCode;

  @override
  Widget build(BuildContext context) {
    final bookable = result.bookable;
    final chips = factChips(services: result.services, openingHours: result.openingHours, cancellationPolicy: result.cancellationPolicy);
    final shuttle = shuttleBox(
      services: result.services,
      shuttleMinutes: result.shuttleMinutes,
      shuttleWaitMinutes: result.shuttleWaitMinutes,
      liveShuttle: result.liveShuttle,
    );
    // The cards span the screen less its 12–16 px margins.
    final narrow = MediaQuery.sizeOf(context).width - 32 < narrowCardWidth;
    final price = bookable ? formatEuros(result.priceCents!) : null;
    return Semantics(
      container: true,
      button: true,
      label: [
        result.title,
        for (final b in badges) badgeLabel(b),
        if (shuttle != null) shuttleBoxDescription(shuttle, withRail: !compact, rail: rail, airportCode: airportCode),
        if (chips.isNotEmpty) chips.map((c) => c.title ?? c.label).join(', '),
        if (price != null) '$price, ${'results.all_in'.tr(args: [daysLabel(result.days)])}, ${perDayLabel(result.priceCents!, result.days)}',
        if (!bookable) result.priceCents == null ? 'results.no_price'.tr() : 'results.full'.tr(),
        if (result.isDemo) 'results.demo_hint'.tr(),
        if (result.liveShuttle) 'results.live_hint'.tr(),
      ].join('. '),
      excludeSemantics: true,
      child: Opacity(
        opacity: bookable ? 1 : 0.6,
        child: Material(
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: highlighted ? AppColors.accent : AppColors.line, width: highlighted ? 2 : 1),
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
                      if (result.liveShuttle) const Positioned(left: 8, bottom: 8, child: LiveShuttleTag()),
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
                      if (shuttle != null) ...[
                        const SizedBox(height: 8),
                        ShuttleBox(facts: shuttle, narrow: narrow, compact: compact, rail: rail, receivedAt: liveAt, airportCode: airportCode),
                      ],
                      if (chips.isNotEmpty) ...[const SizedBox(height: 8), FactChips(chips: chips, narrow: narrow)],
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

/// I-C (07/10/2026): "EN DIRECT" on a parking whose shuttles are followed live — the dot, the word and the minibus.
class LiveShuttleTag extends StatelessWidget {
  const LiveShuttleTag({super.key});

  @override
  Widget build(BuildContext context) => Container(
    key: const Key('live-shuttle'),
    padding: const EdgeInsets.fromLTRB(8, 4, 9, 4),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: AppRadius.pill,
      boxShadow: [BoxShadow(color: Color(0x33000000), blurRadius: 10, offset: Offset(0, 3))],
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const LiveDot(size: 7),
        const SizedBox(width: 5),
        Text('results.live'.tr().toUpperCase(), style: AppText.label(size: 10.5, color: AppColors.ink)),
        const SizedBox(width: 4),
        const ShuttleIcon(size: 14),
      ],
    ),
  );
}
