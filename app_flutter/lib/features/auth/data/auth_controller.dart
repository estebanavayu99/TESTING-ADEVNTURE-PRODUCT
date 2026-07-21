import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_repository.dart';
import 'traveler_profile.dart';

enum AuthStatus { loading, signedOut, signedIn }

/// Estado global de sesión + perfil de viajero, expuesto como
/// [ChangeNotifier] para que `go_router` pueda redirigir según
/// `status`/`profile.onboarded` (mismo rol que el chequeo de
/// `pickmap_current_user` al principio de cada página protegida en el
/// sitio web).
class AuthController extends ChangeNotifier {
  AuthController(this._repo) {
    _sub = _repo.onAuthStateChange.listen(_onAuthStateChange);
    _bootstrap();
  }

  final AuthRepository _repo;
  late final StreamSubscription<AuthState> _sub;

  AuthStatus status = AuthStatus.loading;
  TravelerProfile? profile;
  String? lastError;

  /// `true` cuando el último cambio de sesión vino del link de "recuperar
  /// contraseña" (Supabase entrega una sesión temporal real, no
  /// distinguible de un login normal salvo por el `event`). Sin esto, el
  /// router trataba ese evento igual que cualquier login y mandaba a
  /// `/home`/`/onboarding` en vez de al formulario de nueva contraseña —
  /// bug real si el link abre la app en frío (`AuthPage` ni siquiera
  /// llega a montarse para que su propio listener lo capture).
  bool passwordRecovery = false;

  AuthRepository get repo => _repo;
  User? get user => _repo.currentUser;

  /// Lee y apaga el flag en un solo paso — se consume una sola vez, apenas
  /// la pantalla que lo necesita (`AuthPage`) decide qué hacer con él.
  bool consumePasswordRecovery() {
    final value = passwordRecovery;
    passwordRecovery = false;
    return value;
  }

  Future<void> _bootstrap() async {
    final session = _repo.currentSession;
    if (session == null) {
      status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }
    await _loadProfile();
  }

  Future<void> _onAuthStateChange(AuthState state) async {
    if (state.session == null) {
      status = AuthStatus.signedOut;
      profile = null;
      notifyListeners();
      return;
    }
    if (state.event == AuthChangeEvent.passwordRecovery) {
      passwordRecovery = true;
    }
    await _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      profile = await _repo.getProfile(_repo.currentUser!.id);
      status = AuthStatus.signedIn;
    } catch (e) {
      lastError = e.toString();
      status = AuthStatus.signedIn;
    }
    notifyListeners();
  }

  Future<void> refreshProfile() => _loadProfile();

  Future<void> signOut() => _repo.signOut();

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
