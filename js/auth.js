(() => {
  const USERS_KEY = 'pickmap_users';
  const SESSION_KEY = 'pickmap_current_user';

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

  function getSession() {
    return localStorage.getItem(SESSION_KEY);
  }

  // Already logged in: skip straight to onboarding or the dashboard.
  const activeEmail = getSession();
  if (activeEmail) {
    const activeUser = getUsers().find((u) => u.email === activeEmail);
    window.location.href = activeUser && activeUser.onboarded ? 'dashboard.html' : 'onboarding.html';
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
    login: '🧭 Iniciando sesión como viajero',
    signup: '🧭 Creando tu cuenta de viajero',
    verify: '🧭 Verifica tu correo',
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
  }

  function genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

  let pendingEmail = null;
  let pendingRedirect = null;

  function startVerification(email, redirectTo) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) return;
    const code = genCode();
    users[idx].verificationCode = code;
    saveUsers(users);
    pendingEmail = email;
    pendingRedirect = redirectTo;
    document.getElementById('verifyEmailLabel').textContent = email;
    document.getElementById('verifyCodeDisplay').textContent = code;
    document.getElementById('verifyCodeInput').value = '';
    showForm('verify');
  }

  formVerify.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('verifyCodeInput').value.trim();
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === pendingEmail);
    if (idx === -1) {
      showForm('login');
      return;
    }
    if (users[idx].verificationCode !== code) {
      showError('Ese código no es correcto. Revísalo e intenta de nuevo.');
      return;
    }
    users[idx].verified = true;
    delete users[idx].verificationCode;
    saveUsers(users);
    setSession(pendingEmail);
    window.location.href = pendingRedirect;
  });

  document.getElementById('resendCode').addEventListener('click', () => {
    if (pendingEmail) startVerification(pendingEmail, pendingRedirect);
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
      showError('No encontramos una cuenta con ese correo.');
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
    if (newPassword.length < 4) {
      showError('La nueva contraseña necesita al menos 4 caracteres.');
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

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  formSignup.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(formSignup);
    const firstName = data.get('firstName').trim();
    const lastName = data.get('lastName').trim();
    const name = `${firstName} ${lastName}`.trim();
    const rut = formatRut(data.get('rut'));
    const email = data.get('email').trim().toLowerCase();
    const phone = data.get('phone').trim();
    const password = data.get('password');

    if (!firstName || !lastName || !email || password.length < 4) {
      showError('Revisa los datos: el nombre y el apellido no pueden estar vacíos y la contraseña necesita al menos 4 caracteres.');
      return;
    }
    if (!isValidRut(rut)) {
      showError('El RUT ingresado no es válido. Revísalo e intenta de nuevo.');
      return;
    }

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      showError('Ya existe una cuenta con ese correo. Prueba iniciando sesión.');
      return;
    }

    users.push({ name, rut, email, phone, password, onboarded: false, verified: false });
    saveUsers(users);
    startVerification(email, 'onboarding.html');
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

    if (!match.verified) {
      startVerification(email, match.onboarded ? 'dashboard.html' : 'onboarding.html');
      return;
    }

    setSession(email);
    window.location.href = match.onboarded ? 'dashboard.html' : 'onboarding.html';
  });
})();
