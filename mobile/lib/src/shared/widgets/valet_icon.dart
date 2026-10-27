import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/theme.dart';

/// « Voiturier au terminal » (27/10/2026): the little valet (cap, body, key) that marks a valet booking everywhere.
class ValetIcon extends StatelessWidget {
  const ValetIcon({super.key, this.size = 16, this.color = AppStatus.info});

  final double size;
  final Color color;

  static const _svg = '''<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 6.2 12 4l4.5 2.2v1.3h-9z" fill="#000"/><circle cx="12" cy="9.6" r="2.6" fill="#000"/>
<path d="M6.5 21v-3.6a5.5 5.5 0 0 1 11 0V21z" fill="#000"/>
<circle cx="17.6" cy="18.4" r="2.1" fill="none" stroke="#000" stroke-width="1.4"/>
<path d="M19.1 19.9l2.2 2.2M20.4 21.2l.9-.9" stroke="#000" stroke-width="1.4" stroke-linecap="round"/></svg>''';

  @override
  Widget build(BuildContext context) =>
      SvgPicture.string(_svg, width: size, height: size, colorFilter: ColorFilter.mode(color, BlendMode.srcIn));
}

/// « Voiturier · Terminal 1 »: the indigo pill of a valet booking.
class ValetPill extends StatelessWidget {
  const ValetPill({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => Container(
    key: const Key('valet-pill'),
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: const BoxDecoration(color: AppStatus.infoSoft, borderRadius: AppRadius.pill),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const ValetIcon(size: 14),
        const SizedBox(width: 4),
        Text(label, style: AppText.body(size: 12, weight: 700, color: AppStatus.info)),
      ],
    ),
  );
}
