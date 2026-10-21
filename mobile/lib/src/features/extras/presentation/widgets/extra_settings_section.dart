import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../data/models/extras_models.dart';
import '../bloc/extra_settings_bloc.dart';
import 'extra_widgets.dart';

/// "50,00" → 5000; null when it is not an amount.
int? parseEurosToCents(String text) {
  final t = text.trim().replaceAll('€', '').replaceAll(' ', '').replaceAll(' ', '').replaceAll(',', '.');
  if (!RegExp(r'^\d{1,4}(\.\d{1,2})?$').hasMatch(t)) return null;
  return (double.parse(t) * 100).round();
}

/// 5000 → "50,00".
String centsToEurosField(int cents) => '${cents ~/ 100},${(cents % 100).toString().padLeft(2, '0')}';

/// Plus › Réglages du parking: « Services additionnels » (managers, 21/10/2026): each service on or off with its
/// price, and until when before the return the travellers may order them.
class ExtraSettingsSection extends StatelessWidget {
  const ExtraSettingsSection({super.key, required this.parkingId});
  final String parkingId;

  @override
  Widget build(BuildContext context) =>
      BlocProvider(create: (_) => locator<ExtraSettingsBloc>()..add(ExtraSettingsStarted(parkingId)), child: const ExtraSettingsView());
}

class ExtraSettingsView extends StatefulWidget {
  const ExtraSettingsView({super.key});
  @override
  State<ExtraSettingsView> createState() => _ExtraSettingsViewState();
}

class _ExtraSettingsViewState extends State<ExtraSettingsView> {
  ExtraSettingsModel? _loaded;
  final _enabled = <String, bool>{};
  final _prices = <String, TextEditingController>{};
  final _lead = TextEditingController();
  final _localErrors = <String, String>{};

  void _fill(ExtraSettingsModel data) {
    _loaded = data;
    for (final o in data.offers) {
      _enabled[o.kind] = o.enabled;
      (_prices[o.kind] ??= TextEditingController()).text = centsToEurosField(o.priceCents);
    }
    _lead.text = '${data.leadHours}';
  }

  @override
  void dispose() {
    for (final c in _prices.values) {
      c.dispose();
    }
    _lead.dispose();
    super.dispose();
  }

  void _save() {
    final data = _loaded;
    if (data == null) return;
    _localErrors.clear();
    final offers = <ExtraSettingModel>[];
    for (final o in data.offers) {
      final cents = parseEurosToCents(_prices[o.kind]!.text);
      if (cents == null) _localErrors['offers.${o.kind}.priceCents'] = 'invalid';
      offers.add(o.copyWith(enabled: _enabled[o.kind] ?? false, priceCents: cents ?? o.priceCents));
    }
    final lead = int.tryParse(_lead.text.trim());
    if (lead == null || lead < 0 || lead > 168) _localErrors['leadHours'] = 'invalid';
    setState(() {});
    if (_localErrors.isNotEmpty) return;
    context.read<ExtraSettingsBloc>().add(ExtraSettingsSaved(leadHours: lead!, offers: offers));
  }

  String? _error(ExtraSettingsState state, String field) {
    final code = _localErrors[field] ?? state.fieldErrors[field];
    if (code == null) return null;
    return field == 'leadHours' ? 'extras.settings.lead_invalid'.tr() : 'extras.settings.price_$code'.tr();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ExtraSettingsBloc, ExtraSettingsState>(
      listenWhen: (a, b) => a.data != b.data || (b.notice != null && a.notice != b.notice) || (b.errorCode != null && a.errorCode != b.errorCode),
      listener: (context, state) {
        if (state.data != null && state.data != _loaded) setState(() => _fill(state.data!));
        final text = state.notice != null
            ? 'extras.settings.saved'.tr()
            : state.errorCode != null && state.errorCode != 'validation_failed'
            ? translateErrorCode(state.errorCode)
            : null;
        if (text != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
          context.read<ExtraSettingsBloc>().add(const ExtraSettingsNoticeShown());
        }
      },
      builder: (context, state) {
        final data = _loaded;
        if (data == null) return const SizedBox.shrink();
        return Column(
          key: const Key('extra-settings'),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('extras.settings.title'.tr().toUpperCase(), style: AppText.label(size: 11)),
            const SizedBox(height: 4),
            Text('extras.settings.intro'.tr(), style: AppText.muted(size: 12.5)),
            const SizedBox(height: 8),
            for (final o in data.offers)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(padding: const EdgeInsets.only(top: 6), child: ExtraIconTile(o.kind, size: 30)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Text(o.label, style: AppText.body(size: 14, weight: 600)),
                      ),
                    ),
                    SizedBox(
                      width: 96,
                      child: TextField(
                        key: Key('extra-price-${o.kind}'),
                        controller: _prices[o.kind],
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9,.]'))],
                        textAlign: TextAlign.right,
                        decoration: InputDecoration(
                          isDense: true,
                          suffixText: '€',
                          errorText: _error(state, 'offers.${o.kind}.priceCents'),
                          errorMaxLines: 2,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Switch(
                      key: Key('extra-enabled-${o.kind}'),
                      value: _enabled[o.kind] ?? false,
                      onChanged: state.saving ? null : (v) => setState(() => _enabled[o.kind] = v),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(child: Text('extras.settings.lead'.tr(), style: AppText.body(size: 14))),
                SizedBox(
                  width: 70,
                  child: TextField(
                    key: const Key('extra-lead'),
                    controller: _lead,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    textAlign: TextAlign.right,
                    decoration: InputDecoration(isDense: true, suffixText: 'h', errorText: _error(state, 'leadHours'), errorMaxLines: 2),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text('extras.settings.commission'.tr(), style: AppText.muted(size: 12)),
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                key: const Key('extra-settings-save'),
                onPressed: state.saving ? null : _save,
                child: Text('extras.settings.save'.tr()),
              ),
            ),
          ],
        );
      },
    );
  }
}
