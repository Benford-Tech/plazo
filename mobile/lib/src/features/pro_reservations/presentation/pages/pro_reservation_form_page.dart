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

  late final _name = TextEditingController(text: _bloc.state.input.customerName);
  late final _phone = TextEditingController(text: _bloc.state.input.customerPhone);
  late final _email = TextEditingController(text: _bloc.state.input.customerEmail ?? '');
  late final _plate = TextEditingController(text: _bloc.state.input.plate);
  late final _flight = TextEditingController(text: _bloc.state.input.returnFlight ?? '');
  late final _outbound = TextEditingController(text: _bloc.state.input.departureFlight ?? '');
  late final _detail = TextEditingController(text: _bloc.state.input.channelDetail ?? '');
  late final _notes = TextEditingController(text: _bloc.state.input.notes ?? '');

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _plate, _flight, _detail, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  void _set(ReservationInput Function(ReservationInput) change) => _bloc.add(ProReservationFormChanged(change(_bloc.state.input)));

  Future<void> _pick(String current, void Function(String) apply) async {
    final base = DateTime.tryParse(current) ?? DateTime.now();
    final date = await showDatePicker(context: context, initialDate: base, firstDate: DateTime(2024), lastDate: DateTime(2032), locale: const Locale('fr'));
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
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: widget.editing ? 'res.edit_title'.tr() : 'res.new_title'.tr()),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
            children: [
              Row(
                children: [
                  Expanded(
                    child: _DateTile(
                      key: const Key('f-arrival'),
                      label: 'res.arrival'.tr(),
                      value: i.arrivalAt,
                      error: err('arrivalAt'),
                      onTap: () => _pick(i.arrivalAt, (v) => _set((x) => x.copyWith(arrivalAt: v))),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _DateTile(
                      key: const Key('f-return'),
                      label: 'res.return'.tr(),
                      value: i.returnAt,
                      error: err('returnAt'),
                      onTap: () => _pick(i.returnAt, (v) => _set((x) => x.copyWith(returnAt: v))),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // One slot whatever the capacity says: the fields below keep their place (and focus).
              _CapacityLine(
                state: state,
                onForce: (v) => _set((x) => x.copyWith(force: v)),
              ),
              const SizedBox(height: 14),
              PlateField(
                controller: _plate,
                label: 'res.plate'.tr(),
                errorText: err('plate'),
                onChanged: (v) => _set((x) => x.copyWith(plate: v)),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('f-name'),
                controller: _name,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(labelText: 'res.customer'.tr(), errorText: err('customerName')),
                onChanged: (v) => _set((x) => x.copyWith(customerName: v)),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('f-phone'),
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(labelText: 'res.phone'.tr(), errorText: err('customerPhone')),
                onChanged: (v) => _set((x) => x.copyWith(customerPhone: v)),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('f-email'),
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(labelText: 'res.email_optional'.tr(), errorText: err('customerEmail')),
                onChanged: (v) => _set((x) => x.copyWith(customerEmail: v)),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('f-outbound'),
                controller: _outbound,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  labelText: 'res.departure_flight'.tr(),
                  hintText: 'AF 7641',
                  helperText: 'res.departure_flight_help'.tr(),
                  errorText: err('departureFlight'),
                ),
                onChanged: (v) => _set((x) => x.copyWith(departureFlight: v.toUpperCase())),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      key: const Key('f-flight'),
                      controller: _flight,
                      decoration: InputDecoration(labelText: 'res.return_flight'.tr(), hintText: 'TO 3627', errorText: err('returnFlight')),
                      onChanged: (v) => _set((x) => x.copyWith(returnFlight: v.toUpperCase())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  SizedBox(
                    width: 130,
                    child: DropdownButtonFormField<int>(
                      key: const Key('f-passengers'),
                      initialValue: i.passengers,
                      decoration: InputDecoration(labelText: 'res.passengers'.tr()),
                      items: [for (var n = 1; n <= 9; n++) DropdownMenuItem(value: n, child: Text('$n'))],
                      onChanged: (v) => _set((x) => x.copyWith(passengers: v ?? 2)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                key: const Key('f-channel'),
                initialValue: _channels.contains(i.channel) ? i.channel : 'phone',
                decoration: InputDecoration(labelText: 'res.channel_label'.tr()),
                items: [for (final c in _channels) DropdownMenuItem(value: c, child: Text('res.channel.$c'.tr(args: [Product.name])))],
                onChanged: i.channel == 'plazo' ? null : (v) => _set((x) => x.copyWith(channel: v ?? 'phone')),
              ),
              if (i.channel == 'aggregator') ...[
                const SizedBox(height: 12),
                TextField(
                  key: const Key('f-detail'),
                  controller: _detail,
                  decoration: InputDecoration(labelText: 'res.channel_detail'.tr(), hintText: 'Parkos, Onepark…'),
                  onChanged: (v) => _set((x) => x.copyWith(channelDetail: v)),
                ),
              ],
              const SizedBox(height: 12),
              TextField(
                key: const Key('f-notes'),
                controller: _notes,
                maxLines: 3,
                decoration: InputDecoration(labelText: 'res.notes'.tr(), alignLabelWithHint: true),
                onChanged: (v) => _set((x) => x.copyWith(notes: v)),
              ),
              const SizedBox(height: 20),
              GradientButton(
                key: const Key('f-save'),
                label: 'res.save'.tr(),
                busy: state.saveState.isProcessing,
                onPressed: state.full && !i.force ? null : () => _bloc.add(const ProReservationFormSubmitted()),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _DateTile extends StatelessWidget {
  const _DateTile({super.key, required this.label, required this.value, required this.onTap, this.error});
  final String label;
  final String value;
  final String? error;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final d = DateTime.tryParse(value);
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.chip,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(color: error != null ? AppColors.danger : AppColors.line),
          borderRadius: AppRadius.chip,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppText.label(size: 11)),
            const SizedBox(height: 4),
            Text(d == null ? '—' : DateFormat('EEE d MMM', 'fr_FR').format(d), style: AppText.strong(size: 14)),
            Text(d == null ? '' : DateFormat('HH:mm').format(d), style: AppText.tabular(size: 16, color: AppColors.accent)),
            if (error != null) Text(error!, style: AppText.body(size: 12, color: AppColors.danger)),
          ],
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
