import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/plate_field.dart';
import '../../../search/domain/usecases/public_use_cases.dart';
import '../../../trips/presentation/bloc/trips_bloc.dart';
import '../../domain/booking_draft.dart';
import '../bloc/booking_form_bloc.dart';
import '../widgets/booking_steps.dart';

/// A4, step 1 "Vos informations" (the site's /:airport/:parking/reserver): the same fields and
/// rules as the site's form; the API makes the booking and computes the price.
@RoutePage()
class BookingFormPage extends StatelessWidget implements AutoRouteWrapper {
  const BookingFormPage({
    super.key,
    @PathParam('airport') required this.airport,
    @PathParam('parking') required this.parking,
    @QueryParam('arrivee') this.arrivee,
    @QueryParam('retour') this.retour,
  });

  final String airport;
  final String parking;
  final String? arrivee;
  final String? retour;

  @override
  Widget wrappedRoute(BuildContext context) {
    // A link without dates: the site's default stay (the API checks them anyway).
    final fallback = defaultStay(DateTime.now());
    return BlocProvider(
      create: (_) => locator<BookingFormBloc>(
        param1: StayParams(airport: airport, parking: parking, arrivalAt: arrivee ?? fallback.arrival, returnAt: retour ?? fallback.returnAt),
      )..add(const BookingFormStarted()),
      child: this,
    );
  }

  @override
  Widget build(BuildContext context) => const BookingFormView();
}

class BookingFormView extends StatefulWidget {
  const BookingFormView({super.key});

  @override
  State<BookingFormView> createState() => _BookingFormViewState();
}

class _BookingFormViewState extends State<BookingFormView> {
  late final TextEditingController _name, _phone, _email, _plate, _flight;
  int _passengers = 1;
  bool _terms = false;

