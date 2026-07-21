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

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  });

  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  const firstName = user.name.trim().split(' ')[0];
  const namePart = firstName.slice(0, 4).toUpperCase().padEnd(4, 'X');
  const code = `${namePart}-${hashStr(user.email).toString(36).slice(0, 4).toUpperCase()}`;
  document.getElementById('referralCode').textContent = code;

  const shareText = `¡Únete a PickMap con mi código ${code} y arma panoramas hechos a tu medida! 🌄`;
  const referralLink = `https://pickmap.cl/login.html?tab=signup&ref=${code}`;

  document.getElementById('shareWhatsapp').href =
    `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`;

  const feedback = document.getElementById('copyFeedback');
  function flashFeedback(message) {
    feedback.textContent = message;
    setTimeout(() => { feedback.textContent = ' '; }, 2200);
  }

  document.getElementById('copyCodeBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(code).then(() => flashFeedback('¡Código copiado!'));
  });

  document.getElementById('copyLinkBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(referralLink).then(() => flashFeedback('¡Link copiado!'));
  });
})();
