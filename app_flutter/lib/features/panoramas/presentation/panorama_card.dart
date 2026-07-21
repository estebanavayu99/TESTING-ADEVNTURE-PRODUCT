import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_shimmer.dart';
import '../data/panorama_item.dart';

/// Tarjeta de panorama, estilo "foto + info debajo" (patrón tipo
/// Airbnb): la foto lleva esquinas redondeadas completas y dos badges
/// flotantes (favorito arriba-derecha, "🧠 Darwin" arriba-izquierda si el
/// item trae `reason`) — reemplaza el hint de texto plano que antes iba
/// debajo de la tarjeta, más compacto y más visual.
class PanoramaCard extends StatelessWidget {
  const PanoramaCard({
    super.key,
    required this.item,
    required this.onTap,
    this.favorited = false,
    this.onFavoriteToggle,
    this.compact = false,
  });

  final PanoramaItem item;
  final VoidCallback onTap;
  final bool favorited;
  final VoidCallback? onFavoriteToggle;

  /// Versión más chica (badges/texto reducidos) para las filas y la
  /// grilla de `panoramas.html`, pensada para mostrar 3 tarjetas por
  /// fila en vez de 2 — Favoritos sigue usando el tamaño normal.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final badgeSize = compact ? 24.0 : 30.0;
    final badgeIconSize = compact ? 13.0 : 16.0;
    final titleSize = compact ? 12.0 : 13.5;
    final metaSize = compact ? 10.5 : 11.5;
    final priceSize = compact ? 12.0 : 13.5;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 1.05,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(compact ? 14 : 18),
                boxShadow: const [
                  BoxShadow(color: Color.fromRGBO(30, 45, 49, 0.10), blurRadius: 14, offset: Offset(0, 6)),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(compact ? 14 : 18),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: item.photo,
                      fit: BoxFit.cover,
                      fadeInDuration: const Duration(milliseconds: 220),
                      placeholder: (context, url) => const PmShimmer(),
                      errorWidget: (context, url, error) => Container(
                        color: PickmapColors.mist.withValues(alpha: 0.25),
                        alignment: Alignment.center,
                        child: Text(item.icon, style: TextStyle(fontSize: compact ? 22 : 34)),
                      ),
                    ),
                    if (item.reason != null)
                      Positioned(
                        top: compact ? 5 : 8,
                        left: compact ? 5 : 8,
                        child: _badge(compact ? '🧠' : '🧠 Darwin', compact),
                      ),
                    Positioned(
                      top: compact ? 5 : 8,
                      right: compact ? 5 : 8,
                      child: GestureDetector(
                        onTap: onFavoriteToggle,
                        child: Container(
                          width: badgeSize,
                          height: badgeSize,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.92),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            favorited ? Icons.favorite : Icons.favorite_border,
                            size: badgeIconSize,
                            color: favorited ? PickmapColors.coral : PickmapColors.navy,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SizedBox(height: compact ? 6 : 8),
          Text(
            item.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: titleSize),
          ),
          const SizedBox(height: 2),
          Text(item.meta, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: PickmapColors.slate, fontSize: metaSize)),
          SizedBox(height: compact ? 2 : 4),
          Text('desde ${item.formattedPrice}',
              style: TextStyle(fontWeight: FontWeight.w800, color: PickmapColors.navy, fontSize: priceSize)),
        ],
      ),
    );
  }

  Widget _badge(String label, bool compact) => Container(
        padding: EdgeInsets.symmetric(horizontal: compact ? 6 : 8, vertical: compact ? 3 : 4),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(label, style: TextStyle(fontSize: compact ? 9 : 10, fontWeight: FontWeight.w700, color: PickmapColors.navy)),
      );
}
