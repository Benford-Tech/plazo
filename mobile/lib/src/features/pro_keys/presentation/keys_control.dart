import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/utils/error_message_handler.dart';
import '../../../core/helpers/formatters.dart';
import '../../../di/locator.dart';
import '../../../shared/theme/theme.dart';
import '../data/keys_data_source.dart';

enum _Keys { none, left, hook }

/// Direction A (01/11/2026, « dans l'appli il faut pouvoir modifier la clé depuis le tableau de bord ou en modifiant la
/// fiche de réservation »): the keys of a car on the parking in three positions, as on the web: « Clés ? » (amber) ·
/// « Laissées » (green, the time underneath) · « Crochet n° » (lime) which opens a field for the hook's number. One touch
/// saves; touching the chosen « Laissées » again takes it back to « Clés ? ». The new state is shown at once and put back
/// if the server refuses it.
class KeysControl extends StatefulWidget {
  const KeysControl({super.key, required this.reservationId, this.keyHook, this.keysLeftAt, this.onChanged});

  final String reservationId;
  final String? keyHook;
  final DateTime? keysLeftAt;

  /// Called once the server took the change (to reload what depends on it: alerts, the booking).
  final ValueChanged<KeysState>? onChanged;

  @override
  State<KeysControl> createState() => _KeysControlState();
}

class _KeysControlState extends State<KeysControl> {
  late KeysState _keys = KeysState(keyHook: widget.keyHook, keysLeftAt: widget.keysLeftAt);
  final _hook = TextEditingController();
  bool _editing = false;
  bool _busy = false;

  @override
  void didUpdateWidget(KeysControl old) {
    super.didUpdateWidget(old);
    // A reload from the server (the dashboard polls) wins, unless a change is on its way.
    if (!_busy && (old.keyHook != widget.keyHook || old.keysLeftAt != widget.keysLeftAt)) {
      _keys = KeysState(keyHook: widget.keyHook, keysLeftAt: widget.keysLeftAt);
    }
  }

  @override
  void dispose() {
    _hook.dispose();
    super.dispose();
  }

  _Keys get _position => _keys.keyHook != null ? _Keys.hook : (_keys.keysLeftAt != null ? _Keys.left : _Keys.none);

  Future<void> _save({required bool left, String? hook}) async {
    final before = _keys;
    setState(() {
      _busy = true;
      _editing = false;
      _keys = KeysState(keyHook: hook, keysLeftAt: left ? (before.keysLeftAt ?? DateTime.now()) : null);
    });
    try {
      final saved = await locator<KeysDataSource>().setKeys(widget.reservationId, left: left, keyHook: hook);
      if (!mounted) return;
      setState(() => _keys = saved);
      widget.onChanged?.call(saved);
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() => _keys = before);
      final text = e.errorCode == 'vehicle_not_on_site' ? 'keys.not_on_site'.tr() : e.errorMessage;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _tap(_Keys target) {
    if (_busy) return;
    switch (target) {
      case _Keys.none:
        if (_position != _Keys.none) _save(left: false);
        setState(() => _editing = false);
      case _Keys.left:
        // Touching the chosen « Laissées » again undoes it.
        _position == _Keys.left ? _save(left: false) : _save(left: true);
      case _Keys.hook:
        setState(() {
          _editing = !_editing;
          _hook.text = _keys.keyHook ?? '';
        });
    }
  }

  void _submitHook() {
    final value = _hook.text.trim();
    if (value.isEmpty) return setState(() => _editing = false);
    if (value == _keys.keyHook) return setState(() => _editing = false);
    _save(left: true, hook: value);
  }

  @override
  Widget build(BuildContext context) {
    final position = _position;
    final segments = [
      (_Keys.none, 'keys.none'.tr(), AppStatus.warnSoft, AppStatus.warnText, 'keys-none'),
      (_Keys.left, 'keys.left'.tr(), AppStatus.okSoft, AppStatus.okText, 'keys-left'),
      (
        _Keys.hook,
        _keys.keyHook == null ? 'keys.hook'.tr() : 'keys.hook_n'.tr(args: [_keys.keyHook!]),
        AppColors.action,
        AppColors.onAccent,
        'keys-hook',
      ),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Semantics(
          label: 'keys.title'.tr(),
          container: true,
          child: Container(
            key: Key('keys-${widget.reservationId}'),
            decoration: BoxDecoration(
              color: AppColors.panel2,
              borderRadius: AppRadius.field,
              border: Border.all(color: AppColors.panelLine),
            ),
            clipBehavior: Clip.antiAlias,
            child: Row(
              children: [
                for (var i = 0; i < segments.length; i++) ...[
                  if (i > 0) Container(width: 1, height: 38, color: AppColors.panelLine),
                  Expanded(
                    child: Semantics(
                      button: true,
                      selected: segments[i].$1 == position,
                      inMutuallyExclusiveGroup: true,
                      child: Material(
                        color: segments[i].$1 == position ? segments[i].$3 : Colors.transparent,
                        child: InkWell(
                          key: Key(segments[i].$5),
                          onTap: _busy ? null : () => _tap(segments[i].$1),
                          child: Container(
                            constraints: const BoxConstraints(minHeight: 40),
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Text(
                              segments[i].$2,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.body(size: 12.5, weight: 600, color: segments[i].$1 == position ? segments[i].$4 : AppColors.muted),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        if (_editing) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  key: const Key('keys-hook-field'),
                  controller: _hook,
                  autofocus: true,
                  maxLength: 20,
                  textInputAction: TextInputAction.done,
                  keyboardType: TextInputType.text,
                  onSubmitted: (_) => _submitHook(),
                  decoration: InputDecoration(labelText: 'keys.hook_label'.tr(), counterText: '', isDense: true),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(key: const Key('keys-hook-save'), onPressed: _submitHook, child: Text('keys.save'.tr())),
            ],
          ),
        ] else if (position == _Keys.left && _keys.keysLeftAt != null) ...[
          const SizedBox(height: 4),
          Text('keys.left_at'.tr(args: [hhmm(_keys.keysLeftAt!)]), style: AppText.muted(size: 11.5)),
        ],
      ],
    );
  }
}
