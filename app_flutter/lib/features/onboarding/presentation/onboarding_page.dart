import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_background.dart';
import '../../../core/widgets/pm_chip_group.dart';
import '../../../core/widgets/pm_primary_button.dart';
import '../../auth/data/auth_controller.dart';
import '../data/chile_regiones.dart';

/// Mirror de `onboarding.html`/`js/onboarding.js`: un solo formulario
/// scrolleable (no wizard por pasos), escribe en `profiles` +
/// `darwin_preferences` al confirmar. La validación real del sitio no
/// exige mínimo de gustos pese al hint visual ("elige al menos 5") — se
/// respeta ese comportamiento real acá también.
class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _ageController = TextEditingController();
  final Set<String> _company = {};
  final Set<String> _tastes = {};
  final Set<String> _difficulty = {};
  final Set<String> _budget = {};
  final Set<String> _distance = {};
  final Set<String> _day = {};
  String? _city;

  bool _loading = false;
  String? _error;

  static const _companyOptions = [
    PmChipOption('pareja', '💑 Pareja'),
    PmChipOption('familia', '👨‍👩‍👧 Familia'),
    PmChipOption('amigos', '🎉 Amigos'),
    PmChipOption('solo', '🧍 Solo/a'),
    PmChipOption('trabajo', '🏢 Compañeros de trabajo'),
  ];

  static const _tastesOptions = [
    PmChipOption('naturaleza', '🌲 Naturaleza y aventura'),
    PmChipOption('gastronomia', '🍽️ Gastronomía'),
    PmChipOption('relax', '🧖 Relax y spa'),
    PmChipOption('vidanocturna', '🌃 Vida nocturna'),
    PmChipOption('cultura', '🎭 Cultura y tours'),
    PmChipOption('extremo', '🪂 Deportes extremos'),
    PmChipOption('playa', '🏖️ Playa'),
    PmChipOption('nieve', '❄️ Nieve'),
    PmChipOption('shopping', '🛍️ Shopping'),
    PmChipOption('fotografia', '📸 Panoramas instagrameables'),
    PmChipOption('musica', '🎶 Música y festivales'),
    PmChipOption('ymas', '✨ Y más'),
  ];

  static const _difficultyOptions = [
    PmChipOption('suave', '🟢 Suave'),
    PmChipOption('moderado', '🟡 Moderado'),
    PmChipOption('extremo', '🔴 Extremo'),
  ];

  static const _budgetOptions = [
    PmChipOption('bajo', '💰 Económico'),
    PmChipOption('medio', '💰💰 Rango medio'),
    PmChipOption('alto', '💰💰💰 Sin mucho límite'),
  ];

  static const _distanceOptions = [
    PmChipOption('cerca', '📍 Cerca (menos de 20 km)'),
    PmChipOption('media', '🚗 Media distancia'),
    PmChipOption('lejos', '🧭 Me da lo mismo viajar lejos'),
  ];

  static const _dayOptions = [
    PmChipOption('semana', '📅 Entre semana'),
    PmChipOption('finde', '🎉 Fines de semana y feriados'),
    PmChipOption('cualquiera', '🤷 Cualquier día'),
  ];

  @override
  void dispose() {
    _ageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final age = int.tryParse(_ageController.text.trim());
    if (age == null ||
        _company.isEmpty ||
        _difficulty.isEmpty ||
        _budget.isEmpty ||
        _distance.isEmpty ||
        _day.isEmpty ||
        _city == null) {
      setState(() => _error = 'Completa todos los campos para continuar.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthController>();
      final userId = auth.user!.id;
      await auth.repo.upsertProfile(userId, {
        'age': age,
        'city': _city,
        'company': _company.toList(),
        'tastes': _tastes.toList(),
        'difficulty': _difficulty.toList(),
        'budget': _budget.toList(),
        'travel_distance': _distance.toList(),
        'preferred_day': _day.toList(),
        'onboarded': true,
      });
      await auth.repo.upsertDarwinPreferences(userId, {
        'grupo': {'tipo': _company.isNotEmpty ? _company.first : null},
        'presupuesto': {'banda': _budget.isNotEmpty ? _budget.first : null},
      });
      await auth.refreshProfile();
    } catch (e) {
      setState(() => _error = 'No pudimos guardar tu perfil: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _skip() async {
    // "Prefiero hacerlo después" — el sitio deja `onboarded` en false y
    // avanza igual al dashboard; acá se replica sin escribir nada.
    final auth = context.read<AuthController>();
    await auth.refreshProfile();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      body: PmBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: const [
                      BoxShadow(color: Color.fromRGBO(30, 45, 49, 0.14), blurRadius: 34, offset: Offset(0, 16)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Antes de empezar',
                          style: TextStyle(color: PickmapColors.coral, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      Text('¡Bienvenida! Cuéntanos un poco de ti', style: textTheme.headlineSmall),
                      const SizedBox(height: 8),
                      const Text(
                        'Con esto armamos panoramas pensados de verdad para ti — mientras más nos cuentes, más precisas son las recomendaciones.',
                        style: TextStyle(color: PickmapColors.slate),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: PickmapColors.sun.withValues(alpha: 0.16),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          '🤖 Este es el punto de partida de Darwin, nuestra IA, para empezar a conocerte. A partir de aquí sigue aprendiendo con cada reserva, reseña y panorama que exploras.',
                          style: TextStyle(color: PickmapColors.navy),
                        ),
                      ),
                      const SizedBox(height: 24),
                      _fieldLabel('¿Qué edad tienes?', 'Darwin ajusta el ritmo y el tipo de actividad según tu etapa de vida.'),
                      TextField(
                        controller: _ageController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(hintText: 'Ej: 28'),
                      ),
                      const SizedBox(height: 22),
                      _fieldLabel('¿Con quién sueles ir a tus panoramas?',
                          'Puedes elegir más de una — Darwin arma combos pensados para ese tipo de compañía.'),
                      PmChipGroup(options: _companyOptions, selected: _company, onToggle: (v) => setState(() => _toggle(_company, v))),
                      const SizedBox(height: 22),
                      _fieldLabel('¿Qué tipo de panoramas te gustan más?', 'Elige al menos 5 — esta es la base de todas tus recomendaciones.'),
                      PmChipGroup(options: _tastesOptions, selected: _tastes, onToggle: (v) => setState(() => _toggle(_tastes, v))),
                      const SizedBox(height: 22),
                      _fieldLabel('¿Qué nivel de exigencia física prefieres?',
                          'Así evitamos ofrecerte un trekking extremo si buscas algo tranquilo, o algo muy suave si buscas adrenalina.'),
                      PmChipGroup(options: _difficultyOptions, selected: _difficulty, onToggle: (v) => setState(() => _toggle(_difficulty, v))),
                      const SizedBox(height: 22),
                      _fieldLabel('¿Cuánto sueles gastar en un panorama?', 'Para no mostrarte opciones muy por fuera de tu rango habitual.'),
                      PmChipGroup(options: _budgetOptions, selected: _budget, onToggle: (v) => setState(() => _toggle(_budget, v))),
                      const SizedBox(height: 22),
                      _fieldLabel('¿Qué tan lejos estás dispuesto/a a moverte?', 'Priorizamos panoramas a la distancia con la que te sientes cómodo/a.'),
                      PmChipGroup(options: _distanceOptions, selected: _distance, onToggle: (v) => setState(() => _toggle(_distance, v))),
                      const SizedBox(height: 22),
                      _fieldLabel('¿Cuándo prefieres salir?', 'Para sugerirte planes que calcen con tu semana.'),
                      PmChipGroup(options: _dayOptions, selected: _day, onToggle: (v) => setState(() => _toggle(_day, v))),
                      const SizedBox(height: 22),
                      _fieldLabel('¿Desde dónde te mueves?', 'Nos ayuda a calcular distancias y tiempos de traslado más reales.'),
                      DropdownButtonFormField<String>(
                        initialValue: _city,
                        isExpanded: true,
                        decoration: const InputDecoration(hintText: 'Selecciona tu comuna'),
                        items: [
                          for (final r in chileRegiones) ...[
                            DropdownMenuItem<String>(
                              enabled: false,
                              value: '__region_${r.region}',
                              child: Text(r.region, style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.slate)),
                            ),
                            for (final c in r.comunas) DropdownMenuItem<String>(value: c, child: Text('  $c')),
                          ],
                        ],
                        onChanged: (v) {
                          if (v != null && !v.startsWith('__region_')) setState(() => _city = v);
                        },
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Text(_error!, style: const TextStyle(color: PickmapColors.deepRed, fontWeight: FontWeight.w600)),
                      ],
                      const SizedBox(height: 24),
                      PmPrimaryButton(label: 'Continuar', loading: _loading, onPressed: _submit),
                      const SizedBox(height: 10),
                      Center(
                        child: TextButton(
                          onPressed: _loading ? null : _skip,
                          child: const Text('Prefiero hacerlo después'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _toggle(Set<String> set, String value) {
    if (!set.add(value)) set.remove(value);
  }

  Widget _fieldLabel(String label, String hint) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
            const SizedBox(height: 3),
            Text(hint, style: const TextStyle(color: PickmapColors.slate, fontSize: 12.5)),
            const SizedBox(height: 8),
          ],
        ),
      );
}
