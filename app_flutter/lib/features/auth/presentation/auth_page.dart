import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/utils/rut.dart';
import '../../../core/widgets/pm_logo.dart';
import '../../../core/widgets/pm_primary_button.dart';
import '../data/auth_controller.dart';

/// Mirror de `login.html`/`js/auth.js`: una sola tarjeta con varias
/// "vistas" internas (login/signup/verificación pendiente/recuperar
/// contraseña), en vez de rutas separadas — mismo patrón del sitio, que
/// muestra/oculta `<form>`s dentro de la misma `.auth-card`.
enum _AuthView { login, signup, verifyPending, forgotRequest, forgotReset }

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  _AuthView _view = _AuthView.login;
  bool _loading = false;
  String? _error;
  String? _success;
  String _pendingVerifyEmail = '';

  final _loginEmail = TextEditingController();
  final _loginPassword = TextEditingController();

  final _signupFirstName = TextEditingController();
  final _signupLastName = TextEditingController();
  final _signupRut = TextEditingController();
  final _signupEmail = TextEditingController();
  final _signupPassword = TextEditingController();

  final _forgotEmail = TextEditingController();
  final _newPassword = TextEditingController();

  /// Contraseñas actualmente reveladas (ojo abierto) — hay varios campos
  /// de contraseña en pantallas distintas, cada uno se rastrea por su
  /// propia clave.
  final Set<String> _visiblePasswords = {};

  late final StreamSubscription<AuthState> _recoverySub;

  @override
  void initState() {
    super.initState();
    // Caso "app ya estaba abierta en esta pantalla": el link de recuperar
    // contraseña dispara el evento mientras seguimos con vida, este
    // listener lo agarra en caliente.
    _recoverySub = Supabase.instance.client.auth.onAuthStateChange.listen((state) {
      if (state.event == AuthChangeEvent.passwordRecovery && mounted) {
        setState(() => _view = _AuthView.forgotReset);
      }
    });
    // Caso "arranque en frío desde el link": el evento ya se disparó y se
    // perdió antes de que este widget existiera — `AuthController` lo
    // dejó marcado (ver `passwordRecovery` ahí) y el router ya nos trajo
    // acá a propósito por eso. Lo consumimos una sola vez al montar.
    if (context.read<AuthController>().consumePasswordRecovery()) {
      _view = _AuthView.forgotReset;
    }
  }

  @override
  void dispose() {
    _recoverySub.cancel();
    _loginEmail.dispose();
    _loginPassword.dispose();
    _signupFirstName.dispose();
    _signupLastName.dispose();
    _signupRut.dispose();
    _signupEmail.dispose();
    _signupPassword.dispose();
    _forgotEmail.dispose();
    _newPassword.dispose();
    super.dispose();
  }

  AuthController get _auth => context.read<AuthController>();

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });
    try {
      await action();
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Algo salió mal: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitLogin() => _run(() async {
        await _auth.repo.signIn(
          email: _loginEmail.text.trim(),
          password: _loginPassword.text,
        );
        // AuthController escucha el cambio de sesión y el router redirige
        // solo a onboarding/home cuando el perfil termine de cargar.
      });

  Future<void> _submitSignup() {
    // Mismo chequeo que `js/auth.js` antes de crear la cuenta — sin esto,
    // cualquier texto en el campo RUT pasaba directo a Supabase sin
    // validar el dígito verificador.
    final rut = formatRut(_signupRut.text);
    if (!isValidRut(rut)) {
      setState(() => _error = 'El RUT ingresado no es válido. Revísalo e intenta de nuevo.');
      return Future.value();
    }
    return _run(() async {
      await _auth.repo.signUp(
        email: _signupEmail.text.trim(),
        password: _signupPassword.text,
        firstName: _signupFirstName.text.trim(),
        lastName: _signupLastName.text.trim(),
        rut: rut,
      );
      setState(() {
        _pendingVerifyEmail = _signupEmail.text.trim();
        _view = _AuthView.verifyPending;
      });
    });
  }

  Future<void> _resend() => _run(() async {
        await _auth.repo.resendSignupEmail(_pendingVerifyEmail);
        setState(() => _success = 'Te reenviamos el correo de confirmación.');
      });

  Future<void> _submitForgotRequest() => _run(() async {
        await _auth.repo.resetPasswordForEmail(_forgotEmail.text.trim());
        setState(() => _success = 'Si el correo existe, te enviamos un enlace real para restablecer tu contraseña.');
      });

  Future<void> _submitForgotReset() => _run(() async {
        await _auth.repo.updatePassword(_newPassword.text);
        setState(() {
          _success = 'Contraseña actualizada. Ya puedes iniciar sesión.';
          _view = _AuthView.login;
        });
      });

  @override
  Widget build(BuildContext context) {
    // Layout tipo "hero + bottom sheet" (Duolingo/Airbnb-style) en vez de
    // una tarjeta blanca flotando sobre el degradado — el hero superior
    // lleva la marca/tagline, el sheet blanco con esquinas redondeadas
    // ocupa el resto y contiene el form activo.
    return Scaffold(
      backgroundColor: PickmapColors.sun,
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFFFFF3DA), PickmapColors.sun],
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const PmLogo(size: 42, textSize: 27),
                        const SizedBox(height: 12),
                        const Text(
                          'Tu próximo panorama, sin buscar tanto',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: PickmapColors.navy, fontWeight: FontWeight.w600, fontSize: 14.5),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            flex: 7,
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SafeArea(
                top: false,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    // Fade + leve deslizamiento al cambiar de vista
                    // (login/signup/verificación/recuperar) — antes el
                    // formulario cambiaba de golpe con cada tap en los
                    // tabs o en los links de "olvidé mi contraseña"/
                    // "crea tu cuenta".
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 260),
                      switchInCurve: Curves.easeOut,
                      switchOutCurve: Curves.easeIn,
                      transitionBuilder: (child, animation) => FadeTransition(
                        opacity: animation,
                        child: SlideTransition(
                          position: Tween(begin: const Offset(0, 0.03), end: Offset.zero).animate(animation),
                          child: child,
                        ),
                      ),
                      child: _buildCardContent(context),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardContent(BuildContext context) {
    late final Widget child;
    switch (_view) {
      case _AuthView.login:
        child = _loginForm();
      case _AuthView.signup:
        child = _signupForm();
      case _AuthView.verifyPending:
        child = _verifyPendingView();
      case _AuthView.forgotRequest:
        child = _forgotRequestForm();
      case _AuthView.forgotReset:
        child = _forgotResetForm();
    }
    // `AnimatedSwitcher` (más arriba) solo dispara la transición si el
    // `child` cambia de key — sin esto, todas las vistas devuelven un
    // `Column` como raíz y Flutter las trataría como "el mismo widget"
    // actualizado en el lugar, sin ninguna animación.
    return KeyedSubtree(key: ValueKey(_view), child: child);
  }

  Widget _kicker(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: const TextStyle(color: PickmapColors.slate, fontWeight: FontWeight.w600),
        ),
      );

  Widget _banner() {
    Widget child = const SizedBox.shrink();
    if (_error != null) {
      child = _bannerBox(_error!, PickmapColors.deepRed);
    } else if (_success != null) {
      child = _bannerBox(_success!, PickmapColors.green);
    }
    // Entra/sale con fade + alto animado en vez de aparecer de golpe y
    // empujar el resto del formulario de un salto.
    return AnimatedSize(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOut,
      alignment: Alignment.topCenter,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        child: KeyedSubtree(key: ValueKey(_error ?? _success ?? ''), child: child),
      ),
    );
  }

  Widget _bannerBox(String text, Color color) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(text, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
      );

  Widget _tabs() {
    final isSignup = _view == _AuthView.signup;
    // Texto como `Text(style: TextStyle(...))` plano a propósito, NO
    // `AnimatedDefaultTextStyle`/`DefaultTextStyle`: esos widgets fijan un
    // nuevo estilo ambiente que REEMPLAZA por completo (no combina campo
    // a campo) el de arriba, perdiendo `fontFamily` — mismo bug real ya
    // encontrado y documentado en `ElevatedButtonThemeData` (ver
    // CLAUDE.md). Un `Text` normal sí hereda/combina solo porque su
    // `TextStyle` trae `inherit: true` por defecto.
    Widget tab(String label, bool active, VoidCallback onTap) => Expanded(
          child: GestureDetector(
            onTap: () {
              if (!active) HapticFeedback.selectionClick();
              onTap();
            },
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: active ? PickmapColors.coral : PickmapColors.slate,
                ),
              ),
            ),
          ),
        );
    // Píldora deslizante (AnimatedAlign) detrás de los labels, en vez de
    // recolorear el fondo de cada tab por separado — transición más
    // suave, patrón de segmented control nativo (iOS/Material 3).
    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: PickmapColors.bg, borderRadius: BorderRadius.circular(12)),
      child: Stack(
        children: [
          AnimatedAlign(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            alignment: isSignup ? Alignment.centerRight : Alignment.centerLeft,
            child: FractionallySizedBox(
              widthFactor: 0.5,
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                height: 38,
                decoration: BoxDecoration(
                  color: PickmapColors.coral.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
          Row(
            children: [
              tab('Iniciar sesión', !isSignup, () => setState(() {
                    _view = _AuthView.login;
                    _error = null;
                    _success = null;
                  })),
              tab('Crear cuenta', isSignup, () => setState(() {
                    _view = _AuthView.signup;
                    _error = null;
                    _success = null;
                  })),
            ],
          ),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController controller,
      {bool obscure = false, TextInputType? keyboardType, String? hint, String? passwordKey}) {
    final revealed = passwordKey != null && _visiblePasswords.contains(passwordKey);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: controller,
        obscureText: obscure && !revealed,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          suffixIcon: obscure
              ? IconButton(
                  icon: Icon(revealed ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: PickmapColors.slate, size: 20),
                  onPressed: () => setState(() {
                    if (revealed) {
                      _visiblePasswords.remove(passwordKey);
                    } else {
                      _visiblePasswords.add(passwordKey!);
                    }
                  }),
                )
              : null,
        ),
      ),
    );
  }

  Widget _switchLink(String prefix, String linkLabel, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Wrap(
        alignment: WrapAlignment.center,
        children: [
          if (prefix.isNotEmpty) Text('$prefix ', style: const TextStyle(color: PickmapColors.slate)),
          GestureDetector(
            onTap: onTap,
            child: Text(linkLabel,
                style: const TextStyle(color: PickmapColors.coral, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _loginForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _kicker('🧭 Iniciando sesión como viajero'),
        _tabs(),
        _banner(),
        _field('Correo', _loginEmail, keyboardType: TextInputType.emailAddress, hint: 'tu@correo.com'),
        _field('Contraseña', _loginPassword, obscure: true, hint: '••••••••', passwordKey: 'login'),
        const SizedBox(height: 4),
        PmPrimaryButton(label: 'Entrar', loading: _loading, onPressed: _submitLogin),
        _switchLink('', '¿Olvidaste tu contraseña?', () => setState(() {
              _view = _AuthView.forgotRequest;
              _error = null;
              _success = null;
            })),
        _switchLink('¿Primera vez por acá?', 'Crea tu cuenta', () => setState(() {
              _view = _AuthView.signup;
              _error = null;
              _success = null;
            })),
      ],
    );
  }

  Widget _signupForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _kicker('🧭 Creando cuenta de viajero'),
        _tabs(),
        _banner(),
        _field('Nombre', _signupFirstName, hint: 'Cami'),
        _field('Apellido', _signupLastName, hint: 'Reyes'),
        _field('RUT', _signupRut, hint: '12.345.678-9'),
        _field('Correo', _signupEmail, keyboardType: TextInputType.emailAddress, hint: 'tu@correo.com'),
        _field('Contraseña', _signupPassword, obscure: true, hint: 'Mínimo 8 caracteres', passwordKey: 'signup'),
        const SizedBox(height: 4),
        PmPrimaryButton(label: 'Crear cuenta', loading: _loading, onPressed: _submitSignup),
        _switchLink('¿Ya tienes cuenta?', 'Inicia sesión', () => setState(() {
              _view = _AuthView.login;
              _error = null;
              _success = null;
            })),
      ],
    );
  }

  Widget _verifyPendingView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('📬', style: TextStyle(fontSize: 40)),
        const SizedBox(height: 12),
        const Text('Te enviamos un correo de confirmación a', textAlign: TextAlign.center),
        const SizedBox(height: 4),
        Text(_pendingVerifyEmail,
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
        const SizedBox(height: 12),
        const Text(
          'Abre el enlace desde tu bandeja de entrada para activar tu cuenta — la app te dejará entrar automáticamente.',
          textAlign: TextAlign.center,
          style: TextStyle(color: PickmapColors.slate),
        ),
        const SizedBox(height: 8),
        _banner(),
        _switchLink('¿No llegó?', 'Reenviar correo', _resend),
        _switchLink('', '← Volver a iniciar sesión', () => setState(() {
              _view = _AuthView.login;
              _error = null;
              _success = null;
            })),
      ],
    );
  }

  Widget _forgotRequestForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _kicker('Recuperar contraseña'),
        _banner(),
        const Text('Ingresa tu correo y te enviamos un enlace real para restablecer tu contraseña.',
            textAlign: TextAlign.center, style: TextStyle(color: PickmapColors.slate)),
        const SizedBox(height: 14),
        _field('Correo', _forgotEmail, keyboardType: TextInputType.emailAddress, hint: 'tu@correo.com'),
        PmPrimaryButton(label: 'Enviar enlace', loading: _loading, onPressed: _submitForgotRequest),
        _switchLink('', '← Volver', () => setState(() {
              _view = _AuthView.login;
              _error = null;
              _success = null;
            })),
      ],
    );
  }

  Widget _forgotResetForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _kicker('Escribe tu nueva contraseña'),
        _banner(),
        _field('Nueva contraseña', _newPassword, obscure: true, hint: 'Mínimo 8 caracteres', passwordKey: 'reset'),
        PmPrimaryButton(label: 'Cambiar contraseña', loading: _loading, onPressed: _submitForgotReset),
      ],
    );
  }
}
