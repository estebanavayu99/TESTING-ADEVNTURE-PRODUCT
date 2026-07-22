import 'package:flutter/material.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_card.dart';
import '../../../core/widgets/pm_cta_link.dart';
import '../../../core/widgets/pm_fade_in.dart';
import '../../../core/widgets/pm_icon_circle.dart';
import '../../panoramas/presentation/panoramas_page.dart';

/// Mirror de `pickpoints.html` — tarjeta de Darwin con progreso +
/// escalera de cashback + historial de actividad, tarjeta de nivel +
/// formas de ganar puntos + premios por logros. Datos de muestra
/// (mismos textos/valores del sitio) mientras no hay un ledger real de
/// puntos conectado a Supabase.
/// Mismo formato de miles (punto, no coma) que el resto de la app.
String _formatPoints(int n) {
  final s = n.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
    buf.write(s[i]);
  }
  return buf.toString();
}

class PickpointsPage extends StatelessWidget {
  const PickpointsPage({super.key});

  static const _history = [
    ('📍', 'Check-in en Canopy + termas', 'Hace 2 días', '+50 pts', true),
    ('❤️', 'Dejaste una reseña', 'Hace 4 días', '+40 pts', true),
    ('🔥', 'Racha de 4 días', 'Hace 4 días', '+20 pts', true),
    ('🎁', 'Canjeaste: 10% dcto. en tu próximo panorama', 'Hace 6 días', '−150 pts', false),
    ('🌤️', 'Madrugador', 'Hace 1 semana', '+30 pts', true),
    ('🥾', '10 check-ins', 'Hace 3 semanas', '+50 pts', true),
    ('👥', 'Invitaste a un amigo', 'Hace 1 mes', '+100 pts', true),
  ];

  static const _ways = [
    ('🥾', 'Haz check-in en un panorama', '+10 pts c/u'),
    ('❤️', 'Deja una reseña', '+15 pts c/u'),
    ('🌤️', 'Sal antes de las 9am (madrugador)', '+10 pts'),
    ('🔥', 'Mantén tu racha activa cada día', '+5 pts/día'),
    ('👥', 'Invita a un amigo que se una', '+100 pts'),
  ];

  static const _rewards = [
    ('🥉', '10% dcto. en tu próximo panorama', '5 reservas', true),
    ('🎫', 'Entrada 2x1 en un panorama simple', '10 reservas', true),
    ('☕', 'Café o postre gratis con un aliado', '15 reservas', false),
    ('🛍️', '15% dcto. en tienda aliada', '20 reservas', false),
    ('🍽️', 'Cena gratis para 2 en restorán aliado', '25 reservas', false),
    ('🎉', 'Combo gratis para todo tu grupo', '30 reservas', false),
    ('👑', 'Escapada VIP de fin de semana, gratis', '50 reservas', false),
  ];

