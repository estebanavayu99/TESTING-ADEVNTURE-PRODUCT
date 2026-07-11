(() => {
  const N = window.PickmapNegocio;
  const { fmtMoney, fmtDate } = N;
  const referrals = N.getReferrals();
  const code = N.getReferralCode();

  document.getElementById('referralCode').textContent = code;

  const invited = referrals.length;
  const active = referrals.filter((r) => r.estado === 'activo').length;
  const earned = referrals.reduce((s, r) => s + r.recompensa, 0);

  document.getElementById('referralInvited').textContent = invited;
  document.getElementById('referralActive').textContent = active;
  document.getElementById('referralEarned').textContent = fmtMoney(earned);

  const copyBtn = document.getElementById('referralCopyBtn');
  const copyNote = document.getElementById('referralCopyNote');
  copyBtn.addEventListener('click', () => {
    const link = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}login-empresa.html?ref=${code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        copyNote.textContent = '¡Copiado! Compártelo con el negocio que quieras invitar.';
      }).catch(() => {
        copyNote.textContent = link;
      });
    } else {
      copyNote.textContent = link;
    }
  });

  const list = document.getElementById('referralList');
  if (!referrals.length) {
    list.innerHTML = '<li class="biz-res-list__empty">Todavía no has invitado a ningún negocio.</li>';
  } else {
    list.innerHTML = referrals.map((r) => `
      <li class="biz-referral">
        <span class="biz-referral__icon">🏕️</span>
        <div class="biz-referral__info">
          <p class="biz-referral__name">${r.nombre}</p>
          <p class="biz-referral__meta">Invitado el ${fmtDate(r.fecha)}</p>
        </div>
        <span class="biz-referral__amt">${r.recompensa ? fmtMoney(r.recompensa) : '—'}</span>
        <span class="biz-res__status biz-res__status--${r.estado === 'activo' ? 'confirmada' : 'pendiente'}">${r.estado}</span>
      </li>
    `).join('');
  }
})();
