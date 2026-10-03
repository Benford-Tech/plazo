import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// Two (or more) segments on a light lilac track, the active one white with violet text
/// (mockups A2, A4, A5).
class Segmented<T> extends StatelessWidget {
  const Segmented({super.key, required this.values, required this.labels, required this.selected, required this.onChanged});

  final List<T> values;
  final List<String> labels;
  final T selected;
  final ValueChanged<T>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(color: AppColors.tintSoft, borderRadius: BorderRadius.circular(22)),
      child: Row(
        children: [
          for (var i = 0; i < values.length; i++)
            Expanded(
              child: Semantics(
                selected: values[i] == selected,
                button: onChanged != null,
                inMutuallyExclusiveGroup: true,
                child: InkWell(
                  borderRadius: BorderRadius.circular(19),
                  onTap: onChanged == null ? null : () => onChanged!(values[i]),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    constraints: const BoxConstraints(minHeight: 42),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: values[i] == selected ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(19),
                      boxShadow: values[i] == selected ? const [BoxShadow(color: Color(0x1A000000), blurRadius: 4, offset: Offset(0, 1))] : null,
                    ),
                    child: Text(
                      labels[i],
                      textAlign: TextAlign.center,
                      style: AppText.body(size: 13.5, weight: 600, color: values[i] == selected ? AppColors.accent : AppColors.muted),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// A rounded chip: violet when selected (sort, anchors, shuttle limit).
class PillChip extends StatelessWidget {
  const PillChip({super.key, required this.label, this.selected = false, this.onTap, this.icon, this.semanticsLabel});

  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final IconData? icon;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: semanticsLabel ?? label,
      excludeSemantics: true,
      child: Material(
        color: selected ? AppColors.accent : Colors.white,
        shape: StadiumBorder(side: BorderSide(color: selected ? AppColors.accent : AppColors.line)),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: onTap,
          child: ConstrainedBox(
            // 48 px tap target, the chip itself drawn smaller inside.
            constraints: const BoxConstraints(minHeight: 40, minWidth: 48),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[Icon(icon, size: 16, color: selected ? Colors.white : AppColors.ink), const SizedBox(width: 6)],
                  Text(label, style: AppText.body(size: 13, weight: 600, color: selected ? Colors.white : AppColors.ink)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
