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
    client = window.supabase.createClient(url, anonKey);
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

  window.PickmapSupabase = {
    configured,
    client,
    auth: { signUp, signIn, signOut, getSession, resetPasswordForEmail, updatePassword },
    profiles: { get: getProfile, upsert: upsertProfile },
    darwinPreferences: { get: getDarwinPreferences, upsert: upsertDarwinPreferences },
    preferenceSignals: { log: logPreferenceSignal },
    businesses: { listAll: listAllBusinesses },
  };
})();
