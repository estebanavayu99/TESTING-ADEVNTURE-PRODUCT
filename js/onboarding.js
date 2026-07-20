(() => {
  const USERS_KEY = 'pickmap_users';
  const SESSION_KEY = 'pickmap_current_user';
  const S = window.PickmapSupabase;

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

  // Selector oficial de comunas (js/comunas-chile.js) en vez de texto
  // libre — un nombre mal escrito rompía el cálculo de distancia real
  // que hace Darwin (bot-darwin/js/contexto.js).
  const citySelect = document.getElementById('city');
  (window.COMUNAS_CHILE || []).forEach(({ region, comunas }) => {
    const group = document.createElement('optgroup');
    group.label = region;
    comunas.forEach((comuna) => {
      const opt = document.createElement('option');
      opt.value = comuna;
      opt.textContent = comuna;
      group.appendChild(opt);
    });
    citySelect.appendChild(group);
  });

  if (user.onboarded) {
    document.getElementById('onboardingTitle').textContent = `Actualiza tus datos, ${firstName}`;
    document.querySelector('.onboarding-lead').textContent = 'Ajusta tu edad, con quién sueles viajar y tus gustos cuando quieras — Darwin usa esto para seguir afinando tus panoramas.';
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

  async function saveProfile(profile) {
    // Espejo legacy (localStorage) para favoritos.js/invita.js/panoramas.js/
    // dashboard.js, que siguen leyendo pickmap_users directamente.
    const updated = users.map((u) => (u.email === email ? { ...u, ...profile, onboarded: true } : u));
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));

    // Persistencia real: si hay sesión de Supabase, esto es lo que hace
    // que el perfil sobreviva entre dispositivos/navegadores en vez de
    // vivir solo en este localStorage. Si Supabase no está configurado
    // todavía o falla (ej. red), no bloquea el flujo — el espejo legacy
    // ya quedó guardado y el resto del sitio sigue funcionando; solo no
    // habrá persistencia cross-device hasta que Supabase esté disponible.
    if (S && S.configured) {
      try {
        const session = await S.auth.getSession();
        if (session && session.user) {
          await S.profiles.upsert(session.user.id, {
            age: profile.age, city: profile.city, company: profile.company,
            tastes: profile.tastes, difficulty: profile.difficulty, budget: profile.budget,
            travel_distance: profile.travelDistance, preferred_day: profile.preferredDay,
            onboarded: true,
          });
        }
      } catch { /* ver comentario arriba: no bloquea el flujo de onboarding */ }
    }

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
      errorBox.textContent = 'Todos los campos son obligatorios — así Darwin arma algo realmente a tu pinta.';
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