  /// Fields changed since the last submission: their old error is hidden.
  final _edited = <String>{};
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    final d = context.read<BookingFormBloc>().state.draft ?? const BookingDraft();
    _name = TextEditingController(text: d.customerName);
    _phone = TextEditingController(text: d.customerPhone);
    _email = TextEditingController(text: d.customerEmail);
    _plate = TextEditingController(text: d.plate);
    _flight = TextEditingController(text: d.returnFlight);
    _passengers = d.passengers;
    _terms = d.acceptTerms;
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _plate, _flight]) {
      c.dispose();
    }
    _scroll.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    setState(_edited.clear);
    context.read<BookingFormBloc>().add(
      BookingFormSubmitted(
        BookingDraft(
          customerName: _name.text,
          customerPhone: _phone.text,
          customerEmail: _email.text,
          plate: _plate.text,
          returnFlight: _flight.text,
          passengers: _passengers,
          acceptTerms: _terms,
        ),
      ),
    );
  }

  void _onState(BuildContext context, BookingFormState state) {
    final created = state.created;
    if (state.submitState.isSuccess && created != null) {
      locator<TripsBloc>().add(const TripsLoaded(quiet: true));
      if (created.booking.status == 'pending_payment') {
        context.router.replace(PaymentRoute(reference: created.reference));
      } else {
        context.router.replace(MyBookingRoute(reference: created.reference, confirmee: '1'));
      }
    } else if (state.submitState.isError) {
      _scroll.animateTo(0, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingFormBloc, BookingFormState>(
      listenWhen: (a, b) => a.submitState != b.submitState,
      listener: _onState,
      builder: (context, state) {
        String? err(String field) =>
            state.fieldErrors[field] == null || _edited.contains(field) ? null : translateErrorCode(state.fieldErrors[field]);
        final total = state.priceCents == null ? '' : formatEuros(state.priceCents!);
        return Scaffold(
          appBar: AppBar(titleSpacing: NavigationToolbar.kMiddleSpacing, title: Text('book.title'.tr(), style: AppText.strong(size: 16, color: Colors.white))),
          body: state.loadState.isProcessing || state.loadState.isIdle
              ? const Center(child: CircularProgressIndicator(color: AppColors.violet))
              : SafeArea(
                  top: false,
                  child: ListView(
                    controller: _scroll,
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
                    children: [
                      if (state.online) ...[const BookingSteps(current: 1), const SizedBox(height: 14)],
                      _Recap(state: state, total: total),
                      if (state.errorCode != null && state.submitState.isError || state.loadState.isError) ...[
                        const SizedBox(height: 12),
                        _ErrorBanner(state: state, hiddenErrors: [err('arrivalAt'), err('returnAt')].whereType<String>().toList()),
                      ],
                      const SizedBox(height: 16),
                      Semantics(header: true, child: Text('book.your_details'.tr(), style: AppText.title(size: 21))),
                      const SizedBox(height: 12),
                      _field(
                        key: const Key('field-name'),
                        field: 'customerName',
                        controller: _name,
                        label: 'book.name'.tr(),
                        error: err('customerName'),
                        autofill: AutofillHints.name,
                        capitalization: TextCapitalization.words,
                      ),
                      _field(
                        key: const Key('field-phone'),
                        field: 'customerPhone',
                        controller: _phone,
                        label: 'book.phone'.tr(),
                        error: err('customerPhone'),
                        autofill: AutofillHints.telephoneNumber,
                        keyboard: TextInputType.phone,
                      ),
                      _field(
                        key: const Key('field-email'),
                        field: 'customerEmail',
                        controller: _email,
                        label: 'book.email'.tr(),
                        error: err('customerEmail'),
                        autofill: AutofillHints.email,
                        keyboard: TextInputType.emailAddress,
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: ValueListenableBuilder(
                          valueListenable: _plate,
                          builder: (context, value, _) => PlateField(
                            key: const Key('field-plate'),
                            controller: _plate,
                            label: 'book.plate'.tr(),
                            errorText: err('plate'),
                            onChanged: (_) {
                              if (_edited.add('plate')) setState(() {});
                            },
                            helperText: value.text.trim().length < 4
                                ? 'book.plate_hint'.tr()
                                : (isFrenchPlate(value.text) ? 'book.plate_french'.tr() : 'book.plate_foreign'.tr()),
                          ),
                        ),
                      ),
                      _field(
                        key: const Key('field-flight'),
                        field: 'returnFlight',
                        controller: _flight,
                        label: 'book.flight'.tr(),
                        hint: 'TO 3627',
                        helper: 'book.flight_hint'.tr(),
                        error: err('returnFlight'),
                        capitalization: TextCapitalization.characters,
                        maxLength: 10,
                      ),
                      DropdownButtonFormField<int>(
                        key: const Key('field-passengers'),
                        initialValue: _passengers,
                        decoration: InputDecoration(labelText: 'book.passengers'.tr(), errorText: err('passengers')),
                        items: [for (var i = 1; i <= 9; i++) DropdownMenuItem(value: i, child: Text('$i'))],
                        onChanged: (v) => setState(() {
                          _passengers = v ?? 1;
                          _edited.add('passengers');
                        }),
                      ),
                      if (!state.online) ...[
                        const SizedBox(height: 18),
                        AppCard(
                          color: AppColors.canvas,
                          borderColor: AppColors.canvas,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('book.pay_on_site'.tr(), style: AppText.strong()),
                              const SizedBox(height: 4),
                              Text('book.pay_on_site_text'.tr(args: [total]), style: AppText.body(size: 14, height: 1.45)),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 14),
                      _Terms(
                        value: _terms,
                        error: err('acceptTerms'),
                        onChanged: (v) => setState(() {
                          _terms = v;
                          _edited.add('acceptTerms');
                        }),
                      ),
                      const SizedBox(height: 14),
                      GradientButton(
                        key: const Key('booking-submit'),
                        label: state.online ? 'book.submit_online'.tr() : 'book.submit_on_site'.tr(),
                        busy: state.submitState.isProcessing,
                        onPressed: state.loadState.isSuccess ? _submit : null,
                      ),
                      if (state.online && total.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text('book.payment_next'.tr(args: [total]), textAlign: TextAlign.center, style: AppText.muted(size: 13)),
                      ],
                      const SizedBox(height: 6),
                      Text('book.no_account'.tr(), textAlign: TextAlign.center, style: AppText.muted(size: 13)),
                    ],
                  ),
                ),
        );
      },
    );
  }

  Widget _field({
    required Key key,
    required String field,
    required TextEditingController controller,
    required String label,
    String? error,
    String? hint,
    String? helper,
    String? autofill,
    TextInputType? keyboard,
    TextCapitalization capitalization = TextCapitalization.none,
    int? maxLength,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: TextField(
      key: key,
      controller: controller,
      keyboardType: keyboard,
      textCapitalization: capitalization,
      maxLength: maxLength,
      autofillHints: autofill == null ? null : [autofill],
      onChanged: (_) {
        if (_edited.add(field)) setState(() {});
      },
      decoration: InputDecoration(labelText: label, hintText: hint, helperText: helper, errorText: error, counterText: '', helperMaxLines: 2, errorMaxLines: 3),
    ),
  );
}

class _Recap extends StatelessWidget {
  const _Recap({required this.state, required this.total});
  final BookingFormState state;
  final String total;

  @override
  Widget build(BuildContext context) {
    final p = state.parkingResponse?.parking;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (p != null) Text(p.title, style: AppText.title(size: 19)),
          const SizedBox(height: 4),
          Text('${'manage.drop_off'.tr()} : ${formatDateTime(state.arrivalAt)}', style: AppText.muted()),
          Text('${'manage.pick_up'.tr()} : ${formatDateTime(state.returnAt)}', style: AppText.muted()),
          if (total.isNotEmpty) ...[
            const Divider(height: 18, color: AppColors.line),
            RecapRow(
              left: Text(
                '${state.online ? 'book.total'.tr() : 'book.total_on_site'.tr()} · ${daysLabel(state.days ?? stayDays(state.arrivalAt, state.returnAt))}',
                style: AppText.strong(),
              ),
              right: Text(total, style: AppText.strong(size: 18)),
            ),
          ],
        ],
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.state, required this.hiddenErrors});
  final BookingFormState state;
  final List<String> hiddenErrors;

  @override
  Widget build(BuildContext context) {
    final code = state.errorCode;
    final unavailable = state.unavailable;
    return Semantics(
      liveRegion: true,
      container: true,
      child: Container(
        key: const Key('booking-error'),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFFCE8E6),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFF2B8B5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (unavailable) ...[
              Text('book.unavailable_title'.tr(), style: AppText.strong(color: AppColors.danger)),
              const SizedBox(height: 4),
              Text(translateErrorCode(code), style: AppText.body(size: 14, color: AppColors.danger)),
              if (state.fullNights.isNotEmpty)
                Text(
                  'book.full_nights'.tr(args: [state.fullNights.map(formatDay).join(', ')]),
                  style: AppText.body(size: 14, color: AppColors.danger),
                ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(
                    onPressed: () => context.router.popUntil((r) => r.settings.name == ResultsRoute.name || r.isFirst),
                    style: OutlinedButton.styleFrom(minimumSize: const Size(48, 48), shape: const StadiumBorder()),
                    child: Text('book.see_other'.tr()),
                  ),
                  OutlinedButton(
                    onPressed: () => context.router.maybePop(),
                    style: OutlinedButton.styleFrom(minimumSize: const Size(48, 48), shape: const StadiumBorder()),
                    child: Text('book.change_dates'.tr()),
                  ),
                ],
              ),
            ] else ...[
              Text(code == 'validation_failed' ? 'book.fix_errors'.tr() : translateErrorCode(code), style: AppText.strong(color: AppColors.danger)),
              for (final e in hiddenErrors) Text(e, style: AppText.body(size: 14, color: AppColors.danger)),
            ],
          ],
        ),
      ),
    );
  }
}

