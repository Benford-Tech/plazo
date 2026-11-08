import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/child_seat_widgets.dart';
import '../../../../shared/widgets/direct_badge.dart';
import '../../../../shared/widgets/movement_kind.dart';
import '../../../../shared/widgets/segmented.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/plate_field.dart';
import '../../data/models/reservation_models.dart';
import '../bloc/pro_reservation_form_bloc.dart';

const _channels = ['phone', 'counter', 'website', 'aggregator', 'import'];

String _defaultStart() {
  final now = DateTime.now();
  final d = DateTime(now.year, now.month, now.day + 1, 6, 0);
  return DateFormat("yyyy-MM-dd'T'HH:mm").format(d);
}

String _defaultEnd() {
  final now = DateTime.now();
  final d = DateTime(now.year, now.month, now.day + 8, 18, 0);
  return DateFormat("yyyy-MM-dd'T'HH:mm").format(d);
}

/// New booking (phone, counter), edit, or a booking read from a confirmation email.
@RoutePage()
class ProReservationFormPage extends StatelessWidget implements AutoRouteWrapper {
  const ProReservationFormPage({super.key, this.id, this.initial});

  /// Null for a new booking.
  final String? id;
  final ReservationInput? initial;

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(
    create: (_) => ProReservationFormBloc(
      locator(),
      locator(),
      id: id,
      initial: initial ?? ReservationInput(arrivalAt: _defaultStart(), returnAt: _defaultEnd()),
    ),
    child: this,
  );

  @override
  Widget build(BuildContext context) => _Form(editing: id != null);
}

class _Form extends StatefulWidget {
  const _Form({required this.editing});
  final bool editing;
  @override
  State<_Form> createState() => _FormState();
}

class _FormState extends State<_Form> {
  late final _bloc = context.read<ProReservationFormBloc>();

  late final _firstName = TextEditingController(text: _bloc.state.input.customerFirstName);
  late final _lastName = TextEditingController(text: _bloc.state.input.customerLastName);
  late final _phone = TextEditingController(text: _bloc.state.input.customerPhone);
  late final _email = TextEditingController(text: _bloc.state.input.customerEmail ?? '');
  late final _plate = TextEditingController(text: _bloc.state.input.plate);
  late final _flight = TextEditingController(text: _bloc.state.input.returnFlight ?? '');
  late final _outbound = TextEditingController(text: _bloc.state.input.departureFlight ?? '');
  late final _detail = TextEditingController(text: _bloc.state.input.channelDetail ?? '');
  late final _notes = TextEditingController(text: _bloc.state.input.notes ?? '');
  late final _vehicleModel = TextEditingController(text: _bloc.state.input.vehicleModel ?? '');
  late final _vehicleColour = TextEditingController(text: _bloc.state.input.vehicleColour ?? '');
  late final _customerNote = TextEditingController(text: _bloc.state.input.customerNote ?? '');
  late final _price = TextEditingController(text: _bloc.state.priceText);

  /// The child seats' counters, folded until opened or there are children (02/11/2026).
  bool _seatsOpen = false;

