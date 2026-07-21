import 'package:flutter/material.dart';

import '../theme/pickmap_theme.dart';

/// Equivalente a `.dcard` (css/dashboard.css): tarjeta blanca, esquinas
/// `--radius`, sombra suave — la unidad base de casi todas las secciones
/// de las páginas logueadas del sitio.
class PmCard extends StatelessWidget {
  const PmCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(PickmapRadius.card),
        boxShadow: PickmapShadows.card,
      ),
      child: child,
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(PickmapRadius.card),
        onTap: onTap,
        child: card,
      ),
    );
  }
}
