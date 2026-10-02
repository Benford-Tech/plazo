import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../booking/presentation/bloc/booking_bloc.dart';

/// "Ajouter une réservation": reference + email (the site's "Ma réservation" form). The manage
/// token goes to the secure storage; returns the reference added.
Future<String?> showAddBookingSheet(BuildContext context) => showModalBottomSheet<String>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  backgroundColor: Colors.white,
  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
  builder: (_) => BlocProvider(create: (_) => locator<BookingBloc>(), child: const AddBookingForm()),
);

class AddBookingForm extends StatefulWidget {
  const AddBookingForm({super.key});

  @override
  State<AddBookingForm> createState() => _AddBookingFormState();
}

class _AddBookingFormState extends State<AddBookingForm> {
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
    context.read<BookingBloc>().add(BookingLookupSubmitted(reference: _reference.text.trim(), email: _email.text.trim()));
  }

  @override
  Widget build(BuildContext context) {
    String? required(String? v) => (v == null || v.trim().isEmpty) ? 'open.required'.tr() : null;
    return BlocConsumer<BookingBloc, BookingState>(
      listenWhen: (a, b) => a.lookupState != b.lookupState && b.lookupState.isSuccess,
      listener: (context, state) => Navigator.of(context).pop(state.reference),
      builder: (context, state) => Padding(
        padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.viewInsetsOf(context).bottom),
        child: Form(
          key: _form,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Semantics(header: true, child: Text('open.title'.tr(), style: AppText.title(size: 22))),
              const SizedBox(height: 6),
              Text('open.intro'.tr(), style: AppText.muted()),
              const SizedBox(height: 14),
              TextFormField(
                key: const Key('add-reference'),
                controller: _reference,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(labelText: 'open.reference'.tr(), hintText: 'R7KQ2M'),
                validator: required,
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('add-email'),
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                decoration: InputDecoration(labelText: 'open.email'.tr()),
                validator: required,
                onFieldSubmitted: (_) => _submit(),
              ),
              if (state.lookupState.isError) ...[
                const SizedBox(height: 10),
                Semantics(
                  liveRegion: true,
                  child: Text(
                    state.errorMessage ?? 'errors.generic'.tr(),
                    key: const Key('add-error'),
                    style: AppText.body(size: 14, color: AppColors.danger),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              GradientButton(key: const Key('add-submit'), label: 'open.submit'.tr(), busy: state.lookupState.isProcessing, onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}
