import 'package:flutter/material.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_card.dart';
import '../../../core/widgets/pm_cta_link.dart';
import '../../../core/widgets/pm_primary_button.dart';
import '../../pickpoints/presentation/pickpoints_page.dart';

/// Mirror de `invita.html`. El código de invitación real (derivado del
/// email del viajero, mismo `hashStr`/`computeReferralCode` que usa el
/// panel de negocio) se conecta cuando se porte `js/invita.js` — por
/// ahora se muestra un código de ejemplo para diseñar el layout.
class InvitaPage extends StatelessWidget {
  const InvitaPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          const Text('Invita a un amig@', style: TextStyle(color: PickmapColors.coral, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Comparte PickMap y gana Pick Points', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 6),
          RichText(
            text: const TextSpan(
              style: TextStyle(color: PickmapColors.slate, fontSize: 14),
              children: [
                TextSpan(text: 'Por cada amig@ que se una con tu código y viva su primer panorama, ambos suman '),
                TextSpan(text: '+100 Pick Points', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                TextSpan(text: '.'),
              ],
            ),
          ),
          const SizedBox(height: 18),
          PmCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Tu código de invitación', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: PickmapColors.bg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: PickmapColors.mist.withValues(alpha: 0.5)),
                  ),
                  child: const Text('CAMI-4F2K', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: PickmapColors.navy, letterSpacing: 1.5)),
                ),
                const SizedBox(height: 14),
                PmPrimaryButton(label: 'Copiar código', onPressed: () {}),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(onPressed: () {}, child: const Text('💬 WhatsApp')),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(onPressed: () {}, child: const Text('🔗 Copiar link')),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          PmCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Tus referidos', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    _StatBlock(value: '3', label: 'amig@s invitados'),
                    _StatBlock(value: '2', label: 'ya viven su primer panorama'),
                    _StatBlock(value: '300', label: 'Pick Points ganados invitando'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          PmCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Cómo funciona', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
                const SizedBox(height: 12),
                _step('📤', 'Comparte tu código', 'Envíaselo a un amigo por WhatsApp, redes o donde quieras.'),
                _step('✍️', 'Se registra con tu código', 'Tu amigo crea su cuenta en PickMap e ingresa tu código al onboarding.'),
                _step('🎁', 'Ambos ganan Pick Points', 'Apenas viva su primer panorama, ambos suman +100 Pick Points al tiro.'),
              ],
            ),
          ),
          const SizedBox(height: 14),
          PmCtaLink(
            icon: '⭐',
            title: 'Ver mis Pick Points',
            subtitle: 'Revisa tu actividad y tus premios por logros',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const Scaffold(body: PickpointsPage()))),
          ),
        ],
      ),
    );
  }

  Widget _step(String icon, String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 13.5)),
                Text(desc, style: const TextStyle(color: PickmapColors.slate, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBlock extends StatelessWidget {
  const _StatBlock({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: PickmapColors.coral)),
          const SizedBox(height: 2),
          Text(label, textAlign: TextAlign.center, style: const TextStyle(color: PickmapColors.slate, fontSize: 11)),
        ],
      ),
    );
  }
}
