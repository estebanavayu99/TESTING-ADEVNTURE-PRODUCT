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
  const formLogin = document.getElementById('formLogin');
  const formSignup = document.getElementById('formSignup');
  const errorBox = document.getElementById('authError');

  function showForm(which) {
    const isLogin = which === 'login';
    formLogin.hidden = !isLogin;
    formSignup.hidden = isLogin;
    tabLogin.classList.toggle('is-active', isLogin);
    tabSignup.classList.toggle('is-active', !isLogin);
    tabLogin.setAttribute('aria-selected', String(isLogin));
    tabSignup.setAttribute('aria-selected', String(!isLogin));
    errorBox.hidden = true;
  }

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
    const name = data.get('name').trim();
    const rut = formatRut(data.get('rut'));
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');

    if (!name || !email || password.length < 4) {
      showError('Revisa los datos: el nombre no puede estar vacío y la contraseña necesita al menos 4 caracteres.');
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

    users.push({ name, rut, email, password, onboarded: false });
    saveUsers(users);
    setSession(email);
    window.location.href = 'onboarding.html';
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
    window.location.href = match.onboarded ? 'dashboard.html' : 'onboarding.html';
  });
})();