  @override
  void dispose() {
    for (final c in [
      _firstName,
      _lastName,
      _phone,
      _email,
      _plate,
      _flight,
      _outbound,
      _detail,
      _notes,
      _vehicleModel,
      _vehicleColour,
      _customerNote,
      _price,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _set(ReservationInput Function(ReservationInput) change) => _bloc.add(ProReservationFormChanged(change(_bloc.state.input)));

  Future<void> _pick(String current, void Function(String) apply) async {
    final base = DateTime.tryParse(current) ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: base,
      firstDate: DateTime(2024),
      lastDate: DateTime(2032),
      locale: const Locale('fr'),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: base.hour, minute: base.minute),
    );
    if (time == null) return;
    apply(DateFormat("yyyy-MM-dd'T'HH:mm").format(DateTime(date.year, date.month, date.day, time.hour, time.minute)));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProReservationFormBloc, ProReservationFormState>(
      listenWhen: (a, b) => a.saveState != b.saveState,
      listener: (context, state) {
        if (state.saveState.isError && state.errorCode != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(translateErrorCode(state.errorCode))));
        }
        if (state.saved != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('res.saved'.tr(args: [state.saved!.reference]))));
          context.router.maybePop(state.saved);
        }
      },
      builder: (context, state) {
        final i = state.input;
        final e = state.fieldErrors;
        String? err(String f) => e[f] == null ? null : translateErrorCode(e[f]);
        final priceError = switch (e['priceCents']) {
          'invalid_price' => 'res.price_invalid'.tr(),
          'price_locked' => 'res.price_locked'.tr(args: [Product.name]),
          _ => err('priceCents'),
        };
        // 24/10/2026: the children count in the passengers.
        final seatsError = e['childSeats'] == 'child_seats_exceed_passengers' ? 'child_seats.pro_exceed'.tr() : err('childSeats');
        final showSeats = _seatsOpen || i.childSeats.total > 0 || seatsError != null;
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: widget.editing ? 'res.edit_title'.tr() : 'res.new_title'.tr()),
          // « Nouvelle réservation », direction A (02/11/2026): one page of cards by subject, and the save button in a
          // bar that stays at the bottom with what is being saved. Edge-to-edge (Android 15+): the bar ends above the
          // navigation bar, the list clear of a side bar or cutout.
          bottomNavigationBar: _SaveBar(state: state, onSave: state.full && !i.force ? null : () => _bloc.add(const ProReservationFormSubmitted())),
          body: SafeArea(
            top: false,
            bottom: false,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 24),
              children: [
                _Card(
                  title: 'res.form.stay'.tr(),
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: _DateTile(
                            key: const Key('f-arrival'),
                            kind: Movement.arrival,
                            label: 'res.arrival'.tr(),
                            value: i.arrivalAt,
                            error: err('arrivalAt'),
                            onTap: () => _pick(i.arrivalAt, (v) => _set((x) => x.copyWith(arrivalAt: v))),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _DateTile(
                            key: const Key('f-return'),
                            kind: Movement.departure,
                            label: 'res.return'.tr(),
                            value: i.returnAt,
                            error: err('returnAt'),
                            onTap: () => _pick(i.returnAt, (v) => _set((x) => x.copyWith(returnAt: v))),
                          ),
                        ),
                      ],
                    ),
                    // One slot whatever the capacity says: the fields below keep their place (and focus).
                    _CapacityLine(
                      state: state,
                      onForce: (v) => _set((x) => x.copyWith(force: v)),
                    ),
                  ],
                ),
                _Card(
                  title: 'res.form.client'.tr(),
                  children: [
                    // 09/10/2026: the traveller's first and last name apart (the server stores "Prénom Nom").
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextField(
                            key: const Key('f-first-name'),
                            controller: _firstName,
                            textCapitalization: TextCapitalization.words,
                            autofillHints: const [AutofillHints.givenName],
                            decoration: InputDecoration(
                              labelText: 'res.first_name'.tr(),
                              errorText: err('customerFirstName') ?? err('customerName'),
                              errorMaxLines: 2,
                            ),
                            onChanged: (v) => _set((x) => x.copyWith(customerFirstName: v)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            key: const Key('f-last-name'),
                            controller: _lastName,
                            textCapitalization: TextCapitalization.words,
                            autofillHints: const [AutofillHints.familyName],
                            decoration: InputDecoration(labelText: 'res.last_name'.tr(), errorText: err('customerLastName'), errorMaxLines: 2),
                            onChanged: (v) => _set((x) => x.copyWith(customerLastName: v)),
                          ),
                        ),
                      ],
                    ),
                    TextField(
                      key: const Key('f-phone'),
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'res.phone'.tr(),
                        prefixIcon: const Icon(Icons.phone_rounded, size: 20),
                        errorText: err('customerPhone'),
                      ),
                      onChanged: (v) => _set((x) => x.copyWith(customerPhone: v)),
                    ),
                    TextField(
                      key: const Key('f-email'),
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'res.email_optional'.tr(),
                        prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20),
                        errorText: err('customerEmail'),
                      ),
                      onChanged: (v) => _set((x) => x.copyWith(customerEmail: v)),
                    ),
                  ],
                ),
                _Card(
                  title: 'res.form.vehicle'.tr(),
                  children: [
                    PlateField(
                      controller: _plate,
                      label: 'res.plate_optional'.tr(),
                      errorText: err('plate'),
                      onChanged: (v) => _set((x) => x.copyWith(plate: v)),
                    ),
                    // E (06/10/2026): the traveller's vehicle, as given at the counter.
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextField(
                            key: const Key('f-vehicle-model'),
                            controller: _vehicleModel,
                            decoration: InputDecoration(labelText: 'res.vehicle_model'.tr(), hintText: 'Peugeot 308', errorText: err('vehicleModel')),
                            onChanged: (v) => _set((x) => x.copyWith(vehicleModel: v)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            key: const Key('f-vehicle-colour'),
                            controller: _vehicleColour,
                            decoration: InputDecoration(labelText: 'res.vehicle_colour'.tr(), hintText: 'grise', errorText: err('vehicleColour')),
                            onChanged: (v) => _set((x) => x.copyWith(vehicleColour: v)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                _Card(
                  title: 'res.form.trip'.tr(),
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextField(
                            key: const Key('f-outbound'),
                            controller: _outbound,
                            textCapitalization: TextCapitalization.characters,
                            decoration: InputDecoration(
                              labelText: 'res.departure_flight'.tr(),
                              hintText: 'AF 7641',
                              errorText: err('departureFlight'),
                              errorMaxLines: 2,
                            ),
                            onChanged: (v) => _set((x) => x.copyWith(departureFlight: v.toUpperCase())),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            key: const Key('f-flight'),
                            controller: _flight,
                            textCapitalization: TextCapitalization.sentences,
                            maxLength: 40,
                            decoration: InputDecoration(
                              labelText: 'res.return_flight_optional'.tr(),
                              hintText: 'TO 3627 ou Porto',
                              errorText: err('returnFlight'),
                              errorMaxLines: 2,
                              counterText: '',
                            ),
                            onChanged: (v) => _set((x) => x.copyWith(returnFlight: v)),
                          ),
                        ),
                      ],
                    ),
                    Text('res.departure_flight_help'.tr(), style: AppText.muted(size: 12)),
                    Text('res.return_flight_free_help'.tr(), style: AppText.muted(size: 12)),
                    _PassengersStepper(
                      key: const Key('f-passengers'),
                      value: i.passengers,
                      onChanged: (v) => _set((x) => x.copyWith(passengers: v)),
                    ),
                    // « Sièges auto pour la navette » (24/10/2026, direction B), folded until there are children.
                    if (!showSeats)
                      OutlinedButton(
                        key: const Key('f-child-seats-add'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(44),
                          foregroundColor: AppColors.accent,
                          side: const BorderSide(color: AppColors.line),
                        ),
                        onPressed: () => setState(() => _seatsOpen = true),
                        child: Text('res.form.child_seats_add'.tr()),
                      )
                    else ...[
                      Text('child_seats.pro_form_title'.tr(), key: const Key('f-child-seats'), style: AppText.strong(size: 14)),
                      ChildSeatsEditor(
                        seats: i.childSeats,
                        onChanged: (s) => _set((x) => x.copyWith(childSeats: s)),
                      ),
                      if (seatsError != null)
                        Text(
                          seatsError,
                          key: const Key('f-child-seats-error'),
                          style: AppText.body(size: 12.5, color: AppColors.danger),
                        ),
                    ],
                    // « Voiturier au terminal » (27/10/2026): the car taken and brought back at the terminal, no shuttle.
                    Text('res.care'.tr(), style: AppText.label(size: 12)),
                    Segmented<String>(
                      key: const Key('f-handover'),
                      values: const ['shuttle', 'valet'],
                      labels: ['res.care_shuttle'.tr(), 'res.care_valet'.tr()],
                      selected: i.handover,
                      onChanged: (v) => _set((x) => x.copyWith(handover: v)),
                    ),
                    if (i.handover == 'valet') Text('res.care_valet_help'.tr(), style: AppText.body(size: 12.5, color: AppColors.muted)),
                  ],
                ),
                _Card(
                  title: 'res.form.channel'.tr(),
                  children: [
                    _ChannelChoice(
                      key: const Key('f-channel'),
                      selected: i.channel,
                      onChanged: i.channel == 'plazo' ? null : (c) => _set((x) => x.copyWith(channel: c)),
                    ),
                    // 02/11/2026: a booking made with the parking itself counts « En direct » in the revenue.
                    if (isDirectBooking(i.channel))
                      Row(
                        key: const Key('f-direct'),
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const DirectBadge(),
                          const SizedBox(width: 8),
                          Expanded(child: Text('res.direct.help'.tr(), style: AppText.muted(size: 12))),
                        ],
                      ),
                    if (i.channel == 'aggregator')
                      TextField(
                        key: const Key('f-detail'),
                        controller: _detail,
                        decoration: InputDecoration(labelText: 'res.channel_detail'.tr(), hintText: 'Parkos, Onepark…'),
                        onChanged: (v) => _set((x) => x.copyWith(channelDetail: v)),
                      ),
                    // 10/10/2026: the amount, to correct after an email import; a Plazo booking's was paid online.
                    TextField(
                      key: const Key('f-price'),
                      controller: _price,
                      enabled: !state.priceLocked,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'res.price_paid'.tr(),
                        hintText: '45,50',
                        suffixText: '€',
                        helperText: state.priceLocked ? 'res.price_plazo_help'.tr(args: [Product.name]) : 'res.price_help'.tr(),
                        helperMaxLines: 2,
                        errorText: priceError,
                        errorMaxLines: 2,
                      ),
                      onChanged: (v) => _bloc.add(ProReservationFormPriceChanged(v)),
                    ),
                    // « Payé par » (29/10/2026 on the web, in the app since 02/11/2026); a second touch clears it.
                    if (!state.priceLocked && i.channel != 'plazo') ...[
                      Text('res.form.paid_by'.tr(), style: AppText.label(size: 12)),
                      _Pills(
                        keyPrefix: 'f-paid-',
                        values: _paymentMethods,
                        labelOf: (m) => 'res.payment.$m'.tr(),
                        selected: i.paymentMethod,
                        onChanged: (m) => _set((x) => x.copyWith(paymentMethod: m == x.paymentMethod ? null : m)),
                      ),
                    ],
                  ],
                ),
                _Card(
                  children: [
                    _FoldedNote(
                      fieldKey: const Key('f-customer-note'),
                      label: 'res.customer_note'.tr(),
                      controller: _customerNote,
                      maxLines: 2,
                      error: err('customerNote'),
                      onChanged: (v) => _set((x) => x.copyWith(customerNote: v)),
                    ),
                    _FoldedNote(
                      fieldKey: const Key('f-notes'),
                      label: 'res.form.team_note'.tr(),
                      controller: _notes,
                      maxLines: 3,
                      onChanged: (v) => _set((x) => x.copyWith(notes: v)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

const _paymentMethods = ['card', 'cash', 'cheque', 'transfer', 'holiday_vouchers', 'comparator'];

/// A white card of the form, its title in small capitals above the fields.
class _Card extends StatelessWidget {
  const _Card({this.title, required this.children});
  final String? title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: const BoxDecoration(color: AppColors.surface, borderRadius: AppRadius.card),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null) ...[Text(title!.toUpperCase(), style: AppText.label(size: 11.5)), const SizedBox(height: 10)],
          for (final (n, child) in children.indexed) ...[if (n > 0) const SizedBox(height: 10), child],
        ],
      ),
    );
  }
}

