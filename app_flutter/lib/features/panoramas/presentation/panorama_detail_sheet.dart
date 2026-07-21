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

/// Diseño minimalista/profesional a propósito: foto sin overlay de
/// texto, jerarquía plana (título → dato rápido → separador → "por qué
/// Darwin"), y una barra inferior fija con precio + CTA (patrón estándar
/// de apps de reservas tipo Airbnb/Booking) en vez de dejar el botón
/// suelto al final del scroll.
class _PanoramaDetailSheet extends StatelessWidget {
  const _PanoramaDetailSheet({required this.item});

  final PanoramaItem item;

  void _handleReserve(BuildContext context) {
    // Sin backend de reservas todavía (ver README) — se avisa honesto en
    // vez de fingir una reserva confirmada que no existe.
    final messenger = ScaffoldMessenger.of(context);
    Navigator.of(context).pop();
    messenger.showSnackBar(
      const SnackBar(content: Text('¡Gracias por tu interés! Muy pronto vas a poder reservar directo desde la app.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.78,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Expanded(
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
                            height: 230,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            fadeInDuration: const Duration(milliseconds: 220),
                            placeholder: (context, url) => const SizedBox(height: 230, width: double.infinity, child: PmShimmer()),
                            errorWidget: (context, url, error) => Container(
                              height: 230,
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
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.title,
                              style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800, color: PickmapColors.navy, height: 1.2)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.schedule_rounded, size: 15, color: PickmapColors.slate),
                              const SizedBox(width: 6),
                              Expanded(child: Text(item.meta, style: const TextStyle(color: PickmapColors.slate, fontSize: 13))),
                            ],
                          ),
                          if (item.reason != null) ...[
                            const SizedBox(height: 18),
                            Container(height: 1, color: PickmapColors.mist.withValues(alpha: 0.25)),
                            const SizedBox(height: 18),
                            _WhyCallout(reason: item.reason!),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              _BottomBar(item: item, onReserve: () => _handleReserve(context)),
            ],
          ),
        );
      },
    );
  }
}

class _WhyCallout extends StatelessWidget {
  const _WhyCallout({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(width: 3, decoration: BoxDecoration(color: PickmapColors.sun, borderRadius: BorderRadius.circular(999))),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('🧠 Por qué Darwin te lo recomienda',
                    style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 13.5)),
                const SizedBox(height: 8),
                Text(reason, style: const TextStyle(color: PickmapColors.navy, height: 1.45, fontSize: 13.5)),
                const SizedBox(height: 10),
                _bullet('Coincide con el tipo de experiencia que declaraste en tu onboarding.'),
                _bullet('Está entre los mejor evaluados en su categoría dentro de tu radio de distancia.'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _bullet(String text) => Padding(
        padding: const EdgeInsets.only(top: 5),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• ', style: TextStyle(color: PickmapColors.slate, fontSize: 13)),
            Expanded(child: Text(text, style: const TextStyle(color: PickmapColors.slate, fontSize: 12.5, height: 1.4))),
          ],
        ),
      );
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({required this.item, required this.onReserve});

  final PanoramaItem item;
  final VoidCallback onReserve;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: PickmapColors.mist.withValues(alpha: 0.3))),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Precio', style: TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
                    Text('desde ${item.formattedPrice}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: PickmapColors.navy)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 150,
                child: PmPrimaryButton(label: 'Reservar', onPressed: onReserve),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
