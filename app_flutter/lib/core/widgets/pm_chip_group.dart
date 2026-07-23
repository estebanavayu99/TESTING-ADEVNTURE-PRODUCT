import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/pickmap_colors.dart';

class PmChipOption {
  const PmChipOption(this.value, this.label);
  final String value;
  final String label;
}

/// Equivalente a `.chip-group` de onboarding.html: chips de selección
/// múltiple con estado `is-selected` (toggle libre, sin límite de
/// cantidad — mismo comportamiento real de `js/onboarding.js`). El chip
/// activo suma un ✓ animado (aparece con un leve "pop") en vez de solo
/// cambiar de color — más feedback táctil de que la selección registró.
class PmChipGroup extends StatelessWidget {
  const PmChipGroup({
    super.key,
    required this.options,
    required this.selected,
    required this.onToggle,
  });

  final List<PmChipOption> options;
  final Set<String> selected;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((opt) {
        final active = selected.contains(opt.value);
        return _PmChip(
          label: opt.label,
          active: active,
          onTap: () => onToggle(opt.value),
        );
      }).toList(),
    );
  }
}

class _PmChip extends StatefulWidget {
  const _PmChip({required this.label, required this.active, required this.onTap});

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  State<_PmChip> createState() => _PmChipState();
}

class _PmChipState extends State<_PmChip> with SingleTickerProviderStateMixin {
  late final AnimationController _bounce = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 180),
    lowerBound: 0.94,
    upperBound: 1,
    value: 1,
  );

  @override
  void dispose() {
    _bounce.dispose();
    super.dispose();
  }

  void _handleTap() {
    HapticFeedback.selectionClick();
    widget.onTap();
    _bounce.forward(from: 0.94);
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.active;
    return GestureDetector(
      onTap: _handleTap,
      child: ScaleTransition(
        scale: _bounce,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: active ? PickmapColors.coral : Colors.white,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: active ? PickmapColors.coral : PickmapColors.mist.withValues(alpha: 0.7),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedSize(
                duration: const Duration(milliseconds: 160),
                curve: Curves.easeOut,
                child: active
                    ? const Padding(
                        padding: EdgeInsets.only(right: 6),
                        child: Icon(Icons.check_rounded, size: 15, color: Colors.white),
                      )
                    : const SizedBox(width: 0, height: 0),
              ),
              Text(
                widget.label,
                style: TextStyle(
                  color: active ? Colors.white : PickmapColors.navy,
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
