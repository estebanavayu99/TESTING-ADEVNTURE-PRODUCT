(() => {
  const USERS_KEY = 'pickmap_business_users';
  const SESSION_KEY = 'pickmap_business_session';
  const S = window.PickmapSupabase;

  // Cuenta admin de Pickmap (instrucción explícita del usuario, 2026-07-20):
  // este email en particular no entra al panel de negocio normal — va al
  // resumen agregado de TODOS los negocios (negocio-admin.html/js). Mismo
  // email que ya se usaba como OWNER_NOTIFICATION_EMAIL en js/negocio.js.
  const ADMIN_EMAIL = 'contacto@pickmap.cl';
  function panelDestino(email) { return (email || '').trim().toLowerCase() === ADMIN_EMAIL ? 'negocio-admin.html' : 'negocio.html'; }

  function cleanRut(v) { return (v || '').replace(/[^0-9kK]/g, '').toUpperCase(); }
  function formatRut(v) {
    const clean = cleanRut(v);
    if (clean.length <= 1) return clean;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    let formatted = '';
    for (let i = 0; i < body.length; i++) {
      const posFromEnd = body.length - i;
      formatted += body[i];
      if (posFromEnd > 1 && (posFromEnd - 1) % 3 === 0) formatted += '.';
    }
    return `${formatted}-${dv}`;
  }
  function isValidRut(v) {
    const clean = cleanRut(v);
    if (clean.length < 2) return false;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    if (!/^\d+$/.test(body)) return false;
    let sum = 0;
    let mul = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const res = 11 - (sum % 11);
    const expectedDv = res === 11 ? '0' : res === 10 ? 'K' : String(res);
    return dv === expectedDv;
  }

  ['signupRepRut', 'signupBizRut'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('blur', (e) => {
        if (e.target.value.trim()) e.target.value = formatRut(e.target.value);
      });
    }
  });

  // Región/Comuna: selects reales (no texto libre) poblados desde
  // js/chile-regiones.js. La comuna depende de la región elegida.
  const regionSelect = document.getElementById('signupRegion');
  const comunaSelect = document.getElementById('signupComuna');
  if (regionSelect && comunaSelect && window.CHILE_REGIONES) {
    window.CHILE_REGIONES.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.region;
      opt.textContent = r.region;
      regionSelect.appendChild(opt);
    });
    regionSelect.addEventListener('change', () => {
      const encontrada = window.CHILE_REGIONES.find((r) => r.region === regionSelect.value);
      comunaSelect.innerHTML = '<option value="" disabled selected>Selecciona una comuna</option>';
      comunaSelect.disabled = !encontrada;
      if (encontrada) {
        encontrada.comunas.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          comunaSelect.appendChild(opt);
        });
      }
    });
  }

  // Puente con el mecanismo de sesión "legacy" (localStorage) del que
  // todavía dependen negocio.html y las 6 páginas negocio-*.html/js para
  // leer bizName/address/availability/etc. Esta fase migra la IDENTIDAD y
  // la SEGURIDAD de empresa a Supabase Auth real (mismo patrón que ya se
  // hizo para el viajero en js/auth.js), pero mantiene este espejo para no
  // tener que reescribir esas 7 páginas en la misma pasada.
  function getLegacyUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
  }
  function saveLegacyUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  function setLegacySession(email) { localStorage.setItem(SESSION_KEY, email); }
  function mirrorLegacyBusinessUser(fields) {
    const users = getLegacyUsers();
    const idx = users.findIndex((u) => u.email === fields.email);
    if (idx === -1) users.push(fields);
    else users[idx] = { ...users[idx], ...fields };
    saveLegacyUsers(users);
  }

  // Mismo cálculo que getReferralCode() en js/negocio.js (duplicado acá a
  // propósito, patrón ya establecido del repo: helpers duplicados por
  // archivo en vez de un módulo compartido) — necesario para poder
  // reconocer, en el signup, a qué negocio le pertenece un código de
  // invitación ingresado por otro negocio nuevo. Sigue operando sobre el
  // espejo legacy (pickmap_business_users): los referidos no se migraron
  // a Supabase en esta pasada (alcance explícito: solo auth/identidad).
  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function computeReferralCode(user) {
    const base = (user.bizName || 'PICKMAP').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PICKMAP';
    const suffix = String(100 + (hashStr(user.email) % 900));
    return `${base}${suffix}`;
  }

  // Instrucción explícita del usuario: al crearse una cuenta, si ingresó un
  // código de invitación de otro negocio real ya registrado, ese negocio
  // debe verlo reflejado en su lista de Referidos. Se llama solo la
  // PRIMERA vez que la cuenta nueva confirma su correo real (guardado en
  // `business_profiles.referral_credited` — con Supabase el perfil se
  // sincroniza en cada login, así que sin esa bandera se acreditaría de
  // nuevo cada vez). Queda en estado 'invitado' con recompensa $0 — la
  // recompensa de $50.000 se paga recién cuando el negocio referido
  // confirme su primera reserva real, vínculo que hoy no existe.
  function creditarReferido(referralCodeIngresado, nuevoBizName) {
    const codigo = (referralCodeIngresado || '').trim().toUpperCase();
    if (!codigo) return;
    const users = getLegacyUsers();
    const referente = users.find((u) => computeReferralCode(u) === codigo);
    if (!referente) return;
    const key = `pickmap_business_referrals_${referente.email}`;
    let raw;
    try { raw = JSON.parse(localStorage.getItem(key)); } catch { raw = null; }
    if (!Array.isArray(raw)) raw = [];
    raw.unshift({ nombre: nuevoBizName, fecha: new Date().toISOString(), estado: 'invitado', recompensa: 0 });
    localStorage.setItem(key, JSON.stringify(raw));
  }

  function addressFromProfile(profile) {
    return profile && profile.street && profile.comuna && profile.region
      ? `${profile.street}, ${profile.comuna}, ${profile.region}`
      : '';
  }

  async function syncLegacyFromSupabase(userId, email) {
    let profile = null;
    try { profile = await S.businessProfiles.get(userId); } catch { /* fila del trigger aún no visible */ }
    mirrorLegacyBusinessUser({
      email,
      supabase_user_id: userId,
      repName: profile ? profile.rep_name : '',
      repRut: profile ? profile.rep_rut : '',
      bizName: profile ? profile.biz_name : '',
      legalName: profile ? profile.legal_name : '',
      bizRut: profile ? profile.biz_rut : '',
      address: addressFromProfile(profile),
      availability: profile ? profile.availability : '',
      referralCodeUsed: profile ? profile.referral_code_used : '',
      verified: !!(profile && profile.verified),
      createdAt: profile ? profile.created_at : new Date().toISOString(),
    });

    // Acreditar el código de invitación recién ahora que el correo está
    // realmente confirmado (mismo criterio que antes: nunca ensuciar el
    // panel de Referidos de otro negocio con un signup sin confirmar).
    if (profile && profile.verified && profile.referral_code_used && !profile.referral_credited) {
      creditarReferido(profile.referral_code_used, profile.biz_name);
      try { await S.businessProfiles.upsert(userId, { referral_credited: true }); } catch { /* se reintenta en el próximo login si falla */ }
    }
    return profile;
  }

  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const authTabs = document.querySelector('.auth-tabs');
  const formLogin = document.getElementById('formLogin');
  const formSignup = document.getElementById('formSignup');
  const formVerify = document.getElementById('formVerify');
  const formForgotRequest = document.getElementById('formForgotRequest');
  const formForgotReset = document.getElementById('formForgotReset');
  const errorBox = document.getElementById('authError');
  const successBox = document.getElementById('authSuccess');
  const kicker = document.getElementById('authKicker');

  const KICKERS = {
    login: '🏢 Iniciando sesión como empresa',
    signup: '🏢 Creando tu cuenta de empresa',
    verify: '🏢 Verifica tu correo de empresa',
    'forgot-request': '🏢 Recupera tu contraseña de empresa',
    'forgot-reset': '🏢 Recupera tu contraseña de empresa',
  };

  function showForm(which) {
    const isLogin = which === 'login';
    const showsTabs = which === 'login' || which === 'signup';
    formLogin.hidden = which !== 'login';
    formSignup.hidden = which !== 'signup';
    formVerify.hidden = which !== 'verify';
    formForgotRequest.hidden = which !== 'forgot-request';
    formForgotReset.hidden = which !== 'forgot-reset';
    authTabs.hidden = !showsTabs;
    if (showsTabs) {
      tabLogin.classList.toggle('is-active', isLogin);
      tabSignup.classList.toggle('is-active', !isLogin);
      tabLogin.setAttribute('aria-selected', String(isLogin));
      tabSignup.setAttribute('aria-selected', String(!isLogin));
    }
    kicker.textContent = KICKERS[which];
    errorBox.hidden = true;
    successBox.hidden = true;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    successBox.hidden = true;
  }
  function showSuccess(message) {
    successBox.textContent = message;
    successBox.hidden = false;
    errorBox.hidden = true;
  }

  if (!S || !S.configured) {
    showError('Supabase todavía no está configurado (js/supabase-config.js) — no se puede iniciar sesión ni crear cuentas de empresa reales hasta completar la URL y anon key del proyecto.');
  }

  let pendingSignupEmail = null;

  // Sesión de empresa ya activa (Supabase Auth real) → saltar directo al
  // panel correspondiente (negocio.html o negocio-admin.html si es el admin).
  (async () => {
    if (!S || !S.configured) return;
    try {
      const session = await S.auth.getSession();
      if (session && session.user) {
        const sessionEmail = (session.user.email || '').trim().toLowerCase();
        setLegacySession(sessionEmail);
        await syncLegacyFromSupabase(session.user.id, sessionEmail);
        window.location.href = panelDestino(sessionEmail);
      }
    } catch { /* sin sesión activa, se queda en el login normal */ }
  })();

  // Recuperación de contraseña: Supabase redirige de vuelta a esta misma
  // página con una sesión de tipo "recovery" en la URL, detectada con el
  // evento PASSWORD_RECOVERY (no un código de 6 dígitos copiado a mano).
  if (S && S.configured && S.client) {
    S.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') showForm('forgot-reset');
    });
  }

  tabLogin.addEventListener('click', () => showForm('login'));
  tabSignup.addEventListener('click', () => showForm('signup'));
  document.getElementById('goSignup').addEventListener('click', () => showForm('signup'));
  document.getElementById('goLogin').addEventListener('click', () => showForm('login'));

  if (new URLSearchParams(window.location.search).get('tab') === 'signup') {
    showForm('signup');
  }

  // Bug real: el botón "Copiar código" de negocio-referidos.js copia un
  // link con ?ref=<code>, pero nada lo leía acá — el campo de código de
  // invitación del signup se quedaba vacío igual, así que compartir el
  // link no servía de nada. Se precarga el campo y se abre directo el
  // formulario de signup.
  const refCode = new URLSearchParams(window.location.search).get('ref');
  if (refCode) {
    showForm('signup');
    const refInput = document.getElementById('signupReferralCode');
    if (refInput) refInput.value = refCode;
  }

  formSignup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(formSignup);
    const repName = data.get('repName').trim();
    const repRut = formatRut(data.get('repRut'));
    const bizName = data.get('bizName').trim();
    const legalName = data.get('legalName').trim();
    const bizRut = formatRut(data.get('bizRut'));
    const region = data.get('region');
    const comuna = data.get('comuna');
    const street = data.get('street').trim();
    const availability = data.get('availability');
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');
    const referralCodeUsed = (data.get('referralCode') || '').trim().toUpperCase();

    if (!repName || !bizName || !legalName || !region || !comuna || !street || !availability || !email || password.length < 8) {
      showError('Revisa que todos los campos estén completos y que la contraseña tenga al menos 8 caracteres.');
      return;
    }
    if (!isValidRut(repRut)) {
      showError('El RUT del representante no es válido. Revísalo e intenta de nuevo.');
      return;
    }
    if (!isValidRut(bizRut)) {
      showError('El RUT de la empresa no es válido. Revísalo e intenta de nuevo.');
      return;
    }

    try {
      // La fila de `business_profiles` la crea un trigger en la base de
      // datos (ver supabase/schema.sql: on_auth_business_user_created) a
      // partir de estos metadatos — no se escribe directo desde el
      // navegador porque en este instante todavía no hay sesión
      // autenticada y RLS lo bloquearía.
      const result = await S.auth.signUp(email, password, {
        account_type: 'empresa',
        rep_name: repName, rep_rut: repRut, biz_name: bizName, legal_name: legalName, biz_rut: bizRut,
        region, comuna, street, availability, referral_code_used: referralCodeUsed,
      });
      if (result.session) {
        // Confirmación de correo desactivada en el proyecto Supabase: la
        // sesión queda activa de inmediato — se sigue directo al panel sin
        // pantalla intermedia (mismo criterio que el viajero).
        setLegacySession(email);
        await syncLegacyFromSupabase(result.user.id, email);
        window.location.href = panelDestino(email);
        return;
      }
      pendingSignupEmail = email;
      document.getElementById('verifyEmailLabel').textContent = email;
      showForm('verify');
    } catch (err) {
      showError(err.message || 'No pudimos crear tu cuenta de empresa. Intenta de nuevo.');
    }
  });

  document.getElementById('resendCode').addEventListener('click', async () => {
    if (!pendingSignupEmail || !S.client) return;
    try {
      await S.client.auth.resend({ type: 'signup', email: pendingSignupEmail });
      showSuccess('Correo reenviado.');
    } catch (err) {
      showError(err.message || 'No pudimos reenviar el correo.');
    }
  });
  document.getElementById('verifyBack').addEventListener('click', () => showForm('login'));

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(formLogin);
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');

    try {
      const result = await S.auth.signIn(email, password);
      setLegacySession(email);
      await syncLegacyFromSupabase(result.user.id, email);
      window.location.href = panelDestino(email);
    } catch (err) {
      const msg = /confirm/i.test(err.message || '') ? 'Confirma tu correo antes de iniciar sesión — revisa tu bandeja de entrada.' : 'Correo o contraseña incorrectos.';
      showError(msg);
    }
  });

  /* ---------- Recuperar contraseña (real, vía Supabase) ---------- */
  document.getElementById('forgotLink').addEventListener('click', () => {
    document.getElementById('forgotEmail').value = '';
    showForm('forgot-request');
  });
  document.getElementById('forgotBackToLogin1').addEventListener('click', () => showForm('login'));

  formForgotRequest.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
    try {
      await S.auth.resetPasswordForEmail(email, window.location.origin + window.location.pathname);
      showForm('login');
      showSuccess('Si esa cuenta existe, te enviamos un enlace para restablecer tu contraseña.');
    } catch (err) {
      showError(err.message || 'No pudimos enviar el enlace de recuperación.');
    }
  });

  formForgotReset.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('forgotNewPassword').value;
    if (newPassword.length < 8) {
      showError('La nueva contraseña necesita al menos 8 caracteres.');
      return;
    }
    try {
      await S.auth.updatePassword(newPassword);
      showForm('login');
      showSuccess('Tu contraseña fue actualizada. Ya puedes iniciar sesión.');
    } catch (err) {
      showError(err.message || 'No pudimos actualizar tu contraseña.');
    }
  });
})();