/// « Passagers  − 2 + », 1 to 9.
class _PassengersStepper extends StatelessWidget {
  const _PassengersStepper({super.key, required this.value, required this.onChanged});
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    Widget round(IconData icon, String tooltip, Key key, VoidCallback? onTap, {bool filled = false}) => IconButton(
      key: key,
      tooltip: tooltip,
      onPressed: onTap,
      style: IconButton.styleFrom(
        minimumSize: const Size(44, 44),
        backgroundColor: filled ? AppColors.action : AppColors.surface,
        foregroundColor: filled ? AppColors.onAccent : AppColors.ink,
        side: filled ? null : const BorderSide(color: AppColors.line),
      ),
      icon: Icon(icon, size: 20),
    );
    return Row(
      children: [
        Expanded(child: Text('res.passengers'.tr(), style: AppText.strong(size: 15))),
        round(Icons.remove_rounded, 'res.form.passengers_less'.tr(), const Key('f-passengers-less'), value > 1 ? () => onChanged(value - 1) : null),
        SizedBox(
          width: 36,
          child: Text('$value', textAlign: TextAlign.center, style: AppText.tabular(size: 18)),
        ),
        round(
          Icons.add_rounded,
          'res.form.passengers_more'.tr(),
          const Key('f-passengers-more'),
          value < 9 ? () => onChanged(value + 1) : null,
          filled: true,
        ),
      ],
    );
  }
}

