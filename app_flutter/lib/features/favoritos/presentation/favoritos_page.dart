import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_fade_in.dart';
import '../../../core/widgets/pm_icon_circle.dart';
import '../../panoramas/data/sample_catalog.dart' as catalog;
import '../../panoramas/presentation/panorama_card.dart';
import '../../panoramas/presentation/panorama_detail_sheet.dart';
import '../data/favorites_controller.dart';

/// Mirror de `favoritos.html`. El catálogo real de `businesses` (y por lo
/// tanto los IDs de item) sigue siendo data de muestra (ver
/// `sample_catalog.dart`), pero el favorito en sí ya es una interacción
/// real dentro de la sesión — se guarda en `FavoritesController`
/// (compartido con Explorar vía Provider), no una lista fija hardcodeada.
class FavoritosPage extends StatelessWidget {
  const FavoritosPage({super.key});

  @override
  Widget build(BuildContext context) {
    final favorites = context.watch<FavoritesController>();
    final favoritos = catalog.todoElCatalogo.where((i) => favorites.isFavorited(i.id)).toList();
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          const Text('♥ Tus favoritos', style: TextStyle(color: PickmapColors.coral, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Los panoramas que te gustaron', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          const Text(
            'Todo lo que marcaste con "me gusta" en Panoramas, guardado aquí para que no se te pierda.',
            style: TextStyle(color: PickmapColors.slate),
          ),
          const SizedBox(height: 20),
          if (favoritos.isEmpty)
            PmFadeIn(child: _emptyState())
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: favoritos.length,
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 234,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.76,
              ),
              itemBuilder: (context, i) {
                final item = favoritos[i];
                // Cascada suave, tope de 6 items escalonados — con más
                // favoritos que eso el delay sigue siendo el mismo (no
                // tiene sentido hacer esperar la tarjeta #30).
                return PmFadeIn(
                  delay: Duration(milliseconds: 40 * (i > 6 ? 6 : i)),
                  child: PanoramaCard(
                    item: item,
                    onTap: () => showPanoramaDetail(context, item),
                    favorited: true,
                    onFavoriteToggle: () => favorites.toggle(item.id),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _emptyState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          PmIconCircle(icon: '🤍', size: 72, background: PickmapColors.pink.withValues(alpha: 0.18)),
          const SizedBox(height: 14),
          const Text('Todavía no tienes favoritos', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
          const SizedBox(height: 4),
          const Text('Toca el corazón en cualquier panorama para guardarlo aquí.',
              textAlign: TextAlign.center, style: TextStyle(color: PickmapColors.slate)),
        ],
      ),
    );
  }
}
