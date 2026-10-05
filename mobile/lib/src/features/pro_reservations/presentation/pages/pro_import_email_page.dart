import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/models/reservation_models.dart';
import '../bloc/pro_import_bloc.dart';

/// Paste a comparator's confirmation email: what was read, what is missing, then the form.
@RoutePage()
class ProImportEmailPage extends StatefulWidget implements AutoRouteWrapper {
  const ProImportEmailPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProImportBloc>(), child: this);

  @override
  State<ProImportEmailPage> createState() => _ProImportEmailPageState();
}

class _ProImportEmailPageState extends State<ProImportEmailPage> {
  final _text = TextEditingController();

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProImportBloc, ProImportState>(
      builder: (context, state) {
        final bloc = context.read<ProImportBloc>();
        final r = state.result;
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: 'res.import'.tr()),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
            children: [
              Text('res.import_intro'.tr(args: [Product.name]), style: AppText.muted()),
              const SizedBox(height: 12),
              TextField(
                key: const Key('import-text'),
                controller: _text,
                maxLines: 10,
                decoration: InputDecoration(hintText: 'res.import_hint'.tr(), alignLabelWithHint: true),
              ),
              const SizedBox(height: 12),
              GradientButton(
                key: const Key('import-read'),
                label: 'res.import_read'.tr(),
                busy: state.viewState.isProcessing,
                onPressed: () => bloc.add(ProImportParsed(_text.text)),
              ),
              if (state.viewState.isError) ...[
                const SizedBox(height: 12),
                Text(
                  state.errorCode == 'unrecognised_email' ? 'res.import_unknown'.tr() : translateErrorCode(state.errorCode),
                  style: AppText.body(size: 14, color: AppColors.danger),
                ),
              ],
              if (r != null) ...[
                const SizedBox(height: 18),
                Text('res.import_from'.tr(args: [r.parsed.provider]).toUpperCase(), style: AppText.label(size: 11)),
                const SizedBox(height: 8),
                for (final (label, value) in _rows(r.parsed))
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(
                      children: [
                        SizedBox(width: 110, child: Text(label, style: AppText.muted(size: 13))),
                        Expanded(
                          child: Text(
                            value ?? 'res.import_missing'.tr(),
                            style: value == null ? AppText.body(size: 14, color: AppColors.danger) : AppText.body(size: 14, weight: 600),
                          ),
                        ),
                      ],
                    ),
                  ),
                if (r.duplicate != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    'res.import_duplicate'.tr(args: [r.duplicate!.reference]),
                    key: const Key('import-duplicate'),
                    style: AppText.body(size: 14, color: AppColors.danger),
                  ),
                  const SizedBox(height: 8),
                  OutlineAction(
                    label: 'res.import_open'.tr(),
                    onPressed: () => context.router.replace(ProReservationRoute(id: r.duplicate!.id)),
                  ),
                ] else ...[
                  const SizedBox(height: 12),
                  GradientButton(
                    key: const Key('import-continue'),
                    label: r.missing.isEmpty ? 'res.import_continue'.tr() : 'res.import_complete'.tr(),
                    onPressed: () async {
                      final saved = await context.router.push<ReservationModel?>(ProReservationFormRoute(initial: state.input));
                      if (saved != null && context.mounted) await context.router.maybePop(saved);
                    },
                  ),
                ],
              ],
            ],
          ),
        );
      },
    );
  }

  static List<(String, String?)> _rows(ParsedBookingModel p) => [
    ('res.arrival'.tr(), p.arrivalAt?.replaceFirst('T', ' ')),
    ('res.return'.tr(), p.returnAt?.replaceFirst('T', ' ')),
    ('res.customer'.tr(), p.customerName),
    ('res.phone'.tr(), p.customerPhone),
    ('res.plate'.tr(), p.plate),
    if (p.departureFlight != null) ('res.departure_flight'.tr(), p.departureFlight),
    if (p.returnFlight != null) ('res.return_flight'.tr(), p.returnFlight),
    if (p.externalReference != null) ('res.external_reference'.tr(), p.externalReference),
    if (p.priceCents != null) ('res.price'.tr(), '${(p.priceCents! / 100).toStringAsFixed(2).replaceAll('.', ',')} €'),
  ];
}
