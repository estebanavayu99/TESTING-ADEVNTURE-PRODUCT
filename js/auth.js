(() => {
  const USERS_KEY = 'pickmap_users';
  const SESSION_KEY = 'pickmap_current_user';
  const S = window.PickmapSupabase;

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
  const signupRutInput = document.getElementById('signupRut');
  if (signupRutInput) {
    signupRutInput.addEventListener('blur', (e) => {
      if (e.target.value.trim()) e.target.value = formatRut(e.target.value);
    });
  }

  // Puente con el mecanismo de sesión "legacy" (localStorage) del que
  // todavía dependen favoritos.js, invita.js, panoramas.js y dashboard.js
  // para leer name/rut/tastes/company/etc. Esta fase migra la IDENTIDAD
  // y la SEGURIDAD a Supabase Auth real, pero mantiene este espejo para
  // no tener que reescribir esas 4 páginas en la misma pasada — quedan
  // igual de funcionales, solo que ahora alimentadas por datos reales.
  function getLegacyUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
  }
  function setLegacySession(email) { localStorage.setItem(SESSION_KEY, email); }
  function mirrorLegacyUser(fields) {
    const users = getLegacyUsers();
    const idx = users.findIndex((u) => u.email === fields.email);
    if (idx === -1) users.push(fields);
    else users[idx] = { ...users[idx], ...fields };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async function syncLegacyFromSupabase(userId, email) {
    let profile = null;
    try { profile = await S.profiles.get(userId); } catch { /* profiles aún no existe para este user_id */ }
    mirrorLegacyUser({
      email,
      supabase_user_id: userId,
      name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : email.split('@')[0],
      rut: profile ? profile.rut : '',
      phone: profile ? profile.phone : '',
      age: profile ? profile.age : null,
      city: profile ? profile.city : '',
      company: profile ? profile.company : [],
      tastes: profile ? profile.tastes : [],
      difficulty: profile ? profile.difficulty : [],
      budget: profile ? profile.budget : [],
      travelDistance: profile ? profile.travel_distance : [],
      preferredDay: profile ? profile.preferred_day : [],
      onboarded: !!(profile && profile.onboarded),
    });
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
    login: '🧭 Iniciando sesión como viajero',
    signup: '🧭 Creando tu cuenta de viajero',
    verify: '🧭 Confirma tu correo',
    'forgot-request': '🧭 Recupera tu contraseña',
    'forgot-reset': '🧭 Recupera tu contraseña',
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
    const authNote = document.getElementById('authNote');
    if (authNote) authNote.hidden = !showsTabs;
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
    showError('Supabase todavía no está configurado (js/supabase-config.js) — no se puede iniciar sesión ni crear cuentas reales hasta completar la URL y anon key del proyecto.');
    // Los formularios siguen visibles pero cualquier submit fallará con
    // este mismo mensaje (requireClient() lanza), no se bloquea el resto
    // de la página ni se rompe silenciosamente.
  }

  let pendingSignupEmail = null;

  // Sesión ya activa (Supabase Auth real) → saltar directo a onboarding o dashboard.
  (async () => {
    if (!S || !S.configured) return;
    try {
      const session = await S.auth.getSession();
      if (session && session.user) {
        setLegacySession(session.user.email);
        const profile = await syncLegacyFromSupabase(session.user.id, session.user.email);
        window.location.href = profile && profile.onboarded ? 'dashboard.html' : 'onboarding.html';
      }
    } catch { /* sin sesión activa, se queda en el login normal */ }
  })();

  // Recuperación de contraseña: Supabase redirige de vuelta a esta misma
  // página con una sesión de tipo "recovery" en la URL (no un código que
  // el usuario copie a mano). Se detecta con el evento PASSWORD_RECOVERY.
  if (S && S.configured && S.client) {
    S.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') showForm('forgot-reset');
    });
  }

  const tabLoginBtn = tabLogin;
  const tabSignupBtn = tabSignup;
  tabLoginBtn.addEventListener('click', () => showForm('login'));
  tabSignupBtn.addEventListener('click', () => showForm('signup'));
  document.getElementById('goSignup').addEventListener('click', () => showForm('signup'));
  document.getElementById('goLogin').addEventListener('click', () => showForm('login'));

  if (new URLSearchParams(window.location.search).get('tab') === 'signup') {
    showForm('signup');
  }

  formSignup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(formSignup);
    const firstName = data.get('firstName').trim();
    const lastName = data.get('lastName').trim();
    const rut = formatRut(data.get('rut'));
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');

    if (!firstName || !lastName || !email || password.length < 8) {
      showError('Revisa los datos: nombre y apellido no pueden estar vacíos, y la contraseña necesita al menos 8 caracteres.');
      return;
    }
    if (!isValidRut(rut)) {
      showError('El RUT ingresado no es válido. Revísalo e intenta de nuevo.');
      return;
    }

    try {
      // La fila de `profiles` la crea un trigger en la base de datos (ver
      // supabase/schema.sql: on_auth_user_created) a partir de estos
      // metadatos — no se escribe directo desde el navegador porque en
      // este instante (con confirmación de correo activada) todavía no
      // hay sesión autenticada y RLS lo bloquearía.
      const result = await S.auth.signUp(email, password, { account_type: 'viajero', first_name: firstName, last_name: lastName, rut });
      const name = `${firstName} ${lastName}`.trim();
      if (result.session) {
        // Confirmación de correo desactivada en el proyecto Supabase: la
        // sesión queda activa de inmediato, igual que antes con el código
        // falso — se sigue directo a onboarding sin pantalla intermedia.
        setLegacySession(email);
        mirrorLegacyUser({ email, name, rut, onboarded: false, supabase_user_id: result.user.id });
        window.location.href = 'onboarding.html';
        return;
      }
      pendingSignupEmail = email;
      document.getElementById('verifyEmailLabel').textContent = email;
      showForm('verify');
    } catch (err) {
      showError(err.message || 'No pudimos crear tu cuenta. Intenta de nuevo.');
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
      const profile = await syncLegacyFromSupabase(result.user.id, email);
      window.location.href = profile && profile.onboarded ? 'dashboard.html' : 'onboarding.html';
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
