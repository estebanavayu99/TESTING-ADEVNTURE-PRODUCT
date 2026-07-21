import 'package:flutter/material.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../panoramas/data/sample_catalog.dart' as catalog;
import '../../panoramas/presentation/panorama_card.dart';
import '../../panoramas/presentation/panorama_detail_sheet.dart';

/// Mirror de `favoritos.html`. Esta primera etapa no persiste favoritos
/// reales todavía (eso viaja junto con el catálogo real de `businesses`)
/// — se muestra una selección de muestra para diseñar la grilla y el
/// estado vacío, ambos ya reales en su layout.
class FavoritosPage extends StatelessWidget {
  const FavoritosPage({super.key});

  @override
  Widget build(BuildContext context) {
    final favoritos = catalog.recomendados;
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
            _emptyState()
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
                return PanoramaCard(item: item, onTap: () => showPanoramaDetail(context, item));
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
        children: const [
          Text('🤍', style: TextStyle(fontSize: 48)),
          SizedBox(height: 12),
          Text('Todavía no tienes favoritos', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
          SizedBox(height: 4),
          Text('Toca el corazón en cualquier panorama para guardarlo aquí.',
              textAlign: TextAlign.center, style: TextStyle(color: PickmapColors.slate)),
        ],
      ),
    );
  }
}