  /// Un color distinto por premio (en vez de un solo tono opacado) — se
  /// cicla por índice, mismo criterio "más entretenido" pedido por el
  /// usuario para esta pantalla.
  static const _rewardColors = [
    PickmapColors.coral,
    PickmapColors.sun,
    PickmapColors.green,
    PickmapColors.pink,
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          const Text('Pick Points', style: TextStyle(color: PickmapColors.coral, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Hola 👋', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          const Text('Tu nivel, tu cashback y todo tu historial de puntos, en un solo lugar.', style: TextStyle(color: PickmapColors.slate)),
          const SizedBox(height: 18),
          PmFadeIn(
            child: PmCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const PmIconCircle(icon: '🤖', size: 40),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Darwin vio tu actividad', style: TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
                          Text('Vas con todo esta semana, sigue así 🔥', style: TextStyle(fontWeight: FontWeight.w600, color: PickmapColors.navy)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 92,
                      height: 92,
                      // Anillo + contador animados de 0 al valor real al
                      // entrar a la pantalla (`TweenAnimationBuilder` anima
                      // la primera vez que se inserta, sin necesitar
                      // convertir la página a StatefulWidget) — más
                      // "entretenido" que un número/anillo estáticos.
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: 0.83),
                        duration: const Duration(milliseconds: 900),
                        curve: Curves.easeOutCubic,
                        builder: (context, progress, child) => Stack(
                          alignment: Alignment.center,
                          children: [
                            SizedBox(
                              width: 92,
                              height: 92,
                              child: CircularProgressIndicator(
                                value: progress,
                                strokeWidth: 8,
                                backgroundColor: PickmapColors.mist.withValues(alpha: 0.25),
                                valueColor: const AlwaysStoppedAnimation(PickmapColors.coral),
                              ),
                            ),
                            Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(_formatPoints((progress / 0.83 * 1240).round()),
                                    style: const TextStyle(fontWeight: FontWeight.w800, color: PickmapColors.navy, fontSize: 17)),
                                const Text('puntos', style: TextStyle(color: PickmapColors.slate, fontSize: 10)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 18),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Nivel Fiel', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 15)),
                          SizedBox(height: 4),
                          Text('Te faltan 260 Pick Points para tu próximo premio 🎁',
                              style: TextStyle(color: PickmapColors.slate, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _cashbackLadder(),
                const SizedBox(height: 8),
                const Text(
                  '⏳ Reserva al menos una vez cada 2 meses para no perder tu nivel Fiel y seguir subiendo hacia VIP.',
                  style: TextStyle(color: PickmapColors.slate, fontSize: 12),
                ),
                const SizedBox(height: 18),
                const Text('Mi actividad', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                const SizedBox(height: 8),
                for (final h in _history) _historyRow(h.$1, h.$2, h.$3, h.$4, h.$5),
              ],
            ),
            ),
          ),
          const SizedBox(height: 16),
          PmFadeIn(
            delay: const Duration(milliseconds: 80),
            child: PmCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    PmIconCircle(icon: '🙂', size: 40, background: PickmapColors.sun.withValues(alpha: 0.22)),
                    const SizedBox(width: 10),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Nivel Explorador', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                        Text('🔥 4 días seguidos', style: TextStyle(color: PickmapColors.slate, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('Formas de ganar Pick Points', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                const SizedBox(height: 8),
                for (final w in _ways) _simpleRow(w.$1, w.$2, w.$3),
                const SizedBox(height: 16),
                const Text('Premios por logros', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                const Text('Mientras más reservas acumules, mejores son las sorpresas.', style: TextStyle(color: PickmapColors.slate, fontSize: 12)),
                const SizedBox(height: 8),
                for (var i = 0; i < _rewards.length; i++)
                  _rewardRow(_rewards[i].$1, _rewards[i].$2, _rewards[i].$3, _rewards[i].$4, _rewardColors[i % _rewardColors.length]),
              ],
            ),
            ),
          ),
          const SizedBox(height: 16),
          PmFadeIn(
            delay: const Duration(milliseconds: 160),
            child: PmCtaLink(
              icon: '🗺️',
              title: 'Ver mis panoramas',
              subtitle: 'Todo lo que Darwin armó especialmente para ti',
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const Scaffold(body: PanoramasPage()))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _cashbackLadder() {
    // Cada tier con su propio color (no un solo coral desteñido) — de paso
    // VIP se pinta ya en tono dorado, aunque todavía no esté alcanzado,
    // para insinuar "el próximo nivel es el dorado" (patrón común en apps
    // con gamificación: la escalera se ve a todo color, no solo el tramo ya
    // ganado).
    Widget tier(String name, String pct, Color color, bool current) => Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 3),
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: current ? color : color.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Text(name, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: current ? Colors.white : PickmapColors.navy)),
                Text(pct, style: TextStyle(fontSize: 11, color: current ? Colors.white : PickmapColors.slate)),
              ],
            ),
          ),
        );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Tu nivel te da hasta 4% de cashback en cada reserva', style: TextStyle(color: PickmapColors.navy, fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 8),
        Row(
          children: [
            tier('Nuevo', '2,5%', PickmapColors.slate, false),
            tier('Recurrente', '3,5%', PickmapColors.pink, false),
            tier('Fiel', '4%', PickmapColors.coral, true),
            tier('VIP', '5%', PickmapColors.sun, false),
          ],
        ),
      ],
    );
  }

  Widget _historyRow(String icon, String title, String time, String pts, bool positive) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: PickmapColors.navy, fontSize: 13, fontWeight: FontWeight.w600)),
                Text(time, style: const TextStyle(color: PickmapColors.slate, fontSize: 11)),
              ],
            ),
          ),
          Text(pts, style: TextStyle(color: positive ? PickmapColors.green : PickmapColors.deepRed, fontWeight: FontWeight.w700, fontSize: 12.5)),
        ],
      ),
    );
  }

  Widget _simpleRow(String icon, String label, String pts) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 8),
          Expanded(child: Text(label, style: const TextStyle(color: PickmapColors.navy, fontSize: 12.5))),
          Text(pts, style: const TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
        ],
      ),
    );
  }

  Widget _rewardRow(String icon, String label, String req, bool unlocked, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Opacity(
            opacity: unlocked ? 1 : 0.4,
            child: PmIconCircle(icon: icon, size: 30, iconSize: 14, background: color.withValues(alpha: 0.16)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label, style: TextStyle(color: unlocked ? PickmapColors.navy : PickmapColors.slate, fontSize: 12.5)),
          ),
          Text(req, style: const TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
        ],
      ),
    );
  }
}
