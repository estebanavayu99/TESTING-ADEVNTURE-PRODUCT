import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/pickmap_colors.dart';
import 'pm_icon_circle.dart';

/// Equivalente a `.dash__cta` del sitio (`pickpoints.html`/`invita.html`):
/// tarjeta angosta con ícono + título/subtítulo + chevron, usada como
/// puente entre secciones ("Ver mis panoramas", "Ver mis Pick Points").
/// Lleva el mismo "press-scale" táctil que `PmPrimaryButton` (se achica un
/// poco al mantener presionado) para que el feedback de tap sea
/// consistente en toda la app, no solo en los botones primarios.
class PmCtaLink extends StatefulWidget {
  const PmCtaLink({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final String icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  State<PmCtaLink> createState() => _PmCtaLinkState();
}

class _PmCtaLinkState extends State<PmCtaLink> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => setState(() => _pressed = true),
      onPointerUp: (_) => setState(() => _pressed = false),
      onPointerCancel: (_) => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.98 : 1,
        duration: const Duration(milliseconds: 100),
        child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              HapticFeedback.lightImpact();
              widget.onTap();
            },
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: PickmapColors.mist.withValues(alpha: 0.35)),
              ),
              child: Row(
                children: [
                  PmIconCircle(icon: widget.icon, size: 42),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.title, style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 13.5)),
                        Text(widget.subtitle, style: const TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_rounded, color: PickmapColors.coral, size: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
