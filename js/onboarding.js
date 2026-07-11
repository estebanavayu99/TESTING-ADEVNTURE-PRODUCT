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
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const firstName = user.name.trim().split(' ')[0];

  if (user.onboarded) {
    document.getElementById('onboardingTitle').textContent = `Actualiza tus datos, ${firstName}`;
    document.querySelector('.onboarding-lead').textContent = 'Ajusta tu edad, con quién sueles viajar y tus gustos cuando quieras — Beto usa esto para seguir afinando tus panoramas.';
    document.querySelector('.auth-submit').textContent = 'Guardar cambios';
    document.getElementById('skipOnboarding').hidden = true;
    document.getElementById('age').value = user.age || '';
    document.getElementById('city').value = user.city || '';
    (user.company || []).forEach((val) => {
      const chip = document.querySelector(`#groupCompany .chip[data-value="${val}"]`);
      if (chip) chip.classList.add('is-selected');
    });
    (user.tastes || []).forEach((val) => {
      const chip = document.querySelector(`#groupTastes .chip[data-value="${val}"]`);
      if (chip) chip.classList.add('is-selected');
    });
    (user.difficulty || []).forEach((val) => {
      const chip = document.querySelector(`#groupDifficulty .chip[data-value="${val}"]`);
      if (chip) chip.classList.add('is-selected');
    });
    (user.budget || []).forEach((val) => {
      const chip = document.querySelector(`#groupBudget .chip[data-value="${val}"]`);
      if (chip) chip.classList.add('is-selected');
    });
    (user.travelDistance || []).forEach((val) => {
      const chip = document.querySelector(`#groupDistance .chip[data-value="${val}"]`);
      if (chip) chip.classList.add('is-selected');
    });
    (user.preferredDay || []).forEach((val) => {
      const chip = document.querySelector(`#groupDay .chip[data-value="${val}"]`);
      if (chip) chip.classList.add('is-selected');
    });
  } else {
    document.getElementById('onboardingTitle').textContent = `¡Bienvenido/a, ${firstName}! Cuéntanos un poco de ti`;
  }

  // Chip toggle groups
  document.querySelectorAll('.chip-group').forEach((group) => {
    group.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => chip.classList.toggle('is-selected'));
    });
  });

  function getSelected(groupId) {
    return Array.from(document.querySelectorAll(`#${groupId} .chip.is-selected`)).map((c) => c.dataset.value);
  }

  function saveProfile(profile) {
    const updated = users.map((u) => (u.email === email ? { ...u, ...profile, onboarded: true } : u));
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    window.location.href = 'dashboard.html';
  }

  const errorBox = document.getElementById('onboardingError');

  document.getElementById('formOnboarding').addEventListener('submit', (e) => {
    e.preventDefault();
    const age = document.getElementById('age').value;
    const company = getSelected('groupCompany');
    const tastes = getSelected('groupTastes');
    const difficulty = getSelected('groupDifficulty');
    const budget = getSelected('groupBudget');
    const travelDistance = getSelected('groupDistance');
    const preferredDay = getSelected('groupDay');
    const city = document.getElementById('city').value.trim();

    if (!age || company.length === 0 || difficulty.length === 0 || budget.length === 0 || travelDistance.length === 0 || preferredDay.length === 0 || !city) {
      errorBox.textContent = 'Todos los campos son obligatorios — así Beto arma algo realmente a tu pinta.';
      errorBox.hidden = false;
      return;
    }
    if (tastes.length < 5) {
      errorBox.textContent = 'Elige al menos 5 tipos de panorama que te gusten.';
      errorBox.hidden = false;
      return;
    }

    saveProfile({ age: Number(age), company, tastes, difficulty, budget, travelDistance, preferredDay, city });
  });

  document.getElementById('skipOnboarding').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
})();
