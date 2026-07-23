import 'dart:ui' show lerpDouble;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_primary_button.dart';
import '../../../core/widgets/pm_shimmer.dart';
import '../data/panorama_item.dart';

/// Fracción de alto de pantalla que ocupa el sheet (`initialChildSize` de
/// `DraggableScrollableSheet` más abajo) y alto real de su foto — usados acá
/// también para calcular a dónde "vuela" la foto de origen.
const _kSheetInitialSize = 0.78;
const _kSheetPhotoHeight = 230.0;

/// `sourceRect`/`sourceRadius` (posición y radio de la foto de la tarjeta
/// tocada, ya en coordenadas globales) activan un vuelo tipo "hero" de la
/// foto hacia la posición real que ocupa en el sheet. Opcionales: si no se
/// pasan (o el caller no pudo medir la tarjeta), el sheet se abre igual,
/// solo que sin el vuelo.
Future<void> showPanoramaDetail(
  BuildContext context,
  PanoramaItem item, {
  Rect? sourceRect,
  double sourceRadius = 18,
}) {
  if (sourceRect != null) {
    _flyPhotoIntoSheet(context, imageUrl: item.photo, sourceRect: sourceRect, sourceRadius: sourceRadius);
  }
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _PanoramaDetailSheet(item: item),
  );
}

/// `showModalBottomSheet` no admite un `Hero` real entre la tarjeta y el
/// sheet: su ruta es `ModalBottomSheetRoute` (un `PopupRoute`), y
/// `HeroController` solo dispara la animación cuando AMBAS rutas
/// (`fromRoute`/`toRoute`) son `PageRoute` — ver
/// `packages/flutter/lib/src/widgets/heroes.dart`. En vez de eso, se
/// simula el mismo efecto a mano: un `OverlayEntry` con la foto animando
/// desde la tarjeta hasta la posición real de la foto del sheet, con la
/// MISMA duración (250ms) que usa el bottom sheet nativo para entrar
/// (`_kBottomSheetEnterDuration` en el framework) — al completarse, se
/// retira el overlay; la foto real del sheet ya está ahí (mismo
/// `imageUrl`, ya cacheada por `CachedNetworkImage`), así que no se nota
/// el empalme.
void _flyPhotoIntoSheet(BuildContext context, {required String imageUrl, required Rect sourceRect, required double sourceRadius}) {
  final overlay = Overlay.of(context);
  final screenSize = MediaQuery.sizeOf(context);
  final targetRect = Rect.fromLTWH(0, screenSize.height * (1 - _kSheetInitialSize), screenSize.width, _kSheetPhotoHeight);
  late final OverlayEntry entry;
  entry = OverlayEntry(
    builder: (context) => _PhotoFlight(
      imageUrl: imageUrl,
      sourceRect: sourceRect,
      targetRect: targetRect,
      sourceRadius: sourceRadius,
      onEnd: () => entry.remove(),
    ),
  );
  overlay.insert(entry);
}

class _PhotoFlight extends StatefulWidget {
  const _PhotoFlight({
    required this.imageUrl,
    required this.sourceRect,
    required this.targetRect,
    required this.sourceRadius,
    required this.onEnd,
  });

  final String imageUrl;
  final Rect sourceRect;
  final Rect targetRect;
  final double sourceRadius;
  final VoidCallback onEnd;

  @override
  State<_PhotoFlight> createState() => _PhotoFlightState();
}

class _PhotoFlightState extends State<_PhotoFlight> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _curve;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 250))
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) widget.onEnd();
      })
      ..forward();
    _curve = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _curve,
      builder: (context, child) {
        final rect = Rect.lerp(widget.sourceRect, widget.targetRect, _curve.value)!;
        final radius = lerpDouble(widget.sourceRadius, 0, _curve.value)!;
        return Positioned.fromRect(
          rect: rect,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: CachedNetworkImage(imageUrl: widget.imageUrl, fit: BoxFit.cover),
          ),
        );
      },
    );
  }
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
                          Positioned(top: 16, left: 16, child: _KindBadge(item: item)),
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
                          if (item.kind == PanoramaKind.paquete && item.components.length > 1) ...[
                            const SizedBox(height: 18),
                            Container(height: 1, color: PickmapColors.mist.withValues(alpha: 0.25)),
                            const SizedBox(height: 18),
                            _PackageIncludes(item: item),
                          ],
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

/// Mismo badge y mismos colores que `.pano-modal__kind--simple`/
/// `--paquete` del sitio — nunca deja ambigüedad sobre si esto es un
/// panorama simple o un paquete de varias actividades.
class _KindBadge extends StatelessWidget {
  const _KindBadge({required this.item});

  final PanoramaItem item;

  @override
  Widget build(BuildContext context) {
    final isPaquete = item.kind == PanoramaKind.paquete;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.92), borderRadius: BorderRadius.circular(999)),
      child: Text(
        item.kindLabel.toUpperCase(),
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.4,
          color: isPaquete ? PickmapColors.deepRed : const Color(0xFF3F7A2C),
        ),
      ),
    );
  }
}

/// Desglose explícito de qué actividades junta un paquete (ej. "Museo +
/// almuerzo con guía" → Museo, Almuerzo con guía) — un paquete es varias
/// experiencias combinadas y el sitio nunca lo deja como un solo bloque
/// de texto ambiguo, siempre se puede ver de qué está compuesto.
class _PackageIncludes extends StatelessWidget {
  const _PackageIncludes({required this.item});

  final PanoramaItem item;

  @override
  Widget build(BuildContext context) {
    final parts = item.components;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('🧳 Este paquete incluye', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 13.5)),
        const SizedBox(height: 10),
        for (var i = 0; i < parts.length; i++)
          Padding(
            padding: EdgeInsets.only(bottom: i == parts.length - 1 ? 0 : 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.check_circle_rounded, size: 17, color: PickmapColors.deepRed.withValues(alpha: 0.85)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(parts[i], style: const TextStyle(color: PickmapColors.navy, fontSize: 13.5, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
      ],
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
