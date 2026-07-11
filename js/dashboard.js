(() => {
  const USERS_KEY = 'pickmap_users';
  const SESSION_KEY = 'pickmap_current_user';

  const email = localStorage.getItem(SESSION_KEY);
  if (!email) {
    window.location.href = 'login.html';
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find((u) => u.email === email);

  if (!user || !user.onboarded) {
    window.location.href = 'onboarding.html';
    return;
  }

  const firstName = user.name.trim().split(' ')[0];
  document.getElementById('greetingName').textContent = `Hola, ${firstName} 👋`;

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

  const TASTE_LABELS = {
    naturaleza: 'la naturaleza y la aventura',
    gastronomia: 'la buena mesa',
    relax: 'el relax y el spa',
    vidanocturna: 'la vida nocturna',
    cultura: 'la cultura y los tours',
    extremo: 'los deportes extremos',
  };
  const subEl = document.querySelector('.dash__sub');
  if (subEl && user.tastes && user.tastes.length) {
    const likes = user.tastes.map((t) => TASTE_LABELS[t]).filter(Boolean);
    if (likes.length) {
      const likesText = likes.length > 1
        ? `${likes.slice(0, -1).join(', ')} y ${likes[likes.length - 1]}`
        : likes[0];
      subEl.textContent = `Como te gusta ${likesText}, así arma Pickmap tu semana.`;
    }
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  });

  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    const [existingFirst, ...existingRest] = (user.name || '').trim().split(' ');
    document.getElementById('settingsFirstName').value = existingFirst || '';
    document.getElementById('settingsLastName').value = existingRest.join(' ');
    document.getElementById('settingsRut').value = user.rut || '';
    document.getElementById('settingsEmail').value = user.email || '';
    document.getElementById('settingsPhone').value = user.phone || '';

    document.getElementById('settingsRut').addEventListener('blur', (e) => {
      if (e.target.value.trim()) e.target.value = formatRut(e.target.value);
    });

    const feedback = document.getElementById('settingsFeedback');

    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newFirstName = document.getElementById('settingsFirstName').value.trim();
      const newLastName = document.getElementById('settingsLastName').value.trim();
      const newRut = formatRut(document.getElementById('settingsRut').value);
      const newEmail = document.getElementById('settingsEmail').value.trim().toLowerCase();
      const newPhone = document.getElementById('settingsPhone').value.trim();
      const newName = `${newFirstName} ${newLastName}`.trim();

      if (!newFirstName || !newLastName || !newEmail) {
        feedback.textContent = 'El nombre, el apellido y el correo no pueden estar vacíos.';
        feedback.classList.add('is-error');
        return;
      }
      if (!isValidRut(newRut)) {
        feedback.textContent = 'El RUT ingresado no es válido. Revísalo e intenta de nuevo.';
        feedback.classList.add('is-error');
        return;
      }

      const allUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const emailTaken = allUsers.some((u) => u.email === newEmail && u.email !== user.email);
      if (emailTaken) {
        feedback.textContent = 'Ese correo ya está en uso por otra cuenta.';
        feedback.classList.add('is-error');
        return;
      }

      const idx = allUsers.findIndex((u) => u.email === user.email);
      if (idx !== -1) {
        allUsers[idx] = { ...allUsers[idx], name: newName, rut: newRut, email: newEmail, phone: newPhone };
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
        localStorage.setItem(SESSION_KEY, newEmail);
        user.name = newName;
        user.rut = newRut;
        user.email = newEmail;
        user.phone = newPhone;
      }

      feedback.classList.remove('is-error');
      feedback.textContent = '¡Solicitud enviada! Actualizaremos tus datos en breve.';
      document.getElementById('greetingName').textContent = `Hola, ${newFirstName} 👋`;
    });
  }

  const counter = document.querySelector('.count-up');
  if (counter) {
    const target = parseInt(counter.dataset.target, 10);
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(eased * target).toLocaleString('es-CL');
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    const NEXT_REWARD = 1500;
    const pct = Math.min(100, Math.round((target / NEXT_REWARD) * 100));
    const remaining = Math.max(0, NEXT_REWARD - target);
    const barFill = document.querySelector('.beto-bar__fill');
    const marker = document.querySelector('.beto-bar__marker');
    const caption = document.getElementById('progressCaption');
    if (barFill) requestAnimationFrame(() => { barFill.style.width = pct + '%'; });
    if (marker) requestAnimationFrame(() => { marker.style.left = pct + '%'; });
    if (caption) {
      caption.textContent = remaining > 0
        ? `Te faltan ${remaining.toLocaleString('es-CL')} Pick Points para tu próximo premio 🎁`
        : '¡Ya puedes canjear tu próximo premio! 🎁';
    }
  }
})();
