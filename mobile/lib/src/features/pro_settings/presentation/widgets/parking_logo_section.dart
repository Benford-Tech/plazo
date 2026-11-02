import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_logo.dart';
import '../../../../shared/widgets/parking_logo.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../data/operator_logo_data_source.dart';

/// PNG files start with these bytes; anything else the picker gives is a JPEG.
const _pngSignature = [0x89, 0x50, 0x4e, 0x47];

/// « Logo du parking » (02/11/2026, direction B) in Plus › Réglages du parking: a manager chooses the logo shown next to
/// the Plazo Pro sign for the team, or removes it; preview of the bar. Same routes as the web card.
class ParkingLogoSection extends StatefulWidget {
  const ParkingLogoSection({super.key});

  @override
  State<ParkingLogoSection> createState() => _ParkingLogoSectionState();
}

class _ParkingLogoSectionState extends State<ParkingLogoSection> {
  bool _busy = false;

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  Future<void> _pick() async {
    final Uint8List bytes;
    try {
      final file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 512, maxHeight: 512, imageQuality: 90);
      if (file == null) return;
      bytes = await file.readAsBytes();
    } on PlatformException {
      _toast('account.photo.denied'.tr());
      return;
    }
    final png = bytes.length > 4 && List.generate(4, (i) => bytes[i]).join(',') == _pngSignature.join(',');
    await _run(() => locator<OperatorLogoDataSource>().upload(bytes, contentType: png ? 'image/png' : 'image/jpeg'), 'settings.logo.saved');
  }

  Future<void> _run(Future<DateTime?> Function() action, String done) async {
    final auth = context.read<ProAuthBloc?>();
    setState(() => _busy = true);
    try {
      final at = await action();
      auth?.add(ProAuthLogoChanged(at));
      if (mounted) _toast(done.tr());
    } on DioException catch (e) {
      if (mounted) _toast(e.errorMessage);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final staff = context.watch<ProAuthBloc?>()?.state.staff;
    final at = staff?.operatorLogoUpdatedAt;
    return Column(
      key: const Key('settings-logo'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('settings.logo.title'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 4),
        Text('settings.logo.intro'.tr(), style: AppText.muted(size: 12.5)),
        const SizedBox(height: 8),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (at != null)
                    ParkingLogo(updatedAt: at, size: 64, label: staff?.operatorName)
                  else
                    Container(
                      width: 64,
                      height: 64,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.line, width: 2),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.add_photo_alternate_outlined, color: AppColors.muted),
                    ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        FilledButton(
                          key: const Key('settings-logo-choose'),
                          onPressed: _busy ? null : _pick,
                          child: Text((at == null ? 'settings.logo.choose' : 'settings.logo.change').tr()),
                        ),
                        if (at != null)
                          OutlinedButton(
                            key: const Key('settings-logo-remove'),
                            onPressed: _busy
                                ? null
                                : () => _run(() async {
                                    await locator<OperatorLogoDataSource>().remove();
                                    return null;
                                  }, 'settings.logo.removed'),
                            child: Text('settings.logo.remove'.tr()),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                key: const Key('settings-logo-preview'),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(10)),
                child: Row(
                  children: [
                    const BrandLogo(height: 22, pro: true),
                    if (at != null) ...[
                      const SizedBox(width: 10),
                      Container(width: 1, height: 22, color: AppColors.line),
                      const SizedBox(width: 10),
                      ParkingLogo(updatedAt: at, size: 24),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(staff?.operatorName ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.strong(size: 13)),
                      ),
                    ] else ...[
                      const SizedBox(width: 10),
                      Expanded(child: Text('settings.logo.none'.tr(), style: AppText.muted(size: 12))),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
