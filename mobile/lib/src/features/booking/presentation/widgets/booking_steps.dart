import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../paperwork/data/datasources/paperwork_data_source.dart';

/// « Ma réservation », mix of A and C (13/11/2026): one step of the stay, a numbered dot on a rail and what belongs to
/// it. The current step is lit orange; the others stay grey.
class BookingStep extends StatelessWidget {
  const BookingStep({super.key, required this.number, required this.title, required this.children, this.current = false, this.last = false});

  final int number;
  final String title;
  final List<Widget> children;
  final bool current;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: current ? AppColors.action : AppColors.surface,
                    border: Border.all(color: current ? AppColors.action : AppColors.line, width: 2),
                  ),
                  child: Text('$number', style: AppText.strong(size: 13, color: current ? AppColors.onAccent : AppColors.muted)),
                ),
                if (!last) Expanded(child: Container(width: 2, color: AppColors.line)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: last ? 0 : 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 2, bottom: 8),
                    child: Semantics(header: true, child: Text(title, style: AppText.strong(size: 16))),
                  ),
                  ...children,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A: the next thing to do, as the screen's one orange card. Today: the contract to sign in the app (13/11/2026); the
/// card is gone once it is signed or when it is signed at the counter.
class NextStepHero extends StatefulWidget {
  const NextStepHero({super.key, required this.reference});
  final String reference;

  @override
  State<NextStepHero> createState() => _NextStepHeroState();
}

class _NextStepHeroState extends State<NextStepHero> {
  bool _toSign = false;
  String _phone = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await locator<PaperworkDataSource>().load(TravellerOwner(widget.reference));
      if (!mounted) return;
      setState(() {
        _toSign = data.contract.travellerCanSign && !data.contract.isSigned;
        _phone = data.contract.phoneMasked;
      });
    } catch (_) {
      // No card: the contract card of the first step stays the way in.
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_toSign) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        key: const Key('next-step'),
        padding: const EdgeInsets.all(18),
        decoration: const BoxDecoration(color: AppColors.action, borderRadius: AppRadius.card),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('booking.next_kicker'.tr().toUpperCase(), style: AppText.label(size: 11.5, color: AppColors.onBrandSoft)),
            const SizedBox(height: 6),
            Text('booking.next_contract_title'.tr(), style: AppText.big(size: 21, color: AppColors.onAccent)),
            const SizedBox(height: 6),
            Text('booking.next_contract_text'.tr(args: [_phone]), style: AppText.body(size: 14, color: AppColors.onAccent, height: 1.45)),
            const SizedBox(height: 12),
            FilledButton(
              key: const Key('next-step-sign'),
              onPressed: () async {
                await context.router.push(TravellerContractRoute(reference: widget.reference));
                await _load();
              },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.surface,
                foregroundColor: AppColors.dark,
                minimumSize: const Size(0, 48),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                shape: const StadiumBorder(),
              ),
              child: Text('booking.next_contract_cta'.tr(), style: AppText.strong(size: 15, color: AppColors.dark)),
            ),
          ],
        ),
      ),
    );
  }
}