/// The channels as pills, the direct ones (phone, counter, own website) with their handshake; a Plazo booking keeps
/// its channel.
class _ChannelChoice extends StatelessWidget {
  const _ChannelChoice({super.key, required this.selected, required this.onChanged});
  final String selected;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final values = selected == 'plazo' ? const ['plazo'] : _channels;
    return _Pills(
      keyPrefix: 'f-channel-',
      values: values,
      labelOf: (c) => 'res.channel.$c'.tr(args: [Product.name]),
      iconOf: (c) => isDirectBooking(c) ? Icons.handshake_rounded : null,
      selected: selected,
      strong: true,
      onChanged: onChanged,
    );
  }
}

class _Pills extends StatelessWidget {
  const _Pills({
    required this.keyPrefix,
    required this.values,
    required this.labelOf,
    required this.selected,
    required this.onChanged,
    this.iconOf,
    this.strong = false,
  });
  final String keyPrefix;
  final List<String> values;
  final String Function(String) labelOf;
  final IconData? Function(String)? iconOf;
  final String? selected;
  final ValueChanged<String>? onChanged;

  /// Lime when chosen (the channel), dark green otherwise (how it was paid).
  final bool strong;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final v in values)
          Builder(
            builder: (context) {
              final on = v == selected;
              final fg = on ? (strong ? AppColors.onAccent : AppColors.surface) : AppColors.ink;
              final icon = iconOf?.call(v);
              return Material(
                color: on ? (strong ? AppColors.action : AppColors.accent) : AppColors.surface,
                shape: StadiumBorder(side: BorderSide(color: on ? Colors.transparent : AppColors.line)),
                child: InkWell(
                  key: Key('$keyPrefix$v'),
                  customBorder: const StadiumBorder(),
                  onTap: onChanged == null ? null : () => onChanged!(v),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: 40),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (icon != null) ...[Icon(icon, size: 16, color: on ? fg : AppColors.accent), const SizedBox(width: 5)],
                          Text(
                            labelOf(v),
                            style: AppText.body(size: 13.5, weight: on ? 700 : 500, color: fg),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

/// « Message du client » / « Note pour l'équipe »: a line with « + Ajouter » until it is opened or holds a text.
class _FoldedNote extends StatefulWidget {
  const _FoldedNote({
    required this.fieldKey,
    required this.label,
    required this.controller,
    required this.maxLines,
    required this.onChanged,
    this.error,
  });
  final Key fieldKey;
  final String label;
  final TextEditingController controller;
  final int maxLines;
  final String? error;
  final ValueChanged<String> onChanged;

  @override
  State<_FoldedNote> createState() => _FoldedNoteState();
}

class _FoldedNoteState extends State<_FoldedNote> {
  late bool _open = widget.controller.text.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    if (_open || widget.error != null) {
      return TextField(
        key: widget.fieldKey,
        controller: widget.controller,
        maxLines: widget.maxLines,
        autofocus: widget.controller.text.isEmpty,
        decoration: InputDecoration(labelText: widget.label, alignLabelWithHint: true, errorText: widget.error),
        onChanged: widget.onChanged,
      );
    }
    return InkWell(
      key: Key('${(widget.fieldKey as ValueKey).value}-add'),
      onTap: () => setState(() => _open = true),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 44),
        child: Row(
          children: [
            Expanded(child: Text(widget.label, style: AppText.body(size: 15))),
            Text('res.form.add'.tr(), style: AppText.strong(size: 14, color: AppColors.accent)),
          ],
        ),
      ),
    );
  }
}

/// The bar at the bottom: who, how long, how and how much, above « Enregistrer ».
class _SaveBar extends StatelessWidget {
  const _SaveBar({required this.state, required this.onSave});
  final ProReservationFormState state;
  final VoidCallback? onSave;

  @override
  Widget build(BuildContext context) {
    final i = state.input;
    final name = [i.customerFirstName.trim(), i.customerLastName.trim()].where((p) => p.isNotEmpty).join(' ');
    final nights = state.capacity?.nights;
    final parts = [
      if (name.isNotEmpty) name,
      if (nights != null && nights > 0) 'res.form.nights'.tr(args: ['$nights']),
      (i.handover == 'valet' ? 'res.form.summary_valet' : 'res.form.summary_shuttle').tr(),
    ];
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.line)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(parts.join(' · '), maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.muted(size: 13)),
                  ),
                  if (isDirectBooking(i.channel)) const Padding(padding: EdgeInsets.only(left: 6), child: DirectBadge(compact: true)),
                  if (state.priceText.trim().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Text('${state.priceText.trim()} €', style: AppText.tabular(size: 14)),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              GradientButton(key: const Key('f-save'), label: 'res.save'.tr(), busy: state.saveState.isProcessing, onPressed: onSave),
            ],
          ),
        ),
      ),
    );
  }
}

