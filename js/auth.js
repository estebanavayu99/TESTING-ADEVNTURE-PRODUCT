(() => {
  const USERS_KEY = 'pickmap_users';
  const SESSION_KEY = 'pickmap_current_user';

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
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');

    if (!name || !email || password.length < 4) {
      showError('Revisa los datos: el nombre no puede estar vacío y la contraseña necesita al menos 4 caracteres.');
      return;
    }

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      showError('Ya existe una cuenta con ese correo. Prueba iniciando sesión.');
      return;
    }

    users.push({ name, email, password, onboarded: false });
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
