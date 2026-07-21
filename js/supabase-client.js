/* Pickmap — cliente Supabase compartido (fase de backend real)
 *
 * Wrapper fino sobre supabase-js (cargado como UMD vía CDN, sin build
 * step — ver el <script> de @supabase/supabase-js antes de este archivo
 * en cada página que lo use). Expone window.PickmapSupabase con:
 *   - auth: signUp, signIn, signOut, getSession, onAuthChange
 *   - profiles: get, upsert
 *   - darwinPreferences: get, upsert
 *   - preferenceSignals: log (append-only, trazabilidad)
 *   - businesses: listAll
 *   - businessProfiles: get, upsert (identidad real de cuentas de empresa)
 *
 * Requiere que js/supabase-config.js se haya cargado antes (define
 * window.PICKMAP_SUPABASE_URL / PICKMAP_SUPABASE_ANON_KEY). Si siguen
 * en el valor placeholder, este archivo NO intenta conectar — deja
 * PickmapSupabase.configured = false para que quien lo consuma pueda
 * degradarse con un mensaje claro en vez de un error de red críptico.
 */
(() => {
  const url = window.PICKMAP_SUPABASE_URL;
  const anonKey = window.PICKMAP_SUPABASE_ANON_KEY;
  const configured = !!(url && anonKey && !url.includes('TU-PROYECTO') && !anonKey.includes('TU-ANON-KEY'));

  let client = null;
  if (configured && window.supabase && typeof window.supabase.createClient === 'function') {
    // flowType: 'implicit' explícito — bug real reportado por el usuario
    // (2026-07-21): al crear una cuenta en un navegador/sesión y confirmar
    // el correo desde OTRO navegador/sesión (celular, otra ventana, otro
    // perfil de Chrome), la confirmación fallaba. Causa: el flow por
    // defecto de supabase-js (PKCE) guarda un `code_verifier` en el
    // localStorage del navegador que llama a signUp()/resetPasswordForEmail();
    // el link de confirmación solo manda un `code` que debe intercambiarse
    // contra ESE `code_verifier` — si se abre en otro navegador, ese valor
    // no existe ahí y el intercambio falla (por eso "no manda a una página
    // válida"). Con 'implicit', Supabase entrega el access_token/refresh_token
    // directamente en la URL de confirmación (verificado server-side, sin
    // depender de storage local), así que el link funciona sin importar
    // desde qué dispositivo/navegador se abra — el caso real y esperado
    // acá (alguien crea la cuenta desde el compu y confirma desde el
    // celular, u otro navegador).
    client = window.supabase.createClient(url, anonKey, { auth: { flowType: 'implicit' } });
  }

  function requireClient() {
    if (!client) {
      throw new Error('Supabase no está configurado todavía — completa js/supabase-config.js con tu URL y anon key reales.');
    }
    return client;
  }

  async function signUp(email, password, meta) {
    // emailRedirectTo explícito: sin esto, Supabase usa el "Site URL"
    // configurado en el dashboard (por defecto localhost:3000) para el
    // link del correo de confirmación — rompía el flujo en cualquier
    // dominio real (preview de Vercel, producción). Con
    // window.location.origin funciona automáticamente sea cual sea el
    // dominio desde el que alguien se registre.
    const { data, error } = await requireClient().auth.signUp({
      email, password,
      options: { data: meta || {}, emailRedirectTo: `${window.location.origin}/login.html` },
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await requireClient().auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    const { data, error } = await requireClient().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function resetPasswordForEmail(email, redirectTo) {
    const { error } = await requireClient().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await requireClient().auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function getProfile(userId) {
    const { data, error } = await requireClient().from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function upsertProfile(userId, fields) {
    const { error } = await requireClient().from('profiles').upsert({ user_id: userId, ...fields });
    if (error) throw error;
  }

  async function getDarwinPreferences(userId) {
    const { data, error } = await requireClient().from('darwin_preferences').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function upsertDarwinPreferences(userId, fields) {
    const { error } = await requireClient().from('darwin_preferences').upsert({ user_id: userId, ...fields });
    if (error) throw error;
  }

  async function logPreferenceSignal(userId, categoria, fuente, deltaAfinidad, detalle) {
    const { error } = await requireClient().from('preference_signals').insert({
      user_id: userId, categoria, fuente, delta_afinidad: deltaAfinidad ?? null, detalle: detalle ?? null,
    });
    if (error) throw error; // no se atrapa acá a propósito: quien llama decide si un fallo de log bloquea o no
  }

  async function listAllBusinesses() {
    const { data, error } = await requireClient().from('businesses').select('*');
    if (error) throw error;
    return data || [];
  }

  async function getBusinessProfile(userId) {
    const { data, error } = await requireClient().from('business_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function upsertBusinessProfile(userId, fields) {
    const { error } = await requireClient().from('business_profiles').upsert({ user_id: userId, ...fields });
    if (error) throw error;
  }

  // Solo el admin (contacto@pickmap.cl) obtiene filas de estas dos
  // consultas más allá de la propia — lo permite la policy "dueño o admin
  // lee" de cada tabla (ver supabase/schema.sql). Usado por
  // negocio-admin.js para poblar "Ver como" con cuentas reales de
  // cualquier navegador, no solo las que hayan iniciado sesión en el
  // mismo navegador del admin (limitación real del puente legacy en
  // localStorage que el resto del sitio sigue usando).
  async function listAllProfiles() {
    const { data, error } = await requireClient().from('profiles').select('*');
    if (error) throw error;
    return data || [];
  }

  async function listAllBusinessProfiles() {
    const { data, error } = await requireClient().from('business_profiles').select('*');
    if (error) throw error;
    return data || [];
  }

  window.PickmapSupabase = {
    configured,
    client,
    auth: { signUp, signIn, signOut, getSession, resetPasswordForEmail, updatePassword },
    profiles: { get: getProfile, upsert: upsertProfile, listAll: listAllProfiles },
    darwinPreferences: { get: getDarwinPreferences, upsert: upsertDarwinPreferences },
    preferenceSignals: { log: logPreferenceSignal },
    businesses: { listAll: listAllBusinesses },
    businessProfiles: { get: getBusinessProfile, upsert: upsertBusinessProfile, listAll: listAllBusinessProfiles },
  };
})();
