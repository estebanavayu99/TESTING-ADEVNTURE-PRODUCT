import 'package:flutter/material.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_card.dart';

/// Mirror de `pickpoints.html` — tarjeta de Darwin con progreso +
/// escalera de cashback + historial de actividad, tarjeta de nivel +
/// formas de ganar puntos + premios por logros. Datos de muestra
/// (mismos textos/valores del sitio) mientras no hay un ledger real de
/// puntos conectado a Supabase.
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
          PmCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: PickmapColors.bg, borderRadius: BorderRadius.circular(999)),
                      child: const Text('🤖', style: TextStyle(fontSize: 20)),
                    ),
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
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: 0.83,
                    minHeight: 10,
                    backgroundColor: PickmapColors.mist.withValues(alpha: 0.3),
                    valueColor: const AlwaysStoppedAnimation(PickmapColors.coral),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('1.240 Pick Points', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                  ],
                ),
                const Text('Te faltan 260 Pick Points para tu próximo premio 🎁', style: TextStyle(color: PickmapColors.slate, fontSize: 12)),
                const SizedBox(height: 18),
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
          const SizedBox(height: 16),
          PmCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: PickmapColors.bg, borderRadius: BorderRadius.circular(999)),
                      child: const Text('🙂', style: TextStyle(fontSize: 20)),
                    ),
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
                for (final r in _rewards) _rewardRow(r.$1, r.$2, r.$3, r.$4),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _cashbackLadder() {
    Widget tier(String name, String pct, bool done, bool current) => Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 3),
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: current ? PickmapColors.coral : (done ? PickmapColors.coral.withValues(alpha: 0.12) : PickmapColors.bg),
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
            tier('Nuevo', '2,5%', true, false),
            tier('Recurrente', '3,5%', true, false),
            tier('Fiel', '4%', true, true),
            tier('VIP', '5%', false, false),
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

  Widget _rewardRow(String icon, String label, String req, bool unlocked) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Opacity(
            opacity: unlocked ? 1 : 0.4,
            child: Text(icon, style: const TextStyle(fontSize: 14)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(label, style: TextStyle(color: unlocked ? PickmapColors.navy : PickmapColors.slate, fontSize: 12.5)),
          ),
          Text(req, style: const TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
        ],
      ),
    );
  }
}
