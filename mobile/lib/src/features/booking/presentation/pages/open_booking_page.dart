import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../bloc/booking_bloc.dart';

/// "Ma réservation": the bookings already opened on this phone, or reference + email.
@RoutePage()
class OpenBookingPage extends StatelessWidget implements AutoRouteWrapper {
  const OpenBookingPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<BookingBloc>()..add(const BookingSavedRequested()), child: this);

  @override
  Widget build(BuildContext context) => const _OpenBookingView();
}

class _OpenBookingView extends StatefulWidget {
  const _OpenBookingView();

  @override
  State<_OpenBookingView> createState() => _OpenBookingViewState();
}

class _OpenBookingViewState extends State<_OpenBookingView> {
  final _form = GlobalKey<FormState>();
  final _reference = TextEditingController();
  final _email = TextEditingController();

  @override
  void dispose() {
    _reference.dispose();
    _email.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_form.currentState!.validate()) return;
    context.read<BookingBloc>().add(BookingLookupSubmitted(reference: _reference.text, email: _email.text));
  }

  @override
  Widget build(BuildContext context) {
    String? required(String? v) => (v == null || v.trim().isEmpty) ? 'open.required'.tr() : null;
    return Scaffold(
      appBar: const BrandAppBar(),
      body: BlocConsumer<BookingBloc, BookingState>(
        listenWhen: (a, b) => a.lookupState != b.lookupState && b.lookupState.isSuccess,
        listener: (context, state) => context.router.replace(MyBookingRoute(reference: state.reference!)),
        builder: (context, state) => SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('open.title'.tr(), style: AppText.title()),
              const SizedBox(height: 6),
              Text('open.intro'.tr(), style: AppText.muted()),
              if (state.savedReferences.isNotEmpty) ...[
                const SizedBox(height: 18),
                Text('open.saved'.tr().toUpperCase(), style: AppText.label()),
                const SizedBox(height: 6),
                for (final ref in state.savedReferences)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.confirmation_number_outlined, color: AppColors.violet),
                    title: Text(ref, style: AppText.tabular()),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => context.router.push(MyBookingRoute(reference: ref)),
                  ),
              ],
              const SizedBox(height: 18),
              Form(
                key: _form,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _reference,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(labelText: 'open.reference'.tr(), hintText: 'R7KQ2M'),
                      validator: required,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      decoration: InputDecoration(labelText: 'open.email'.tr()),
                      validator: required,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    if (state.lookupState.isError && state.errorMessage != null) ...[
                      const SizedBox(height: 10),
                      Text(state.errorMessage!, style: AppText.body(size: 14, color: AppColors.danger)),
                    ],
                    const SizedBox(height: 16),
                    GradientButton(label: 'open.submit'.tr(), busy: state.lookupState.isProcessing, onPressed: _submit),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
