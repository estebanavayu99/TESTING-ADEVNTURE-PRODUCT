import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_background.dart';
import '../../../core/widgets/pm_chip_group.dart';
import '../../../core/widgets/pm_primary_button.dart';
import '../../auth/data/auth_controller.dart';
import '../data/chile_regiones.dart';

/// Mirror de `onboarding.html`/`js/onboarding.js`, pero como wizard paso a
/// paso (`PageView`) en vez del formulario scrolleable único del sitio
/// web — una pregunta (o un par corto) por pantalla, con barra de
/// progreso y Atrás/Continuar, patrón mucho más cómodo en mobile que un
/// scroll larguísimo. La validación real sigue siendo la misma que el
/// sitio (edad, company, difficulty, budget, distance, day y city
/// obligatorios; tastes queda sin mínimo pese al hint visual).
class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _pageController = PageController();
  int _step = 0;
  static const _stepCount = 6;

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
  void initState() {
    super.initState();
    // Precargar respuestas ya guardadas — sin esto, entrar a editar
    // desde "Tus datos de viajero" (dashboard) siempre arrancaba en
    // blanco y perdía las selecciones anteriores del viajero, a
    // diferencia de `onboarding.html` (que sí precarga `user.city`, etc.
    // — ver `js/onboarding.js`). Seguro leer el perfil ya cargado acá: la
    // única otra forma de llegar a esta pantalla es vía el router, que
    // solo redirige después de que `AuthController` ya resolvió el
    // perfil real.
    final profile = context.read<AuthController>().profile;
    if (profile != null) {
      if (profile.age != null) _ageController.text = profile.age.toString();
      _company.addAll(profile.company);
      _tastes.addAll(profile.tastes);
      _difficulty.addAll(profile.difficulty);
      _budget.addAll(profile.budget);
      _distance.addAll(profile.travelDistance);
      _day.addAll(profile.preferredDay);
      // Solo si calza con una comuna real de la lista — un valor vacío,
      // null o desactualizado haría que `DropdownButtonFormField` tire
      // una excepción real por no encontrar ese `value` entre sus items.
      if (profile.city != null && todasLasComunas.contains(profile.city)) {
        _city = profile.city;
      }
    }
  }

  @override
  void dispose() {
    _ageController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  bool _validateStep(int step) {
    switch (step) {
      case 0:
        return int.tryParse(_ageController.text.trim()) != null && _company.isNotEmpty;
      case 1:
        return true; // tastes: sin mínimo real (ver nota arriba)
      case 2:
        return _difficulty.isNotEmpty;
      case 3:
        return _budget.isNotEmpty;
      case 4:
        return _distance.isNotEmpty;
      case 5:
        return _day.isNotEmpty && _city != null;
      default:
        return true;
    }
  }

  Future<void> _next() async {
    if (!_validateStep(_step)) {
      setState(() => _error = 'Completa esta sección para continuar.');
      return;
    }
    setState(() => _error = null);
    if (_step == _stepCount - 1) {
      await _submit();
      return;
    }
    _pageController.nextPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
  }

  void _back() {
    if (_step == 0) return;
    setState(() => _error = null);
    _pageController.previousPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthController>();
      final userId = auth.user!.id;
      final age = int.parse(_ageController.text.trim());
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
      _leaveOnboarding();
    } catch (e) {
      setState(() => _error = 'No pudimos guardar tu perfil: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _skip() async {
    final auth = context.read<AuthController>();
    await auth.refreshProfile();
    _leaveOnboarding();
  }

  /// Bug real: ni "Finalizar" ni "Saltar" navegaban a ningún lado — no hay
  /// una sola llamada a `context.go`/`Navigator.push` en todo el flujo de
  /// auth (el router solo redirige al salir de `/splash` o `/auth`, nunca
  /// desde `/onboarding`), así que un viajero nuevo terminaba atrapado en
  /// este mismo wizard para siempre. Esta pantalla vive en dos contextos
  /// distintos: como ruta raíz del router (signup fresco, sin nada que
  /// hacer `pop`) y empujada con `Navigator.push` desde "Tus datos de
  /// viajero" en Mi Cuenta (editar, con Dashboard debajo en el stack) —
  /// `canPop()` distingue ambos casos sin necesitar un parámetro extra.
  void _leaveOnboarding() {
    if (!mounted) return;
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final isLast = _step == _stepCount - 1;

    return Scaffold(
      body: PmBackground(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                child: Row(
                  children: [
                    if (_step > 0)
                      IconButton(
                        onPressed: _loading ? null : _back,
                        icon: const Icon(Icons.arrow_back, color: PickmapColors.navy),
                      )
                    else
                      const SizedBox(width: 48),
                    Expanded(
                      child: Row(
                        children: List.generate(_stepCount, (i) {
                          final active = i <= _step;
                          return Expanded(
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 260),
                              curve: Curves.easeOut,
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              height: 5,
                              decoration: BoxDecoration(
                                color: active ? PickmapColors.coral : PickmapColors.mist.withValues(alpha: 0.4),
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                    TextButton(
                      onPressed: _loading ? null : _skip,
                      child: const Text('Saltar', style: TextStyle(color: PickmapColors.slate)),
                    ),
                  ],
                ),
              ),
              if (_step == 0) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Antes de empezar', style: TextStyle(color: PickmapColors.coral, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('¡Bienvenida! Cuéntanos un poco de ti', style: textTheme.headlineSmall),
                      const SizedBox(height: 6),
                      Container(
                        margin: const EdgeInsets.only(top: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: PickmapColors.sun.withValues(alpha: 0.16),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          '🤖 Este es el punto de partida de Darwin, nuestra IA, para empezar a conocerte.',
                          style: TextStyle(color: PickmapColors.navy, fontSize: 12.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (i) => setState(() => _step = i),
                  children: [
                    _stepScaffold(_ageAndCompanyStep()),
                    _stepScaffold(_tastesStep()),
                    _stepScaffold(_singleChoiceStep(
                      title: '¿Qué nivel de exigencia física prefieres?',
                      hint: 'Así evitamos ofrecerte un trekking extremo si buscas algo tranquilo, o algo muy suave si buscas adrenalina.',
                      options: _difficultyOptions,
                      selected: _difficulty,
                    )),
                    _stepScaffold(_singleChoiceStep(
                      title: '¿Cuánto sueles gastar en un panorama?',
                      hint: 'Para no mostrarte opciones muy por fuera de tu rango habitual.',
                      options: _budgetOptions,
                      selected: _budget,
                    )),
                    _stepScaffold(_singleChoiceStep(
                      title: '¿Qué tan lejos estás dispuesto/a a moverte?',
                      hint: 'Priorizamos panoramas a la distancia con la que te sientes cómodo/a.',
                      options: _distanceOptions,
                      selected: _distance,
                    )),
                    _stepScaffold(_dayAndCityStep()),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
                child: Column(
                  children: [
                    if (_error != null) ...[
                      Text(_error!, style: const TextStyle(color: PickmapColors.deepRed, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 10),
                    ],
                    PmPrimaryButton(label: isLast ? 'Finalizar' : 'Continuar', loading: _loading, onPressed: _next),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _stepScaffold(Widget child) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
      child: child,
    );
  }

  Widget _questionHeader(String title, String hint) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: PickmapColors.navy)),
          const SizedBox(height: 6),
          Text(hint, style: const TextStyle(color: PickmapColors.slate, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _singleChoiceStep({
    required String title,
    required String hint,
    required List<PmChipOption> options,
    required Set<String> selected,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _questionHeader(title, hint),
        PmChipGroup(options: options, selected: selected, onToggle: (v) => setState(() => _toggle(selected, v))),
      ],
    );
  }

  Widget _ageAndCompanyStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _questionHeader('¿Qué edad tienes?', 'Darwin ajusta el ritmo y el tipo de actividad según tu etapa de vida.'),
        TextField(
          controller: _ageController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(hintText: 'Ej: 28'),
        ),
        const SizedBox(height: 28),
        _questionHeader('¿Con quién sueles ir a tus panoramas?',
            'Puedes elegir más de una — Darwin arma combos pensados para ese tipo de compañía.'),
        PmChipGroup(options: _companyOptions, selected: _company, onToggle: (v) => setState(() => _toggle(_company, v))),
      ],
    );
  }

  Widget _tastesStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _questionHeader('¿Qué tipo de panoramas te gustan más?', 'Elige al menos 5 — esta es la base de todas tus recomendaciones.'),
        PmChipGroup(options: _tastesOptions, selected: _tastes, onToggle: (v) => setState(() => _toggle(_tastes, v))),
      ],
    );
  }

  Widget _dayAndCityStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _questionHeader('¿Cuándo prefieres salir?', 'Para sugerirte planes que calcen con tu semana.'),
        PmChipGroup(options: _dayOptions, selected: _day, onToggle: (v) => setState(() => _toggle(_day, v))),
        const SizedBox(height: 28),
        _questionHeader('¿Desde dónde te mueves?', 'Nos ayuda a calcular distancias y tiempos de traslado más reales.'),
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
      ],
    );
  }

  void _toggle(Set<String> set, String value) {
    if (!set.add(value)) set.remove(value);
  }
}
