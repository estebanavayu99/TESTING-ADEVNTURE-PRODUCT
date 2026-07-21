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
  const PanoramaCard({super.key, required this.item, required this.onTap, this.favorited = false, this.onFavoriteToggle});

  final PanoramaItem item;
  final VoidCallback onTap;
  final bool favorited;
  final VoidCallback? onFavoriteToggle;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 1.05,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                boxShadow: const [
                  BoxShadow(color: Color.fromRGBO(30, 45, 49, 0.10), blurRadius: 14, offset: Offset(0, 6)),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
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
                        child: Text(item.icon, style: const TextStyle(fontSize: 34)),
                      ),
                    ),
                    if (item.reason != null)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: _badge('🧠 Darwin'),
                      ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: onFavoriteToggle,
                        child: Container(
                          width: 30,
                          height: 30,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.92),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            favorited ? Icons.favorite : Icons.favorite_border,
                            size: 16,
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
          const SizedBox(height: 8),
          Text(
            item.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 13.5),
          ),
          const SizedBox(height: 2),
          Text(item.meta, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
          const SizedBox(height: 4),
          Text('desde ${item.formattedPrice}',
              style: const TextStyle(fontWeight: FontWeight.w800, color: PickmapColors.navy, fontSize: 13.5)),
        ],
      ),
    );
  }

  Widget _badge(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: PickmapColors.navy)),
      );
}
