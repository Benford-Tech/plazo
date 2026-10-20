import 'dart:ui' as ui;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../data/datasources/paperwork_data_source.dart';
import '../../data/models/paperwork_models.dart';
import '../../domain/usecases/paperwork_use_cases.dart';

// ---- Signature pad ------------------------------------------------------------------------------------------------

/// The strokes drawn so far, each point from 0 to 1 of the pad (what the API keeps as a handwritten signature).
class SignatureController extends ChangeNotifier {
  final List<List<Offset>> _strokes = [];

  List<List<Offset>> get strokes => _strokes;
  int get points => _strokes.fold(0, (n, s) => n + s.length);

  /// Enough ink to be a signature (the server asks for 5 points at least).
  bool get signed => points >= 5;

  void start(Offset p) {
    if (_strokes.length >= 40) return;
    _strokes.add([p]);
    notifyListeners();
  }

  void extend(Offset p) {
    if (_strokes.isEmpty || _strokes.last.length >= 400) return;
    _strokes.last.add(p);
    notifyListeners();
  }

  void clear() {
    _strokes.clear();
    notifyListeners();
  }

  List<List<List<double>>> toJson() => [
    for (final s in _strokes)
      [
        for (final p in s) [double.parse(p.dx.clamp(0, 1).toStringAsFixed(3)), double.parse(p.dy.clamp(0, 1).toStringAsFixed(3))],
      ],
  ];
}

/// A white pad to sign with a finger, with « Effacer ».
class SignaturePad extends StatelessWidget {
  const SignaturePad({super.key, required this.controller, this.height = 150});
  final SignatureController controller;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: Text('paperwork.signature_label'.tr(), style: AppText.muted(size: 12.5))),
            ListenableBuilder(
              listenable: controller,
              builder: (_, _) => TextButton(
                key: const Key('signature-clear'),
                onPressed: controller.points == 0 ? null : controller.clear,
                child: Text('paperwork.signature_clear'.tr()),
              ),
            ),
          ],
        ),
        Semantics(
          label: 'paperwork.signature_label'.tr(),
          child: LayoutBuilder(
            builder: (context, box) {
              final size = Size(box.maxWidth, height);
              Offset norm(Offset p) => Offset((p.dx / size.width).clamp(0, 1), (p.dy / size.height).clamp(0, 1));
              return GestureDetector(
                key: const Key('signature-pad'),
                onPanStart: (d) => controller.start(norm(d.localPosition)),
                onPanUpdate: (d) => controller.extend(norm(d.localPosition)),
                child: Container(
                  height: height,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: AppRadius.field,
                    border: Border.all(color: AppColors.muted.withValues(alpha: 0.6)),
                  ),
                  child: ClipRRect(
                    borderRadius: AppRadius.field,
                    child: ListenableBuilder(
                      listenable: controller,
                      builder: (_, _) => CustomPaint(size: size, painter: _InkPainter(controller.strokes)),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _InkPainter extends CustomPainter {
  _InkPainter(this.strokes);
  final List<List<Offset>> strokes;

  @override
  void paint(Canvas canvas, Size size) {
    final ink = Paint()
      ..color = AppColors.ink
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;
    for (final s in strokes) {
      final path = Path();
      for (var i = 0; i < s.length; i++) {
        final p = Offset(s[i].dx * size.width, s[i].dy * size.height);
        i == 0 ? path.moveTo(p.dx, p.dy) : path.lineTo(p.dx, p.dy);
      }
      if (s.length == 1) path.lineTo(s[0].dx * size.width + 0.5, s[0].dy * size.height);
      canvas.drawPath(path, ink);
    }
  }

  @override
  bool shouldRepaint(_InkPainter old) => true;
}

// ---- Car outline --------------------------------------------------------------------------------------------------

/// The car seen from above, front at the top; the damages as numbered red dots. [onTap] gets the point from 0 to 1.
class CarOutline extends StatelessWidget {
  const CarOutline({super.key, required this.damages, this.onTap, this.height = 220, this.highlight = const {}});
  final List<DamageModel> damages;
  final void Function(double x, double y)? onTap;
  final double height;

  /// Damage numbers to draw in amber (new at the return).
  final Set<int> highlight;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'paperwork.outline_label'.tr(args: ['${damages.length}']),
      child: SizedBox(
        height: height,
        child: LayoutBuilder(
          builder: (context, box) {
            final size = Size(box.maxWidth, height);
            return GestureDetector(
              key: const Key('car-outline'),
              onTapUp: onTap == null ? null : (d) => onTap!((d.localPosition.dx / size.width).clamp(0, 1), (d.localPosition.dy / size.height).clamp(0, 1)),
              child: CustomPaint(size: size, painter: _CarPainter(damages, highlight)),
            );
          },
        ),
      ),
    );
  }
}

class _CarPainter extends CustomPainter {
  _CarPainter(this.damages, this.highlight);
  final List<DamageModel> damages;
  final Set<int> highlight;

  @override
  void paint(Canvas canvas, Size size) {
    // The body: 42 % of the width, nearly the whole height, centred.
    final w = size.width * 0.42;
    final h = size.height * 0.86;
    final body = Rect.fromCenter(center: size.center(Offset.zero), width: w, height: h);
    final line = Paint()
      ..color = AppColors.ink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawRRect(RRect.fromRectAndRadius(body, Radius.circular(w * 0.32)), Paint()..color = AppColors.canvas);
    canvas.drawRRect(RRect.fromRectAndRadius(body, Radius.circular(w * 0.32)), line);
    final glass = Paint()
      ..color = AppColors.muted
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    // Windscreen, roof, rear window.
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(body.left + w * 0.14, body.top + h * 0.22, w * 0.72, h * 0.16), const Radius.circular(8)), glass);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(body.left + w * 0.16, body.top + h * 0.42, w * 0.68, h * 0.24), const Radius.circular(6)), glass);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(body.left + w * 0.14, body.top + h * 0.70, w * 0.72, h * 0.12), const Radius.circular(8)), glass);
    // Wheels.
    final wheel = Paint()..color = AppColors.ink;
    for (final dy in [0.17, 0.78]) {
      for (final left in [true, false]) {
        canvas.drawRRect(
          RRect.fromRectAndRadius(Rect.fromLTWH(left ? body.left - 6 : body.right - 2, body.top + h * dy, 8, h * 0.11), const Radius.circular(3)),
          wheel,
        );
      }
    }
    final label = TextPainter(textDirection: ui.TextDirection.ltr);
    void text(String s, Offset at, {Color color = AppColors.muted, double size = 10, FontWeight weight = FontWeight.w600}) {
      label
        ..text = TextSpan(
          text: s,
          style: TextStyle(color: color, fontSize: size, fontWeight: weight, letterSpacing: 0.6),
        )
        ..layout();
      label.paint(canvas, at - Offset(label.width / 2, label.height / 2));
    }

    text('paperwork.front'.tr().toUpperCase(), Offset(size.width / 2, body.top - 9));
    text('paperwork.rear'.tr().toUpperCase(), Offset(size.width / 2, body.bottom + 9));
    for (final d in damages) {
      final c = Offset(d.x * size.width, d.y * size.height);
      canvas.drawCircle(c, 11, Paint()..color = highlight.contains(d.n) ? AppStatus.warn : AppStatus.bad);
      text('${d.n}', c, color: Colors.white, size: 11, weight: FontWeight.w800);
    }
  }

  @override
  bool shouldRepaint(_CarPainter old) => old.damages != damages || old.highlight != highlight;
}

