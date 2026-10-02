import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../../arrival/presentation/bloc/arrival_bloc.dart';
import '../../../arrival/presentation/widgets/arrival_block.dart';
import '../bloc/booking_bloc.dart';
import '../widgets/booking_card.dart';

/// A traveller's booking, opened from the link of the confirmation (deep link
/// /ma-reservation/REF?cle=TOKEN, the same as the site's) or from "Ma réservation".
@RoutePage()
class MyBookingPage extends StatelessWidget implements AutoRouteWrapper {
  const MyBookingPage({super.key, @PathParam('reference') required this.reference, @QueryParam('cle') this.token});

  final String reference;

  /// The manage token from the link: saved to the secure storage, then dropped from the address.
  final String? token;

  @override
  Widget wrappedRoute(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => locator<BookingBloc>()..add(BookingLinkOpened(reference, token: token))),
        BlocProvider(create: (_) => locator<ArrivalBloc>()),
      ],
      child: this,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<BookingBloc, BookingState>(
      listenWhen: (a, b) => a.viewState != b.viewState && b.viewState.isSuccess && a.booking == null,
      listener: (context, state) {
        // The token is in the secure storage now: keep it out of the address bar and history.
        if (kIsWeb && token != null) {
          SystemNavigator.routeInformationUpdated(uri: Uri(path: '/ma-reservation/${state.reference}'), replace: true);
        }
        context.read<ArrivalBloc>().add(ArrivalOpened(state.reference!));
      },
      child: Scaffold(
        appBar: const BrandAppBar(),
        body: SafeArea(
          child: BlocBuilder<BookingBloc, BookingState>(
            builder: (context, booking) {
              if (booking.booking == null) {
                if (booking.viewState.isError) return _Error(message: booking.errorMessage);
                return const Center(child: CircularProgressIndicator(color: AppColors.violet));
              }
              return RefreshIndicator(
                color: AppColors.violet,
                onRefresh: () async {
                  context.read<BookingBloc>().add(const BookingRefreshed());
                  context.read<ArrivalBloc>().add(const ArrivalRefreshRequested());
                },
                child: BlocBuilder<ArrivalBloc, ArrivalState>(
                  buildWhen: (a, b) => a.openKind != b.openKind,
                  builder: (context, arrival) {
                    final kind = arrival.openKind;
                    final title = switch (kind) {
                      ArrivalKind.outbound => 'booking.title_drop_today'.tr(),
                      ArrivalKind.returnTrip => 'booking.title_return_today'.tr(),
                      null => 'booking.title_default'.tr(),
                    };
                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                      children: [
                        Text(title, style: AppText.title(size: 24)),
                        const SizedBox(height: 12),
                        BookingCard(booking: booking.booking!, returnDay: kind == ArrivalKind.returnTrip),
                        const SizedBox(height: 12),
                        const ArrivalBlock(),
                      ],
                    );
                  },
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _Error extends StatelessWidget {
  const _Error({this.message});
  final String? message;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(message ?? 'errors.generic'.tr(), textAlign: TextAlign.center, style: AppText.body()),
        const SizedBox(height: 16),
        GradientButton(label: 'booking.retry'.tr(), onPressed: () => context.read<BookingBloc>().add(const BookingRefreshed())),
      ],
    ),
  );
}
