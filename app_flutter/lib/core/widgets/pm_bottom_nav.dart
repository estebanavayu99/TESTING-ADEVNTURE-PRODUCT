import 'package:flutter/material.dart';

import '../theme/pickmap_colors.dart';

class PmNavItem {
  const PmNavItem(this.icon, this.activeIcon, this.label);
  final IconData icon;
  final IconData activeIcon;
  final String label;
}

/// Nav inferior flotante: tarjeta redondeada con margen, en vez del
/// `BottomNavigationBar` de borde a borde por defecto de Material — el
/// ítem activo se resuelve con una píldora de fondo + ícono relleno, más
/// cercano al lenguaje visual "app nativa moderna" que un simple cambio
/// de color de ícono.
class PmBottomNav extends StatelessWidget {
  const PmBottomNav({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onTap,
  });

  final List<PmNavItem> items;
  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(12, 0, 12, 10),
      child: Container(
        height: 64,
        padding: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: const [
            BoxShadow(color: Color.fromRGBO(30, 45, 49, 0.14), blurRadius: 24, offset: Offset(0, 10)),
          ],
        ),
        child: Row(
          children: List.generate(items.length, (i) {
            final active = i == currentIndex;
            final item = items[i];
            return Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => onTap(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOut,
                  margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 3),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: active ? PickmapColors.coral.withValues(alpha: 0.12) : Colors.transparent,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        active ? item.activeIcon : item.icon,
                        color: active ? PickmapColors.coral : PickmapColors.slate,
                        size: 22,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                          color: active ? PickmapColors.coral : PickmapColors.slate,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