// ---- Photos --------------------------------------------------------------------------------------------------------

/// A report's photo, read through the API (never a public link) and kept in memory.
class InspectionPhotoView extends StatefulWidget {
  const InspectionPhotoView({super.key, required this.owner, required this.kind, required this.photoId, this.fit = BoxFit.cover});
  final PaperworkOwner owner;
  final String kind;
  final String photoId;
  final BoxFit fit;

  @override
  State<InspectionPhotoView> createState() => _InspectionPhotoViewState();
}

class _InspectionPhotoViewState extends State<InspectionPhotoView> {
  late Future<Uint8List?> _bytes = _load();

  Future<Uint8List?> _load() async {
    final result = await locator<LoadInspectionPhotoUseCase>()(InspectionPhotoParams(widget.owner, widget.kind, widget.photoId));
    return result.fold((_) => null, (bytes) => bytes);
  }

  @override
  void didUpdateWidget(covariant InspectionPhotoView old) {
    super.didUpdateWidget(old);
    if (old.photoId != widget.photoId) _bytes = _load();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Uint8List?>(
      future: _bytes,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const ColoredBox(
            color: AppColors.canvas,
            child: Center(child: SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))),
          );
        }
        final bytes = snap.data;
        if (bytes == null) {
          return ColoredBox(
            color: AppColors.canvas,
            child: Center(child: Icon(Icons.broken_image_outlined, color: AppColors.muted.withValues(alpha: 0.7))),
          );
        }
        return Image.memory(bytes, fit: widget.fit, gaplessPlayback: true);
      },
    );
  }
}

/// Takes a photo of the car with the camera (the files on a browser), reduced for the upload; null when cancelled.
Future<Uint8List?> pickInspectionPhoto(BuildContext context) async {
  try {
    final file = await ImagePicker().pickImage(
      // A browser or a desktop has no camera picker: the files then.
      source: kIsWeb ? ImageSource.gallery : ImageSource.camera,
      maxWidth: 1600,
      maxHeight: 1600,
      imageQuality: 70,
    );
    return file == null ? null : await file.readAsBytes();
  } on PlatformException {
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('paperwork.camera_denied'.tr())));
    return null;
  }
}