class _DateTile extends StatelessWidget {
  const _DateTile({super.key, required this.kind, required this.label, required this.value, required this.onTap, this.error});
  final Movement kind;
  final String label;
  final String value;
  final String? error;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final d = DateTime.tryParse(value);
    final colour = movementColor(kind);
    // « ↑ ARRIVÉE » on pale green, « ↓ RETOUR » on pale indigo, as on the planning (28/10/2026).
    return Material(
      color: movementSoft(kind),
      borderRadius: AppRadius.chip,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.chip,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            border: Border.all(color: error != null ? AppColors.danger : Colors.transparent),
            borderRadius: AppRadius.chip,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${kind == Movement.arrival ? '↑' : '↓'} ${label.toUpperCase()}', style: AppText.label(size: 11, color: colour)),
              const SizedBox(height: 4),
              Text(d == null ? '—' : DateFormat('EEE d MMM', 'fr_FR').format(d), style: AppText.strong(size: 14)),
              Text(
                d == null ? '' : DateFormat('HH:mm').format(d),
                style: AppText.tabular(size: 18, color: kind == Movement.arrival ? AppColors.accent : colour),
              ),
              if (error != null) Text(error!, style: AppText.body(size: 12, color: AppColors.danger)),
            ],
          ),
        ),
      ),
    );
  }
}

class _CapacityLine extends StatelessWidget {
  const _CapacityLine({required this.state, required this.onForce});
  final ProReservationFormState state;
  final ValueChanged<bool> onForce;

  @override
  Widget build(BuildContext context) {
    final cap = state.capacity;
    if (state.checkingCapacity) return Text('res.checking'.tr(), style: AppText.muted(size: 12.5));
    if (cap == null) return const SizedBox(height: 18);
    if (cap.fullNights.isEmpty) {
      return Text(
        'res.nights'.tr(args: ['${cap.nights}']),
        key: const Key('f-nights'),
        style: AppText.muted(size: 12.5),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'res.full'.tr(args: [cap.fullNights.join(', ')]),
          key: const Key('f-full'),
          style: AppText.body(size: 13, color: AppColors.danger),
        ),
        if (cap.canForce)
          SwitchListTile(
            key: const Key('f-force'),
            contentPadding: EdgeInsets.zero,
            activeTrackColor: AppColors.accent,
            title: Text('res.force'.tr(), style: AppText.body(size: 13.5)),
            value: state.input.force,
            onChanged: onForce,
          )
        else
          Text('res.full_no_force'.tr(), style: AppText.muted(size: 12.5)),
      ],
    );
  }
}
