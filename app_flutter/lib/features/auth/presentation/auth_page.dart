import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_background.dart';
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

  late final StreamSubscription<AuthState> _recoverySub;

  @override
  void initState() {
    super.initState();
    // Si el link de "recuperar contraseña" abre la app, Supabase dispara
    // este evento — saltamos directo al formulario de nueva contraseña,
    // igual que `onAuthStateChange` hace en js/auth.js.
    _recoverySub = Supabase.instance.client.auth.onAuthStateChange.listen((state) {
      if (state.event == AuthChangeEvent.passwordRecovery && mounted) {
        setState(() => _view = _AuthView.forgotReset);
      }
    });
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

  Future<void> _submitSignup() => _run(() async {
        await _auth.repo.signUp(
          email: _signupEmail.text.trim(),
          password: _signupPassword.text,
          firstName: _signupFirstName.text.trim(),
          lastName: _signupLastName.text.trim(),
          rut: _signupRut.text.trim(),
        );
        setState(() {
          _pendingVerifyEmail = _signupEmail.text.trim();
          _view = _AuthView.verifyPending;
        });
      });

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
    return Scaffold(
      body: PmBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const PmLogo(size: 36, textSize: 24),
                    const SizedBox(height: 28),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: const [
                          BoxShadow(color: Color.fromRGBO(30, 45, 49, 0.14), blurRadius: 34, offset: Offset(0, 16)),
                        ],
                      ),
                      child: _buildCardContent(context),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCardContent(BuildContext context) {
    switch (_view) {
      case _AuthView.login:
        return _loginForm();
      case _AuthView.signup:
        return _signupForm();
      case _AuthView.verifyPending:
        return _verifyPendingView();
      case _AuthView.forgotRequest:
        return _forgotRequestForm();
      case _AuthView.forgotReset:
        return _forgotResetForm();
    }
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
    if (_error != null) {
      return _bannerBox(_error!, PickmapColors.deepRed);
    }
    if (_success != null) {
      return _bannerBox(_success!, PickmapColors.green);
    }
    return const SizedBox.shrink();
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
    Widget tab(String label, bool active, VoidCallback onTap) => Expanded(
          child: GestureDetector(
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: active ? PickmapColors.coral.withValues(alpha: 0.12) : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
              ),
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
    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: PickmapColors.bg, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          tab('Iniciar sesión', _view == _AuthView.login, () => setState(() {
                _view = _AuthView.login;
                _error = null;
                _success = null;
              })),
          tab('Crear cuenta', _view == _AuthView.signup, () => setState(() {
                _view = _AuthView.signup;
                _error = null;
                _success = null;
              })),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController controller,
      {bool obscure = false, TextInputType? keyboardType, String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label, hintText: hint),
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
        _field('Contraseña', _loginPassword, obscure: true, hint: '••••••••'),
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
        _field('Contraseña', _signupPassword, obscure: true, hint: 'Mínimo 8 caracteres'),
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
        _field('Nueva contraseña', _newPassword, obscure: true, hint: 'Mínimo 8 caracteres'),
        PmPrimaryButton(label: 'Cambiar contraseña', loading: _loading, onPressed: _submitForgotReset),
      ],
    );
  }
}