class _Terms extends StatefulWidget {
  const _Terms({required this.value, required this.onChanged, this.error});
  final bool value;
  final ValueChanged<bool> onChanged;
  final String? error;

  @override
  State<_Terms> createState() => _TermsState();
}

class _TermsState extends State<_Terms> {
  late final TapGestureRecognizer _link = TapGestureRecognizer()
    ..onTap = () {
      final links = locator<LinkService>();
      links.open(links.sitePage('/conditions'));
    };

  @override
  void dispose() {
    _link.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MergeSemantics(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 48,
                height: 48,
                child: Checkbox(
                  key: const Key('field-terms'),
                  value: widget.value,
                  activeColor: AppColors.violet,
                  isError: widget.error != null,
                  onChanged: (v) => widget.onChanged(v ?? false),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text.rich(
                    TextSpan(
                      style: AppText.body(size: 14, height: 1.4),
                      children: [
                        TextSpan(text: 'book.terms_before'.tr()),
                        TextSpan(
                          text: 'book.terms_link'.tr(args: [Product.name]),
                          style: AppText.body(size: 14, weight: 600, color: AppColors.violet).copyWith(decoration: TextDecoration.underline),
                          recognizer: _link,
                        ),
                        TextSpan(text: 'book.terms_after'.tr()),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (widget.error != null)
          Padding(
            padding: const EdgeInsets.only(left: 48),
            child: Text(widget.error!, style: AppText.body(size: 13, color: AppColors.danger)),
          ),
      ],
    );
  }
}
