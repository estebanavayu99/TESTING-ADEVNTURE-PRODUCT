import 'package:flutter/material.dart';

/// Insignia circular con emoji/ícono centrado sobre un fondo suave —
/// reemplaza el patrón repetido "Container redondo + Text(emoji)" que
/// aparecía suelto en cada tarjeta (Pick Points, Mi cuenta, Invita).
class PmIconCircle extends StatelessWidget {
  const PmIconCircle({
    super.key,
    required this.icon,
    this.size = 44,
    this.background,
    this.iconSize,
  });

  final String icon;
  final double size;
  final Color? background;
  final double? iconSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: background ?? Theme.of(context).colorScheme.primary.withValues(alpha: 0.10),
        shape: BoxShape.circle,
      ),
      child: Text(icon, style: TextStyle(fontSize: iconSize ?? size * 0.46)),
    );
  }
}
