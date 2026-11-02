import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../../di/locator.dart';
import '../../features/pro_settings/data/operator_logo_data_source.dart';

/// The parking's logo (02/11/2026, direction B), fetched with the session and cached by its date; nothing without one
/// (or while it loads, or when it cannot be read).
class ParkingLogo extends StatefulWidget {
  const ParkingLogo({super.key, required this.updatedAt, this.size = 28, this.label});

  final DateTime? updatedAt;
  final double size;
  final String? label;

  @override
  State<ParkingLogo> createState() => _ParkingLogoState();
}

class _ParkingLogoState extends State<ParkingLogo> {
  Future<Uint8List?>? _bytes;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant ParkingLogo old) {
    super.didUpdateWidget(old);
    if (old.updatedAt != widget.updatedAt) _load();
  }

  void _load() {
    final at = widget.updatedAt;
    _bytes = at == null || !locator.isRegistered<OperatorLogoDataSource>() ? null : locator<OperatorLogoDataSource>().load(at);
  }

  @override
  Widget build(BuildContext context) {
    if (_bytes == null) return const SizedBox.shrink();
    return FutureBuilder<Uint8List?>(
      future: _bytes,
      builder: (context, snap) {
        final bytes = snap.data;
        if (bytes == null) return const SizedBox.shrink();
        return Semantics(
          image: true,
          label: widget.label,
          child: SizedBox.square(
            key: const Key('parking-logo'),
            dimension: widget.size,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(widget.size * 0.22),
              child: Image.memory(bytes, fit: BoxFit.contain, gaplessPlayback: true),
            ),
          ),
        );
      },
    );
  }
}
