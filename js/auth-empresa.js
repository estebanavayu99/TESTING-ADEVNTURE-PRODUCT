(() => {
  const USERS_KEY = 'pickmap_business_users';
  const SESSION_KEY = 'pickmap_business_session';

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

  // Already logged in as business: skip straight to the panel.
  if (localStorage.getItem(SESSION_KEY)) {
    window.location.href = 'negocio.html';
    return;
  }

  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const authTabs = document.querySelector('.auth-tabs');
  const formLogin = document.getElementById('formLogin');
  const formSignup = document.getElementById('formSignup');
  const formVerify = document.getElementById('formVerify');
  const errorBox = document.getElementById('authError');
  const kicker = document.getElementById('authKicker');

  function showForm(which) {
    const isLogin = which === 'login';
    const isVerify = which === 'verify';
    formLogin.hidden = which !== 'login';
    formSignup.hidden = which !== 'signup';
    formVerify.hidden = !isVerify;
    authTabs.hidden = isVerify;
    if (!isVerify) {
      tabLogin.classList.toggle('is-active', isLogin);
      tabSignup.classList.toggle('is-active', !isLogin);
      tabLogin.setAttribute('aria-selected', String(isLogin));
      tabSignup.setAttribute('aria-selected', String(!isLogin));
      kicker.textContent = isLogin ? '🏢 Iniciando sesión como empresa' : '🏢 Creando tu cuenta de empresa';
    } else {
      kicker.textContent = '🏢 Verifica tu correo de empresa';
    }
    errorBox.hidden = true;
  }

  function genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

  let pendingEmail = null;

  function startVerification(email) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) return;
    const code = genCode();
    users[idx].verificationCode = code;
    saveUsers(users);
    pendingEmail = email;
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
    window.location.href = 'negocio.html';
  });

  document.getElementById('resendCode').addEventListener('click', () => {
    if (pendingEmail) startVerification(pendingEmail);
  });
  document.getElementById('verifyBack').addEventListener('click', () => showForm('login'));

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
    const repName = data.get('repName').trim();
    const repRut = formatRut(data.get('repRut'));
    const bizName = data.get('bizName').trim();
    const legalName = data.get('legalName').trim();
    const bizRut = formatRut(data.get('bizRut'));
    const address = data.get('address').trim();
    const availability = data.get('availability');
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');

    if (!repName || !bizName || !legalName || !address || !availability || !email || password.length < 4) {
      showError('Revisa que todos los campos estén completos y que la contraseña tenga al menos 4 caracteres.');
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

    users.push({ repName, repRut, bizName, legalName, bizRut, address, availability, email, password, verified: false });
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

    if (!match.verified) {
      startVerification(email);
      return;
    }

    setSession(email);
    window.location.href = 'negocio.html';
  });
})();