/// Plazo Pro: the photos the traveller took themselves and sent (20/10/2026), next to the parking's report.
class ClientPhotosCard extends StatelessWidget {
  const ClientPhotosCard({super.key, required this.owner, required this.kind, required this.report});
  final PaperworkOwner owner;
  final String kind;
  final InspectionModel report;

  @override
  Widget build(BuildContext context) {
    final at = report.completedAt == null ? '' : DateFormat("d MMM 'à' HH:mm", 'fr').format(report.completedAt!.toLocal());
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        key: const Key('client-photos'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('paperwork.client_photos'.tr().toUpperCase(), style: AppText.label(size: 11)),
            const SizedBox(height: 4),
            Text('paperwork.client_photos_sent'.tr(args: ['${report.photos.length}', at]), style: AppText.muted(size: 12.5)),
            const SizedBox(height: 8),
            PhotoStrip(owner: owner, kind: kind, photos: report.photos),
            if (report.photosErased) Text('paperwork.photos_erased'.tr(), style: AppText.muted(size: 12.5)),
            if (report.notes != null) ...[const SizedBox(height: 8), Text('« ${report.notes} »', style: AppText.body(size: 13.5, height: 1.4))],
          ],
        ),
      ),
    );
  }
}

/// Photos in rows of three, each one opened full screen on a tap.
class PhotoStrip extends StatelessWidget {
  const PhotoStrip({super.key, required this.owner, required this.kind, required this.photos});
  final PaperworkOwner owner;
  final String kind;
  final List<InspectionPhotoModel> photos;

  @override
  Widget build(BuildContext context) => GridView.count(
    crossAxisCount: 3,
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    mainAxisSpacing: 6,
    crossAxisSpacing: 6,
    children: [
      for (final p in photos)
        Semantics(
          button: true,
          label: slotLabel(p.slot),
          child: GestureDetector(
            onTap: () => showPhoto(context, owner, kind, p.id, slotLabel(p.slot)),
            child: ClipRRect(
              borderRadius: AppRadius.chip,
              child: InspectionPhotoView(owner: owner, kind: kind, photoId: p.id),
            ),
          ),
        ),
    ],
  );
}

/// Opens a photo full screen (pinch to zoom).
Future<void> showPhoto(BuildContext context, PaperworkOwner owner, String kind, String photoId, String title) {
  return Navigator.of(context).push(
    MaterialPageRoute<void>(
      fullscreenDialog: true,
      builder: (_) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, foregroundColor: Colors.white, title: Text(title)),
        body: InteractiveViewer(
          maxScale: 5,
          child: Center(
            child: InspectionPhotoView(owner: owner, kind: kind, photoId: photoId, fit: BoxFit.contain),
          ),
        ),
      ),
    ),
  );
}

// ---- Labels --------------------------------------------------------------------------------------------------------

String slotLabel(String slot) => 'paperwork.slot.$slot'.tr();

String fuelLabel(int? quarters) => quarters == null ? '—' : 'paperwork.fuel_value.$quarters'.tr();

/// « Validé le 12 nov. à 06:41 », « Réserve le … », « Validé sans réponse », « En attente du client ».
String decisionLabel(InspectionModel r) {
  final at = r.decidedAt == null ? '' : DateFormat("d MMM 'à' HH:mm", 'fr').format(r.decidedAt!.toLocal());
  return switch (r.decision) {
    'accepted' => 'paperwork.decision.accepted'.tr(args: [at]),
    'accepted_by_default' => 'paperwork.decision.accepted_by_default'.tr(),
    'reserved' => 'paperwork.decision.reserved'.tr(args: [at]),
    _ => r.completed ? 'paperwork.decision.pending'.tr() : 'paperwork.decision.draft'.tr(),
  };
}

Color decisionColor(InspectionModel r) => switch (r.decision) {
  'accepted' || 'accepted_by_default' => AppStatus.ok,
  'reserved' => AppStatus.bad,
  _ => AppStatus.warn,
};

/// A small row of fuel bars (0 to 4 quarters).
class FuelBars extends StatelessWidget {
  const FuelBars({super.key, required this.quarters, this.onSelected});
  final int? quarters;
  final ValueChanged<int>? onSelected;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var q = 0; q <= 4; q++) ...[
          Expanded(
            child: Semantics(
              button: onSelected != null,
              selected: quarters == q,
              label: fuelLabel(q),
              child: InkWell(
                key: Key('fuel-$q'),
                onTap: onSelected == null ? null : () => onSelected!(q),
                borderRadius: AppRadius.small,
                child: Container(
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: quarters != null && q <= quarters! && q > 0 ? AppColors.action : AppColors.canvas,
                    borderRadius: AppRadius.small,
                    border: Border.all(color: quarters == q ? AppColors.accent : AppColors.line, width: quarters == q ? 2 : 1),
                  ),
                  child: Text(q == 0 ? 'paperwork.fuel_empty'.tr() : '$q/4', style: AppText.body(size: 12, weight: 600)),
                ),
              ),
            ),
          ),
          if (q < 4) const SizedBox(width: 4),
        ],
      ],
    );
  }
}
