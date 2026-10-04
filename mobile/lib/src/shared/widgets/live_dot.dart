import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// A pulsing dot: something is live (the position being shared).
class LiveDot extends StatefulWidget {
  const LiveDot({super.key, this.color = AppColors.accent, this.size = 10, this.animate = true});

  final Color color;
  final double size;
  final bool animate;

  /// Widget tests switch the pulse off (a repeating animation never settles).
  static bool animationsEnabled = true;

  @override
  State<LiveDot> createState() => _LiveDotState();
}

class _LiveDotState extends State<LiveDot> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));

  @override
  void initState() {
    super.initState();
    if (widget.animate && LiveDot.animationsEnabled) _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size * 2,
      height: widget.size * 2,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) => Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: widget.size * (1 + _controller.value),
              height: widget.size * (1 + _controller.value),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color.withValues(alpha: 0.35 * (1 - _controller.value)),
              ),
            ),
            Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(shape: BoxShape.circle, color: widget.color),
            ),
          ],
        ),
      ),
    );
  }
}
