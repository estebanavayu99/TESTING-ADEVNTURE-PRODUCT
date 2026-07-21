import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_primary_button.dart';
import '../../../core/widgets/pm_shimmer.dart';
import '../data/panorama_item.dart';

Future<void> showPanoramaDetail(BuildContext context, PanoramaItem item) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _PanoramaDetailSheet(item: item),
  );
}

class _PanoramaDetailSheet extends StatelessWidget {
  const _PanoramaDetailSheet({required this.item});

  final PanoramaItem item;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: scrollController,
            padding: EdgeInsets.zero,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: Stack(
                  children: [
                    CachedNetworkImage(
                      imageUrl: item.photo,
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      fadeInDuration: const Duration(milliseconds: 220),
                      placeholder: (context, url) => const SizedBox(height: 200, width: double.infinity, child: PmShimmer()),
                      errorWidget: (context, url, error) => Container(
                        height: 200,
                        color: PickmapColors.mist.withValues(alpha: 0.3),
                        alignment: Alignment.center,
                        child: Text(item.icon, style: const TextStyle(fontSize: 48)),
                      ),
                    ),
                    Positioned(
                      top: 10,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: GestureDetector(
                        onTap: () => Navigator.of(context).pop(),
                        child: Container(
                          width: 32,
                          height: 32,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.9), shape: BoxShape.circle),
                          child: const Icon(Icons.close_rounded, size: 18, color: PickmapColors.navy),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.title,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                    const SizedBox(height: 4),
                    Text(item.meta, style: const TextStyle(color: PickmapColors.slate)),
                    const SizedBox(height: 12),
                    Text('desde ${item.formattedPrice}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: PickmapColors.coral)),
                    if (item.reason != null) ...[
                      const SizedBox(height: 18),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: PickmapColors.sun.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: PickmapColors.sun.withValues(alpha: 0.4)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('🧠 Por qué Darwin te lo recomienda',
                                style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                            const SizedBox(height: 8),
                            Text(item.reason!, style: const TextStyle(color: PickmapColors.navy, height: 1.4)),
                            const SizedBox(height: 10),
                            _bullet('Coincide con el tipo de experiencia que declaraste en tu onboarding.'),
                            _bullet('Está entre los mejor evaluados en su categoría dentro de tu radio de distancia.'),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    PmPrimaryButton(label: 'Reservar', onPressed: () => Navigator.of(context).pop()),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _bullet(String text) => Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• ', style: TextStyle(color: PickmapColors.navy)),
            Expanded(child: Text(text, style: const TextStyle(color: PickmapColors.navy, fontSize: 13))),
          ],
        ),
      );
}
