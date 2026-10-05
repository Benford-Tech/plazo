import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../data/models/reservation_models.dart';
import '../bloc/pro_reservations_bloc.dart';
import '../widgets/reservation_tile.dart';

/// App pro, step 1 (04/10/2026): the bookings, searched by plate, name, phone or reference.
@RoutePage()
class ProReservationsPage extends StatelessWidget implements AutoRouteWrapper {
  const ProReservationsPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProReservationsBloc>()..add(const ProReservationsStarted()), child: this);

  @override
  Widget build(BuildContext context) => const _View();
}

class _View extends StatefulWidget {
  const _View();
  @override
  State<_View> createState() => _ViewState();
}

class _ViewState extends State<_View> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 300) context.read<ProReservationsBloc>().add(const ProReservationsMoreRequested());
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _open(BuildContext context, PageRouteInfo route) async {
    final bloc = context.read<ProReservationsBloc>();
    final result = await context.router.push<ReservationModel?>(route);
    if (result != null) bloc.add(ProReservationsUpdated(result));
  }

  @override
  Widget build(BuildContext context) {
    final role = context.watch<ProAuthBloc>().state.staff?.role;
    final manage = can(role, 'reservations:manage');
    return Scaffold(
      appBar: BrandAppBar(
        pro: true,
        title: 'res.title'.tr(),
        actions: [
          if (manage)
            IconButton(
              key: const Key('res-import'),
              tooltip: 'res.import'.tr(),
              icon: const Icon(Icons.mail_outline_rounded),
              onPressed: () => _open(context, const ProImportEmailRoute()),
            ),
        ],
      ),
      floatingActionButton: manage
          ? FloatingActionButton.extended(
              key: const Key('res-new'),
              backgroundColor: AppColors.action,
              foregroundColor: AppColors.onAccent,
              icon: const Icon(Icons.add_rounded),
              label: Text('res.new'.tr()),
              onPressed: () => _open(context, ProReservationFormRoute()),
            )
          : null,
      body: BlocBuilder<ProReservationsBloc, ProReservationsState>(
        builder: (context, state) {
          final bloc = context.read<ProReservationsBloc>();
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: TextField(
                  key: const Key('res-search'),
                  onChanged: (q) => bloc.add(ProReservationsSearched(q)),
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'res.search_hint'.tr(),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.accent),
                  ),
                ),
              ),
              Expanded(
                child: state.viewState.isError && state.items.isEmpty
                    ? Center(child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center))
                    : state.viewState.isProcessing && state.items.isEmpty
                    ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                    : RefreshIndicator(
                        color: AppColors.accent,
                        onRefresh: () async => bloc.add(const ProReservationsRefreshed()),
                        child: ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                          itemCount: state.items.length + 2,
                          itemBuilder: (_, i) {
                            if (i == 0) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text(
                                  state.items.isEmpty ? 'res.none'.tr() : 'res.count'.tr(args: ['${state.total}']),
                                  key: const Key('res-count'),
                                  style: AppText.label(size: 11),
                                ),
                              );
                            }
                            if (i == state.items.length + 1) {
                              return state.loadingMore
                                  ? const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
                                    )
                                  : const SizedBox.shrink();
                            }
                            final r = state.items[i - 1];
                            return ReservationTile(
                              key: Key('res-${r.id}'),
                              reservation: r,
                              onTap: () => _open(context, ProReservationRoute(id: r.id)),
                            );
                          },
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
