(() => {
  const USERS_KEY = 'pickmap_business_users';
  const SESSION_KEY = 'pickmap_business_session';

  // Cuenta admin de Pickmap (instrucción explícita del usuario, 2026-07-20):
  // este email en particular no entra al panel de negocio normal — va al
  // resumen agregado de TODOS los negocios (negocio-admin.html/js). Mismo
  // email que ya se usaba como OWNER_NOTIFICATION_EMAIL en js/negocio.js.
  const ADMIN_EMAIL = 'contacto@pickmap.cl';
  function panelDestino(email) { return email === ADMIN_EMAIL ? 'negocio-admin.html' : 'negocio.html'; }

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

  // Mismo cálculo que getReferralCode() en js/negocio.js (duplicado acá a
  // propósito, patrón ya establecido del repo: helpers duplicados por
  // archivo en vez de un módulo compartido) — necesario para poder
  // reconocer, en el signup, a qué negocio le pertenece un código de
  // invitación ingresado por otro negocio nuevo.
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

  // Instrucción explícita del usuario: al crearse una cuenta, si ingresó
  // un código de invitación de otro negocio real ya registrado, ese
  // negocio debe verlo reflejado en su lista de Referidos. Se llama solo
  // tras la verificación REAL (mismo criterio que createGhlContact: nunca
  // ensuciar datos de otro negocio con un signup que nunca se confirmó).
  // Queda en estado 'invitado' con recompensa $0 — la recompensa de
  // $50.000 se paga recién cuando el negocio referido confirme su primera
  // reserva real, y hoy no existe ese vínculo real entre reservas y
  // referidos (mismo motivo por el que el resto de notificaciones de
  // reserva siguen sin engancharse a este panel, ver CLAUDE.md).
  function creditarReferido(referralCodeIngresado, nuevoBizName) {
    const codigo = (referralCodeIngresado || '').trim().toUpperCase();
    if (!codigo) return;
    const users = getUsers();
    const referente = users.find((u) => computeReferralCode(u) === codigo);
    if (!referente) return;
    const key = `pickmap_business_referrals_${referente.email}`;
    let raw;
    try { raw = JSON.parse(localStorage.getItem(key)); } catch { raw = null; }
    if (!Array.isArray(raw)) raw = [];
    raw.unshift({ nombre: nuevoBizName, fecha: new Date().toISOString(), estado: 'invitado', recompensa: 0 });
    localStorage.setItem(key, JSON.stringify(raw));
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

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function setSession(email) {
    localStorage.setItem(SESSION_KEY, email);
  }

  // Magic-link confirmation: ?verify=<token> in the URL (from the email
  // link) confirms la cuenta de empresa y loguea directo — mismo patrón
  // que js/auth.js para el viajero.
  const verifyToken = new URLSearchParams(window.location.search).get('verify');
  if (verifyToken) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.verificationToken === verifyToken);
    if (idx !== -1) {
      users[idx].verified = true;
      delete users[idx].verificationToken;
      creditarReferido(users[idx].referralCodeUsed, users[idx].bizName);
      saveUsers(users);
      setSession(users[idx].email);
      window.location.href = panelDestino(users[idx].email);
      return;
    }
  }

  // Already logged in as business: skip straight to the panel.
  const activeSessionEmail = localStorage.getItem(SESSION_KEY);
  if (activeSessionEmail) {
    window.location.href = panelDestino(activeSessionEmail);
    return;
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

  function genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
  function genToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Mismo helper que js/auth.js: manda el correo real vía Resend
  // (api/send-verification.js), con fallback silencioso si falla.
  function sendVerificationEmail(email, firstName, extra) {
    return fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName: firstName || '', ...extra }),
    }).then((r) => {
      if (!r.ok) throw new Error('send failed');
    });
  }

  let pendingEmail = null;

  // Verificación de cuenta de empresa por magic link (no código) — mismo
  // patrón que el viajero en js/auth.js: clicar el link en el correo
  // confirma la cuenta y loguea directo (ver el ?verify=<token> arriba).
  function startVerification(email) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) return;
    const token = genToken();
    users[idx].verificationToken = token;
    saveUsers(users);
    pendingEmail = email;
    document.getElementById('verifyEmailLabel').textContent = email;
    document.getElementById('resendSuccess').hidden = true;
    document.getElementById('verifyLinkFallback').hidden = true;
    showForm('verify');

    const firstName = (users[idx].repName || '').trim().split(' ')[0];
    const link = `${window.location.origin}/login-empresa.html?verify=${token}`;
    sendVerificationEmail(email, firstName, { link }).catch(() => {
      const fallbackHref = document.getElementById('verifyLinkFallbackHref');
      fallbackHref.href = link;
      document.getElementById('verifyLinkFallback').hidden = false;
    });
  }

  document.getElementById('resendCode').addEventListener('click', () => {
    if (!pendingEmail) return;
    startVerification(pendingEmail);
    document.getElementById('resendSuccess').hidden = false;
  });
  document.getElementById('verifyBack').addEventListener('click', () => showForm('login'));

  /* ---------- Recuperar contraseña ---------- */
  let pendingForgotEmail = null;

  function showSuccess(message) {
    successBox.textContent = message;
    successBox.hidden = false;
  }

  function startForgotReset(email) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) return;
    const code = genCode();
    users[idx].resetCode = code;
    saveUsers(users);
    pendingForgotEmail = email;
    document.getElementById('forgotEmailLabel').textContent = email;
    document.getElementById('forgotCodeDisplay').textContent = code;
    document.getElementById('forgotCodeInput').value = '';
    document.getElementById('forgotNewPassword').value = '';
    showForm('forgot-reset');
  }

  document.getElementById('forgotLink').addEventListener('click', () => {
    document.getElementById('forgotEmail').value = '';
    showForm('forgot-request');
  });
  document.getElementById('forgotBackToLogin1').addEventListener('click', () => showForm('login'));
  document.getElementById('forgotBackToLogin2').addEventListener('click', () => showForm('login'));
  document.getElementById('forgotResend').addEventListener('click', () => {
    if (pendingForgotEmail) startForgotReset(pendingForgotEmail);
  });

  formForgotRequest.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
    const users = getUsers();
    if (!users.some((u) => u.email === email)) {
      showError('No encontramos una cuenta de empresa con ese correo.');
      return;
    }
    startForgotReset(email);
  });

  formForgotReset.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('forgotCodeInput').value.trim();
    const newPassword = document.getElementById('forgotNewPassword').value;
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === pendingForgotEmail);
    if (idx === -1) {
      showForm('login');
      return;
    }
    if (users[idx].resetCode !== code) {
      showError('Ese código no es correcto. Revísalo e intenta de nuevo.');
      return;
    }
    if (newPassword.length < 8) {
      showError('La nueva contraseña necesita al menos 8 caracteres.');
      return;
    }
    users[idx].password = newPassword;
    delete users[idx].resetCode;
    saveUsers(users);
    showForm('login');
    showSuccess('Tu contraseña fue actualizada. Ya puedes iniciar sesión.');
  });

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

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  formSignup.addEventListener('submit', (e) => {
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
    const address = street && comuna && region ? `${street}, ${comuna}, ${region}` : '';
    const availability = data.get('availability');
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');
    const referralCodeUsed = (data.get('referralCode') || '').trim().toUpperCase();

    if (!repName || !bizName || !legalName || !address || !availability || !email || password.length < 8) {
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

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      showError('Ya existe una cuenta de empresa con ese correo. Prueba iniciando sesión.');
      return;
    }

    users.push({ repName, repRut, bizName, legalName, bizRut, address, availability, email, password, verified: false, referralCodeUsed });
    saveUsers(users);
    startVerification(email);
  });

  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(formLogin);
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');

    const users = getUsers();
    const match = users.find((u) => u.email === email && u.password === password);
    if (!match) {
      showError('Correo o contraseña incorrectos.');
      return;
    }

    setSession(email);
    window.location.href = panelDestino(email);
  });
})();
