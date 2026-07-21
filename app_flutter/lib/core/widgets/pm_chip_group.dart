import 'package:flutter/material.dart';

import '../theme/pickmap_colors.dart';

class PmChipOption {
  const PmChipOption(this.value, this.label);
  final String value;
  final String label;
}

/// Equivalente a `.chip-group` de onboarding.html: chips de selección
/// múltiple con estado `is-selected` (toggle libre, sin límite de
/// cantidad — mismo comportamiento real de `js/onboarding.js`).
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
        return GestureDetector(
          onTap: () => onToggle(opt.value),
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
            child: Text(
              opt.label,
              style: TextStyle(
                color: active ? Colors.white : PickmapColors.navy,
                fontWeight: FontWeight.w600,
                fontSize: 13.5,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
