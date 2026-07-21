import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/theme/pickmap_theme.dart';
import '../data/panorama_item.dart';

/// Equivalente a `.pano-card` — foto arriba, meta + precio abajo, y el
/// hint "🧠 Por qué te lo recomienda Darwin" cuando el item trae `reason`.
class PanoramaCard extends StatelessWidget {
  const PanoramaCard({super.key, required this.item, required this.onTap});

  final PanoramaItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 210,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(PickmapRadius.card),
          boxShadow: PickmapShadows.card,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 118,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: item.photo,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(color: PickmapColors.mist.withValues(alpha: 0.3)),
                    errorWidget: (context, url, error) => Container(
                      color: PickmapColors.mist.withValues(alpha: 0.3),
                      alignment: Alignment.center,
                      child: Text(item.icon, style: const TextStyle(fontSize: 32)),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(item.icon, style: const TextStyle(fontSize: 14)),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 13.5),
                  ),
                  const SizedBox(height: 4),
                  Text(item.meta, style: const TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('desde ${item.formattedPrice}',
                          style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.coral, fontSize: 13)),
                    ],
                  ),
                  if (item.reason != null) ...[
                    const SizedBox(height: 6),
                    const Text('🧠 Por qué te lo recomienda Darwin',
                        style: TextStyle(color: PickmapColors.slate, fontSize: 10.5, fontStyle: FontStyle.italic)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
