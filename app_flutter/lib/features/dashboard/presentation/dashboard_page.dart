import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/utils/rut.dart';
import '../../../core/widgets/pm_card.dart';
import '../../../core/widgets/pm_fade_in.dart';
import '../../../core/widgets/pm_icon_circle.dart';
import '../../../core/widgets/pm_primary_button.dart';
import '../../auth/data/auth_controller.dart';
import '../../auth/data/traveler_profile.dart';
import '../../pickpoints/presentation/pickpoints_page.dart';
import '../../onboarding/presentation/onboarding_page.dart';

/// Mirror de `dashboard.html` ("Mi cuenta"): solo administración de
/// cuenta (Pick Points/datos de viajero como teasers, Configura tu
/// cuenta, Métodos de pago) — sin oferta de Darwin acá, instrucción
/// explícita del usuario documentada en CLAUDE.md.
class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _rut = TextEditingController();
  final _phone = TextEditingController();
  bool _saving = false;
  String? _feedback;
  bool _hydrated = false;

  void _hydrate(AuthController auth) {
    if (_hydrated) return;
    // Ojo: no marcar `_hydrated` hasta que el perfil realmente haya
    // llegado — si el primer build ocurre antes de que termine el fetch
    // async a Supabase, `auth.profile` todavía es null; marcar
    // `_hydrated` en ese momento dejaba los campos vacíos para siempre,
    // porque el rebuild posterior (cuando el perfil sí llega) quedaba
    // bloqueado por este mismo guard (bug real).
    if (auth.profile == null) return;
    _hydrated = true;
    _firstName.text = auth.profile?.firstName ?? '';
    _lastName.text = auth.profile?.lastName ?? '';
    _rut.text = auth.profile?.rut ?? '';
    _phone.text = auth.profile?.phone ?? '';
  }

  Future<void> _save(AuthController auth) async {
    // Mismos chequeos que `js/dashboard.js` en "Configura tu cuenta" —
    // sin esto, nombre/apellido vacíos o un RUT inválido se guardaban
    // igual sin avisar.
    if (_firstName.text.trim().isEmpty || _lastName.text.trim().isEmpty) {
      setState(() => _feedback = 'El nombre y el apellido no pueden estar vacíos.');
      return;
    }
    final rut = formatRut(_rut.text);
    if (!isValidRut(rut)) {
      setState(() => _feedback = 'El RUT ingresado no es válido. Revísalo e intenta de nuevo.');
      return;
    }
    setState(() {
      _saving = true;
      _feedback = null;
    });
    try {
      await auth.repo.upsertProfile(auth.user!.id, {
        'first_name': _firstName.text.trim(),
        'last_name': _lastName.text.trim(),
        'rut': rut,
        'phone': _phone.text.trim(),
      });
      await auth.refreshProfile();
      setState(() => _feedback = 'Listo — tus datos se actualizaron.');
    } catch (e) {
      setState(() => _feedback = 'No pudimos guardar: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _rut.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    _hydrate(auth);
    final email = auth.user?.email ?? '';

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          Row(
            children: [
              _Avatar(profile: auth.profile),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tu cuenta', style: TextStyle(color: PickmapColors.coral, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text('Hola ${auth.profile?.greetingFirstName ?? ''} 👋', style: Theme.of(context).textTheme.headlineSmall),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Esto es lo que PickMap armó para ti esta semana.', style: TextStyle(color: PickmapColors.slate)),
          const SizedBox(height: 18),
          PmFadeIn(
            child: Row(
              children: [
                Expanded(
                  child: PmCard(
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PickpointsPage())),
                    padding: const EdgeInsets.all(14),
                    child: _Teaser(
                      icon: '⭐',
                      title: '1.240 Pick Points',
                      subtitle: 'Nivel Fiel · hasta 4% cashback',
                      iconBackground: PickmapColors.sun.withValues(alpha: 0.22),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          PmFadeIn(
            delay: const Duration(milliseconds: 60),
            child: PmCard(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const OnboardingPage())),
              padding: const EdgeInsets.all(14),
              child: _Teaser(
                icon: '🧭',
                title: 'Tus datos de viajero',
                subtitle: 'Tu edad, con quién viajas y tus gustos',
                iconBackground: PickmapColors.green.withValues(alpha: 0.18),
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Tu cuenta', style: TextStyle(color: PickmapColors.coral, fontWeight: FontWeight.w700, fontSize: 13)),
          const SizedBox(height: 10),
          PmFadeIn(
            delay: const Duration(milliseconds: 120),
            child: PmCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Configura tu cuenta', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: PickmapColors.navy)),
                  const SizedBox(height: 14),
                  _labeledField('Nombre', _firstName),
                  _labeledField('Apellido', _lastName),
                  _labeledField('RUT', _rut, hint: '12.345.678-9'),
                  _readOnlyField('Correo electrónico', email),
                  _labeledField('Teléfono', _phone, hint: '+56 9 1234 5678'),
                  const SizedBox(height: 4),
                  PmPrimaryButton(label: 'Solicitar cambio de datos', loading: _saving, onPressed: () => _save(auth)),
                  if (_feedback != null) ...[
                    const SizedBox(height: 8),
                    Text(_feedback!, style: const TextStyle(color: PickmapColors.slate)),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          PmFadeIn(
            delay: const Duration(milliseconds: 180),
            child: PmCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Métodos de pago', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: PickmapColors.navy)),
                      TextButton(onPressed: () {}, child: const Text('+ Agregar')),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _payCard(_visaLogo(), '•••• •••• •••• 4231', 'Vence 08/28', tag: 'Principal'),
                  const SizedBox(height: 10),
                  _payCard(_mastercardLogo(), '•••• •••• •••• 8890', 'Vence 03/27'),
                  const SizedBox(height: 10),
                  const Text('🔒 Tus datos de pago están cifrados y protegidos.', style: TextStyle(color: PickmapColors.slate, fontSize: 12)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: TextButton(
              onPressed: () => auth.signOut(),
              child: const Text('Cerrar sesión', style: TextStyle(color: PickmapColors.deepRed)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _labeledField(String label, TextEditingController controller, {String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(labelText: label, hintText: hint),
      ),
    );
  }

  Widget _readOnlyField(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(color: PickmapColors.bg, borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: PickmapColors.slate, fontSize: 11)),
            Text(value, style: const TextStyle(color: PickmapColors.navy, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _visaLogo() {
    return Container(
      width: 48,
      height: 32,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: PickmapColors.navy, borderRadius: BorderRadius.circular(6)),
      child: const Text('VISA',
          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, letterSpacing: 0.5)),
    );
  }

  /// Dos círculos superpuestos (rojo/ámbar) — mismo tratamiento visual de
  /// `.pay__logo--mc` en el sitio, en vez de un simple texto "MC".
  Widget _mastercardLogo() {
    return SizedBox(
      width: 48,
      height: 32,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            left: 4,
            child: Container(width: 20, height: 20, decoration: const BoxDecoration(color: PickmapColors.deepRed, shape: BoxShape.circle)),
          ),
          Positioned(
            right: 4,
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(color: PickmapColors.sun.withValues(alpha: 0.92), shape: BoxShape.circle),
            ),
          ),
        ],
      ),
    );
  }

  Widget _payCard(Widget logo, String number, String sub, {String? tag}) {
    return Row(
      children: [
        logo,
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(number, style: const TextStyle(color: PickmapColors.navy, fontWeight: FontWeight.w600)),
              Text(sub, style: const TextStyle(color: PickmapColors.slate, fontSize: 12)),
            ],
          ),
        ),
        if (tag != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: PickmapColors.green.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(999)),
            child: Text(tag, style: const TextStyle(color: PickmapColors.green, fontSize: 11, fontWeight: FontWeight.w700)),
          ),
      ],
    );
  }
}

class _Teaser extends StatelessWidget {
  const _Teaser({required this.icon, required this.title, required this.subtitle, this.iconBackground});
  final String icon;
  final String title;
  final String subtitle;
  final Color? iconBackground;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        PmIconCircle(icon: icon, size: 42, background: iconBackground),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 13.5)),
              Text(subtitle, style: const TextStyle(color: PickmapColors.slate, fontSize: 11.5)),
            ],
          ),
        ),
        const Icon(Icons.chevron_right, color: PickmapColors.slate),
      ],
    );
  }
}

/// Avatar circular con iniciales — mismo patrón ya usado en el panel de
/// negocio del sitio web (avatar coral con iniciales) aplicado acá al
/// saludo del viajero.
class _Avatar extends StatelessWidget {
  const _Avatar({required this.profile});
  final TravelerProfile? profile;

  @override
  Widget build(BuildContext context) {
    final first = profile?.firstName?.trim();
    final last = profile?.lastName?.trim();
    final initials = [
      if (first != null && first.isNotEmpty) first[0],
      if (last != null && last.isNotEmpty) last[0],
    ].join().toUpperCase();
    return Container(
      width: 52,
      height: 52,
      alignment: Alignment.center,
      decoration: const BoxDecoration(color: PickmapColors.coral, shape: BoxShape.circle),
      child: Text(
        initials.isEmpty ? '🙂' : initials,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
      ),
    );
  }
}
