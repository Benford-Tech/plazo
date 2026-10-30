import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../data/staff_photo_data_source.dart';

/// The member's photo, or their initials on a pale disc: the same circle as the web's `Avatar`.
class StaffAvatar extends StatefulWidget {
  const StaffAvatar({super.key, required this.staffId, required this.name, this.photoUpdatedAt, this.size = 40});

  final String staffId;
  final String name;
  final DateTime? photoUpdatedAt;
  final double size;

  @override
  State<StaffAvatar> createState() => _StaffAvatarState();
}

class _StaffAvatarState extends State<StaffAvatar> {
  Future<Uint8List?>? _bytes;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant StaffAvatar old) {
    super.didUpdateWidget(old);
    if (old.photoUpdatedAt != widget.photoUpdatedAt || old.staffId != widget.staffId) _load();
  }

  void _load() {
    final at = widget.photoUpdatedAt;
    _bytes = at == null ? null : locator<StaffPhotoDataSource>().load(widget.staffId, at);
  }

  @override
  Widget build(BuildContext context) {
    final initials = Container(
      key: const Key('avatar-initials'),
      width: widget.size,
      height: widget.size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(color: AppColors.tint, shape: BoxShape.circle),
      child: Text(initialsOf(widget.name), style: AppText.strong(size: widget.size * 0.36, color: AppColors.accent)),
    );
    if (_bytes == null) return initials;
    return FutureBuilder<Uint8List?>(
      future: _bytes,
      builder: (context, snap) {
        final bytes = snap.data;
        if (bytes == null) return initials;
        return ClipOval(
          key: const Key('avatar-photo'),
          child: Image.memory(bytes, width: widget.size, height: widget.size, fit: BoxFit.cover, gaplessPlayback: true),
        );
      },
    );
  }
}

/// « JS » for « Joanny Simporé ».
String initialsOf(String name) {
  final words = name.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
  if (words.isEmpty) return '?';
  final first = words.first.characters.first;
  final last = words.length > 1 ? words.last.characters.first : '';
  return (first + last).toUpperCase();
}

/// « Ma photo » of Mon compte (30/10/2026, « ajoute la photo dans Plazo Pro »): take one with the camera or choose one in
/// the gallery, reduced to 1 024 px; or remove it. Seen by the team only. Read-only in the prospects' demo.
class StaffPhotoCard extends StatefulWidget {
  const StaffPhotoCard({super.key, required this.staffId, required this.name});

  final String staffId;
  final String name;

  @override
  State<StaffPhotoCard> createState() => _StaffPhotoCardState();
}

class _StaffPhotoCardState extends State<StaffPhotoCard> {
  final _source = locator<StaffPhotoDataSource>();
  DateTime? _at;
  bool _demo = false;
  bool _loaded = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      final mine = await _source.mine();
      if (!mounted) return;
      setState(() {
        _at = mine.photoUpdatedAt;
        _demo = mine.demo;
        _loaded = true;
      });
    } on DioException {
      if (mounted) setState(() => _loaded = true);
    }
  }

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  Future<void> _pick(ImageSource source) async {
    final Uint8List bytes;
    try {
      // The camera's or gallery's photo, reduced and re-encoded as JPEG by the picker (a HEIC photo too).
      final file = await ImagePicker().pickImage(
        source: kIsWeb ? ImageSource.gallery : source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
        preferredCameraDevice: CameraDevice.front,
      );
      if (file == null) return;
      bytes = await file.readAsBytes();
    } on PlatformException {
      _toast('account.photo.denied'.tr());
      return;
    }
    await _run(() => _source.upload(bytes), 'account.photo.saved');
  }

  Future<void> _run(Future<void> Function() action, String done) async {
    setState(() => _busy = true);
    try {
      await action();
      await _refresh();
      if (mounted) _toast(done.tr());
    } on DioException catch (e) {
      if (mounted) _toast(e.errorMessage);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final has = _at != null;
    return AppCard(
      key: const Key('account-photo'),
      child: Row(
        children: [
          StaffAvatar(staffId: widget.staffId, name: widget.name, photoUpdatedAt: _at, size: 72),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('account.photo.title'.tr(), style: AppText.strong(size: 15)),
                const SizedBox(height: 2),
                Text(_demo ? 'account.photo.demo'.tr() : 'account.photo.intro'.tr(), style: AppText.muted(size: 12.5)),
                if (_loaded && !_demo) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      if (!kIsWeb)
                        OutlinedButton.icon(
                          key: const Key('account-photo-camera'),
                          onPressed: _busy ? null : () => _pick(ImageSource.camera),
                          icon: const Icon(Icons.photo_camera_rounded, size: 18),
                          label: Text('account.photo.camera'.tr()),
                        ),
                      OutlinedButton.icon(
                        key: const Key('account-photo-gallery'),
                        onPressed: _busy ? null : () => _pick(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library_rounded, size: 18),
                        label: Text((has ? 'account.photo.change' : 'account.photo.choose').tr()),
                      ),
                      if (has)
                        TextButton(
                          key: const Key('account-photo-remove'),
                          onPressed: _busy ? null : () => _run(_source.remove, 'account.photo.removed'),
                          child: Text('account.photo.remove'.tr()),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
