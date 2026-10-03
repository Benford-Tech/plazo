import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/helpers/highlights.dart';
import '../theme/theme.dart';

/// Small pieces of reassurance shared by the results and the parking page: the badges of a
/// result, the fact chips of a card and the trust tiles of a parking page (direction D).

IconData chipIconData(ChipIcon icon) => switch (icon) {
  ChipIcon.shuttle => Icons.directions_bus_rounded,
  ChipIcon.fenced => Icons.lock_outline_rounded,
  ChipIcon.covered => Icons.home_outlined,
  ChipIcon.ev => Icons.bolt_rounded,
  ChipIcon.valet => Icons.key_rounded,
  ChipIcon.cancel => Icons.undo_rounded,
  ChipIcon.warning => Icons.warning_amber_rounded,
};

const _tileIcon = {
  TileKind.shuttle: ChipIcon.shuttle,
  TileKind.security: ChipIcon.fenced,
  TileKind.cancellation: ChipIcon.cancel,
  TileKind.keys: ChipIcon.valet,
};

/// The fact chips of a result card ("8 min", "Clôturé", "Gratuit 24 h"…).
class FactChips extends StatelessWidget {
  const FactChips({super.key, required this.chips});

  final List<FactChip> chips;

  @override
  Widget build(BuildContext context) {
    if (chips.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final chip in chips)
          Semantics(
            label: chip.title ?? chip.label,
            excludeSemantics: true,
            child: Container(
              padding: const EdgeInsets.fromLTRB(7, 3, 9, 3),
              decoration: BoxDecoration(color: AppColors.tintSoft, borderRadius: BorderRadius.circular(10)),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(chipIconData(chip.icon), size: 14, color: chip.icon == ChipIcon.warning ? AppColors.danger : AppColors.accent),
                  const SizedBox(width: 4),
                  Text(chip.label, style: AppText.body(size: 12, color: chip.icon == ChipIcon.warning ? AppColors.danger : AppColors.ink)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

/// Badges of a result, stacked: "Le moins cher" (violet), "Navette la plus rapide" (peach).
class ResultBadges extends StatelessWidget {
  const ResultBadges({super.key, required this.badges, this.alignEnd = false});

  final List<ResultBadge> badges;

  /// Over a photo: stuck to its top-right corner.
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    if (badges.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final (i, badge) in badges.indexed)
          Padding(
            padding: EdgeInsets.only(top: i == 0 ? 0 : 4),
            child: Container(
              key: Key('badge-${badge.name}'),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: badge == ResultBadge.cheapest ? AppColors.accent : AppColors.peach, borderRadius: BorderRadius.circular(12)),
              child: Text(badgeLabel(badge), style: AppText.strong(size: 11.5, color: Colors.white)),
            ),
          ),
      ],
    );
  }
}

/// The trust band of a parking page: up to four tiles, two per row.
class TrustBand extends StatelessWidget {
  const TrustBand({super.key, required this.tiles});

  final List<TrustTile> tiles;

  @override
  Widget build(BuildContext context) {
    if (tiles.isEmpty) return const SizedBox.shrink();
    return Semantics(
      label: 'highlights.band'.tr(),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = (constraints.maxWidth - 8) / 2;
          return Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final tile in tiles)
                SizedBox(
                  width: width,
                  child: Container(
                    key: Key('tile-${tile.kind.name}'),
                    padding: const EdgeInsets.fromLTRB(10, 9, 10, 9),
                    decoration: BoxDecoration(border: Border.all(color: AppColors.line), borderRadius: BorderRadius.circular(14)),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: const BoxDecoration(color: AppColors.tintSoft, shape: BoxShape.circle),
                          child: Icon(chipIconData(_tileIcon[tile.kind]!), size: 15, color: AppColors.accent),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(tile.title, style: AppText.strong(size: 13)),
                              Text(tile.text, style: AppText.muted(size: 12.5).copyWith(height: 1.3)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

/// "Nouveau sur Plazo" next to a parking's title (no reviews yet on the platform).
class NewOnPlatformTag extends StatelessWidget {
  const NewOnPlatformTag({super.key, required this.productName});

  final String productName;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: AppColors.tintSoft, borderRadius: BorderRadius.circular(12)),
      child: Text('highlights.new_on_platform'.tr(args: [productName]), style: AppText.body(size: 11, weight: 600, color: AppColors.muted)),
    );
  }
}
