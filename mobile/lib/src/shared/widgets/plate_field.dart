import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/helpers/plate.dart';
import '../theme/theme.dart';

/// The plate field drawn as a French plate (blue "F" band); the dashes of French plates are added
/// when leaving the field, foreign plates stay as typed (the site's PlateInput).
class PlateField extends StatefulWidget {
  const PlateField({super.key, required this.controller, required this.label, this.errorText, this.helperText, this.onChanged});

  final TextEditingController controller;
  final String label;
  final String? errorText;
  final String? helperText;
  final ValueChanged<String>? onChanged;

  @override
  State<PlateField> createState() => _PlateFieldState();
}

class _PlateFieldState extends State<PlateField> {
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() {
      final text = widget.controller.text;
      if (!_focus.hasFocus && text.trim().isNotEmpty) {
        final formatted = formatPlate(text);
        if (formatted != text) {
          widget.controller.value = TextEditingValue(
            text: formatted,
            selection: TextSelection.collapsed(offset: formatted.length),
          );
          widget.onChanged?.call(formatted);
        }
      }
    });
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final error = widget.errorText != null;
    // One node for screen readers: the label, then the field.
    return MergeSemantics(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.label, style: AppText.label(size: 12)),
          const SizedBox(height: 6),
          Container(
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: error ? AppColors.danger : AppColors.ink, width: 1.5),
            ),
            clipBehavior: Clip.antiAlias,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ExcludeSemantics(
                  child: Container(
                    width: 20,
                    color: AppColors.plateBlue,
                    alignment: Alignment.bottomCenter,
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text('F', style: AppText.strong(size: 11, color: Colors.white)),
                  ),
                ),
                Expanded(
                  child: TextField(
                    controller: widget.controller,
                    focusNode: _focus,
                    maxLength: 15,
                    textCapitalization: TextCapitalization.characters,
                    autocorrect: false,
                    enableSuggestions: false,
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9 -]'))],
                    onChanged: widget.onChanged,
                    style: AppText.tabular(size: 18, weight: 800, color: const Color(0xFF111111)).copyWith(letterSpacing: 0.6),
                    decoration: InputDecoration(
                      semanticCounterText: '',
                      counterText: '',
                      hintText: 'AB-123-CD',
                      hintStyle: AppText.body(size: 17, weight: 600, color: AppColors.muted.withValues(alpha: 0.6)),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (widget.errorText != null || widget.helperText != null) ...[
            const SizedBox(height: 6),
            Text(widget.errorText ?? widget.helperText!, style: error ? AppText.body(size: 13, color: AppColors.danger) : AppText.muted(size: 13)),
          ],
        ],
      ),
    );
  }
}
