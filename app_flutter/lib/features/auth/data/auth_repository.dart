import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/supabase/supabase_config.dart';
import 'traveler_profile.dart';

/// Repositorio de auth + perfil de viajero, hablando directo con el mismo
/// proyecto Supabase real que usa `js/auth.js`/`js/supabase-client.js` en
/// el sitio web (tablas `profiles`/`darwin_preferences`, ver
/// supabase/schema.sql). Sin capa de mocks: si Supabase no responde, el
/// error real de supabase_flutter se propaga tal cual para que la UI lo
/// muestre, mismo criterio de "fallar explícito" del sitio web.
class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient _client;

  Session? get currentSession => _client.auth.currentSession;
  User? get currentUser => _client.auth.currentUser;
  Stream<AuthState> get onAuthStateChange => _client.auth.onAuthStateChange;

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String rut,
    String? phone,
  }) {
    return _client.auth.signUp(
      email: email,
      password: password,
      data: {
        'account_type': 'viajero',
        'first_name': firstName,
        'last_name': lastName,
        'rut': rut,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      },
      emailRedirectTo: PickmapSupabaseConfig.authCallbackUrl,
    );
  }

  Future<AuthResponse> signIn({required String email, required String password}) {
    return _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signOut() => _client.auth.signOut();

  Future<void> resetPasswordForEmail(String email) {
    return _client.auth.resetPasswordForEmail(
      email,
      redirectTo: PickmapSupabaseConfig.authCallbackUrl,
    );
  }

  Future<void> updatePassword(String newPassword) {
    return _client.auth.updateUser(UserAttributes(password: newPassword));
  }

  /// "Reenviar correo" en la pantalla de espera de verificación.
  Future<void> resendSignupEmail(String email) {
    return _client.auth.resend(type: OtpType.signup, email: email);
  }

  Future<TravelerProfile?> getProfile(String userId) async {
    final data = await _client
        .from('profiles')
        .select()
        .eq('user_id', userId)
        .maybeSingle();
    if (data == null) return null;
    return TravelerProfile.fromMap(data);
  }

  Future<void> upsertProfile(String userId, Map<String, dynamic> fields) {
    return _client.from('profiles').upsert({'user_id': userId, ...fields});
  }

  Future<void> upsertDarwinPreferences(String userId, Map<String, dynamic> fields) {
    return _client.from('darwin_preferences').upsert({'user_id': userId, ...fields});
  }
}
