// Las 13 plantillas de notificación diseñadas en notificaciones-preview.html
// (referencia visual, con copy de ejemplo hardcodeado), portadas acá como
// funciones parametrizadas para poder mandarlas de verdad vía Resend desde
// api/send-notification.js. `shell()` y `BRAND` son una copia fiel de los
// de notificaciones-preview.html — si se retoca el diseño ahí, replicar el
// cambio acá también (o al revés).
const BRAND = {
  navy: '#1E2D31',
  navy2: '#273C42',
  slate: '#5E696C',
  coral: '#F55E61',
  sun: '#F6CD4C',
  green: '#83D061',
  greenInk: '#3f7a2c',
  red: '#AF4345',
  cream: '#FAF7F1',
};

function shell(accent, badgeLabel, preheader, bodyHtml, ctaLabel, ctaHref, opts) {
  opts = opts || {};
  const barStyle = opts.festive
    ? `background: linear-gradient(90deg, ${BRAND.coral} 0%, ${BRAND.coral} 33%, ${BRAND.sun} 33%, ${BRAND.sun} 66%, ${BRAND.green} 66%, ${BRAND.green} 100%);`
    : `background:${accent};`;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
  <style>
    body { margin:0; padding:0; background:${BRAND.cream}; font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif; color:${BRAND.navy}; }
    .wrap { max-width:600px; margin:0 auto; padding:0 0 40px; }
    .accent-bar { height:${opts.festive ? 8 : 6}px; ${barStyle} }
    .header { padding:26px 32px 18px; }
    .logo { font-family: ui-rounded, 'SF Pro Rounded', 'Century Gothic', Futura, system-ui, sans-serif; font-weight:700; font-size:1.3rem; }
    .logo b { color:${BRAND.navy}; } .logo span { color:${BRAND.greenInk}; }
    .badge { display:inline-block; margin-top:14px; padding:5px 12px; border-radius:999px; font-size:0.72rem; font-weight:800; letter-spacing:.02em; background:${accent}22; color:${accent}; }
    .card { background:#fff; margin:0 24px; border-radius:16px; padding:28px 28px 8px; box-shadow:0 10px 30px rgba(30,45,49,0.07); }
    .card h1 { font-size:1.28rem; margin:0 0 14px; line-height:1.3; }
    .card p { font-size:0.95rem; line-height:1.6; color:${BRAND.navy2}; margin:0 0 14px; }
    .preheader { display:none; max-height:0; overflow:hidden; }
    .cta { display:inline-block; margin:6px 0 22px; padding:13px 26px; border-radius:999px; background:${BRAND.coral}; color:#fff !important; font-weight:800; font-size:0.92rem; text-decoration:none; }
    .divider { border:none; border-top:1px solid rgba(30,45,49,0.1); margin:22px 0 18px; }
    .tip { margin:0 0 20px; padding:13px 16px; border-radius:12px; background:${accent}14; border:1px dashed ${accent}66; font-size:0.86rem; line-height:1.55; color:${BRAND.navy2}; }
    .footer { padding:26px 32px 0; font-size:0.76rem; color:${BRAND.slate}; line-height:1.6; }
    .footer a { color:${BRAND.slate}; }
    table.kv td { padding:6px 0; font-size:0.9rem; }
    table.kv td:first-child { color:${BRAND.slate}; width:42%; }
    table.kv td:last-child { font-weight:700; color:${BRAND.navy}; text-align:right; }
  </style></head>
  <body>
    <span class="preheader">${preheader}</span>
    <div class="wrap">
      <div class="accent-bar"></div>
      <div class="header">
        <div class="logo">Pick<b>Map</b><span></span></div>
        ${badgeLabel ? `<div class="badge">${badgeLabel}</div>` : ''}
      </div>
      <div class="card">
        ${bodyHtml}
        ${opts.tip ? `<div class="tip">${opts.tip}</div>` : ''}
        ${ctaLabel ? `<a class="cta" href="${ctaHref || '#'}">${ctaLabel}</a>` : ''}
      </div>
      <div class="footer">
        Pickmap SpA · Santiago, Chile<br>
        Recibiste este correo porque tienes una cuenta activa en Pickmap.
        <a href="#">Gestionar notificaciones</a> · <a href="terminos.html">Términos y Condiciones</a>
      </div>
    </div>
  </body></html>`;
}

function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const PLANTILLAS = {
  // ---------- Vista cliente ----------
  bienvenida: (d) => ({
    subject: `¡Bienvenido a Pickmap, ${esc(d.firstName || '')}! 🎉🧭`,
    html: shell(BRAND.greenInk, 'CUENTA NUEVA',
      'Cuéntanos qué te gusta y Darwin arma tu primer panorama.',
      `<h1>¡Hola, ${esc(d.firstName || '')}! 👋🎉</h1>
       <p>Tu cuenta ya está lista. Ahora falta lo más importante: contarle a <b>Darwin</b>, nuestra IA, quién eres — tu edad, con quién sales y qué te gusta hacer. Es solo una vez.</p>
       <p>Con eso, Darwin cruza tus gustos con el clima y la hora para armarte panoramas que de verdad tienen sentido, sin que tengas que buscar nada.</p>`,
      'Completar mi perfil', d.link || '#',
      { festive: true, tip: '🌱 Dato random: mientras más viajes haces, más feliz eres. Y de pasada, vas acumulando Pick Points para tu próxima experiencia.' }),
  }),

  recuperar: (d) => ({
    subject: 'Restablece tu contraseña de Pickmap',
    html: shell(BRAND.navy2, 'SEGURIDAD',
      'Recibimos una solicitud para restablecer tu contraseña.',
      `<h1>Restablece tu contraseña</h1>
       <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta <b>${esc(d.emailEnmascarado || '')}</b>. Si fuiste tú, crea una nueva contraseña con el botón de abajo.</p>
       <p style="color:${BRAND.slate};font-size:0.85rem;">Este enlace expira en 30 minutos. Si no solicitaste esto, puedes ignorar este correo — tu contraseña actual sigue funcionando.</p>`,
      'Crear nueva contraseña', d.link || '#'),
  }),

  'reserva-confirmada': (d) => ({
    subject: 'Tu reserva está confirmada ✅🎉',
    html: shell(BRAND.greenInk, 'RESERVA CONFIRMADA',
      `${esc(d.actividad)} — ${esc(d.fecha)}.`,
      `<h1>¡Listo, tu panorama está confirmado! 🎉🏕️</h1>
       <p>Aquí el detalle de tu reserva:</p>
       <table class="kv" width="100%">
         <tr><td>Actividad</td><td>${esc(d.actividad)}</td></tr>
         <tr><td>Lugar</td><td>${esc(d.lugar)}</td></tr>
         <tr><td>Fecha</td><td>${esc(d.fecha)}</td></tr>
         <tr><td>Personas</td><td>${esc(d.personas)}</td></tr>
         <tr><td>Total pagado</td><td>${esc(d.total)}</td></tr>
       </table>
       <hr class="divider">
       <p>Te escribiremos un recordatorio un día antes con el clima y lo que debes llevar.</p>`,
      'Ver mi reserva', d.link || '#',
      { festive: true, tip: '🙌 Desde ahora la cuenta regresiva corre por tu cuenta. De organizar todo lo demás, nos encargamos nosotros.' }),
  }),

  'reserva-cancelada-cliente': (d) => ({
    subject: 'Tu reserva fue cancelada',
    html: shell(BRAND.red, 'CANCELACIÓN',
      `Cancelaste tu reserva de ${esc(d.actividad)}.`,
      `<h1>Tu reserva fue cancelada</h1>
       <p>Confirmamos la cancelación de tu reserva de <b>${esc(d.actividad)}</b>, agendada para el ${esc(d.fecha)}.</p>
       <table class="kv" width="100%">
         <tr><td>Monto pagado</td><td>${esc(d.montoPagado)}</td></tr>
         <tr><td>Política aplicada</td><td>${esc(d.politica)}</td></tr>
         <tr><td>Reembolso</td><td>${esc(d.reembolso)}</td></tr>
       </table>
       <p style="color:${BRAND.slate};font-size:0.85rem;">El reembolso se procesa por el mismo medio de pago dentro de los próximos 10 días hábiles.</p>`,
      'Ver mis reservas', d.link || '#'),
  }),

  'recordatorio-cliente': (d) => ({
    subject: '¡Mañana es el día! ⏰🌤️',
    html: shell(BRAND.sun, 'RECORDATORIO',
      `Mañana, ${esc(d.hora)} — ${esc(d.actividad)} en ${esc(d.lugar)}.`,
      `<h1>¡Mañana vives tu panorama! ⏰🌤️</h1>
       <p><b>${esc(d.actividad)}</b> · ${esc(d.lugar)} · ${esc(d.hora)} hrs</p>
       <p>Darwin revisó el clima para ti: <b>${esc(d.clima)}</b>.</p>
       <p><b>Qué llevar:</b> ${esc(d.queLlevar)}</p>`,
      'Ver detalles de la reserva', d.link || '#',
      { festive: true, tip: '🎒 Darwin ya revisó el clima, la ruta y hasta la temperatura de las termas. Tú solo preocúpate de traer la mejor actitud.' }),
  }),

  'post-experiencia': (d) => ({
    subject: '¡Lo lograste! 🎊 ¿Cómo estuvo tu panorama?',
    html: shell(BRAND.coral, 'RESUMEN + RESEÑA',
      `Ganaste ${esc(d.puntosGanados)} Pick Points. Cuéntanos cómo te fue.`,
      `<h1>¡Lo lograste! 🎊⭐</h1>
       <p>Esperamos que lo hayas pasado increíble. Por vivir este panorama, sumaste:</p>
       <table class="kv" width="100%">
         <tr><td>Pick Points ganados</td><td>+${esc(d.puntosGanados)}</td></tr>
         <tr><td>Total acumulado</td><td>${esc(d.puntosTotal)}</td></tr>
       </table>
       <hr class="divider">
       <p>Cuéntanos cómo te fue — ayuda a otros viajeros y a Darwin a recomendarte mejor la próxima vez.</p>`,
      'Dejar mi reseña', d.link || '#',
      { festive: true, tip: '🏆 Sigue así y pronto vas a tener más Pick Points que excusas para no salir el finde.' }),
  }),

  // ---------- Vista empresa ----------
  'nueva-reserva-empresa': (d) => ({
    subject: '🔔 Nueva reserva confirmada',
    html: shell(BRAND.greenInk, 'NUEVA RESERVA',
      `${esc(d.cliente)} reservó ${esc(d.actividad)}.`,
      `<h1>Tienes una reserva nueva 🎉</h1>
       <table class="kv" width="100%">
         <tr><td>Cliente</td><td>${esc(d.cliente)}</td></tr>
         <tr><td>Actividad</td><td>${esc(d.actividad)}</td></tr>
         <tr><td>Fecha</td><td>${esc(d.fecha)}</td></tr>
         <tr><td>Personas</td><td>${esc(d.personas)}</td></tr>
         <tr><td>Monto</td><td>${esc(d.monto)}</td></tr>
       </table>
       <p style="color:${BRAND.slate};font-size:0.85rem;">Revisa el detalle completo y el resto de tu día en tu calendario.</p>`,
      'Ver calendario', d.link || '#'),
  }),

  'reserva-cancelada-empresa': (d) => ({
    subject: 'Reserva cancelada',
    html: shell(BRAND.red, 'CANCELACIÓN',
      `${esc(d.cliente)} canceló su reserva del ${esc(d.fecha)}.`,
      `<h1>Una reserva fue cancelada</h1>
       <table class="kv" width="100%">
         <tr><td>Cliente</td><td>${esc(d.cliente)}</td></tr>
         <tr><td>Actividad</td><td>${esc(d.actividad)}</td></tr>
         <tr><td>Fecha</td><td>${esc(d.fecha)}</td></tr>
       </table>
       <p>Tu disponibilidad para ese horario ya fue actualizada automáticamente.</p>`,
      'Ver calendario', d.link || '#'),
  }),

  'reserva-modificada': (d) => ({
    subject: 'Cambios en una reserva',
    html: shell(BRAND.sun, 'MODIFICACIÓN',
      `${esc(d.cliente)} cambió su reserva de horario.`,
      `<h1>Una reserva fue modificada</h1>
       <p>${esc(d.cliente)} · ${esc(d.actividad)}</p>
       <table class="kv" width="100%">
         <tr><td>Antes</td><td>${esc(d.antes)}</td></tr>
         <tr><td>Ahora</td><td>${esc(d.ahora)}</td></tr>
         <tr><td>Personas</td><td>${esc(d.personas)}</td></tr>
       </table>`,
      'Ver calendario', d.link || '#'),
  }),

  'recordatorio-empresa': (d) => ({
    subject: `Mañana tienes ${esc((d.reservas || []).length)} reservas`,
    html: shell(BRAND.sun, 'RECORDATORIO',
      `Tienes ${esc((d.reservas || []).length)} reservas agendadas para mañana.`,
      `<h1>Mañana tienes ${esc((d.reservas || []).length)} reservas 📅</h1>
       <table class="kv" width="100%">
         ${(d.reservas || []).map((r) => `<tr><td>${esc(r.hora)}</td><td>${esc(r.cliente)} · ${esc(r.actividad)}</td></tr>`).join('')}
       </table>
       <p style="color:${BRAND.slate};font-size:0.85rem;">Revisa el detalle completo de cada una en tu calendario.</p>`,
      'Ver calendario', d.link || '#'),
  }),

  'cliente-completo-experiencia': (d) => ({
    subject: '¿Se realizó la actividad?',
    html: shell(BRAND.coral, 'VALIDACIÓN OPCIONAL',
      `Confirma si ${esc(d.cliente)} asistió a su reserva.`,
      `<h1>¿Se realizó esta actividad?</h1>
       <p>${esc(d.cliente)} tenía agendado <b>${esc(d.actividad)}</b> hoy a las ${esc(d.hora)}.</p>
       <p style="color:${BRAND.slate};font-size:0.85rem;">Confirmar la asistencia es opcional, pero nos ayuda a mantener tu calendario al día.</p>`,
      'Confirmar en el panel', d.link || '#'),
  }),

  'cliente-dejo-resena': (d) => ({
    subject: `Nueva reseña ${'⭐'.repeat(Number(d.estrellas) || 5)}`,
    html: shell(BRAND.greenInk, `RESEÑA · ${esc(d.estrellas)}/5`,
      `${esc(d.cliente)} dejó una reseña de ${esc(d.estrellas)} estrellas.`,
      `<h1>Recibiste una reseña nueva ${'⭐'.repeat(Number(d.estrellas) || 5)}</h1>
       <p style="font-style:italic;">"${esc(d.comentario)}"</p>
       <p style="color:${BRAND.slate};font-size:0.85rem;">— ${esc(d.cliente)}</p>`,
      'Ver en el panel', d.link || '#'),
  }),

  // ---------- Interno (owner de Pickmap) ----------
  // No estaba en el spec original de 13 plantillas (esas son solo
  // cliente/empresa) — instrucción explícita del usuario: avisarle a él
  // (contacto@pickmap.cl) cada vez que una empresa acepta o rechaza una
  // reserva pendiente desde el panel de negocio.
  'accion-empresa-reserva-owner': (d) => {
    const rechazo = d.accion === 'rechazada';
    const verbo = rechazo ? 'rechazó' : 'aceptó';
    return {
      subject: `${rechazo ? '❌' : '✅'} ${esc(d.negocio)} ${verbo} una reserva`,
      html: shell(rechazo ? BRAND.red : BRAND.greenInk, 'PANEL DE NEGOCIO',
        `${esc(d.negocio)} ${verbo} la reserva de ${esc(d.cliente)}.`,
        `<h1>${esc(d.negocio)} ${verbo} una reserva</h1>
       <table class="kv" width="100%">
         <tr><td>Cliente</td><td>${esc(d.cliente)}</td></tr>
         <tr><td>Actividad</td><td>${esc(d.actividad)}</td></tr>
         <tr><td>Fecha</td><td>${esc(d.fecha)}</td></tr>
         <tr><td>Personas</td><td>${esc(d.personas)}</td></tr>
         <tr><td>Monto</td><td>${esc(d.monto)}</td></tr>
       </table>
       ${d.motivo ? `<hr class="divider"><p><b>Motivo del rechazo:</b> ${esc(d.motivo)}</p>` : ''}`),
    };
  },

  'resena-negativa': (d) => ({
    subject: '⚠️ Reseña negativa recibida',
    html: shell(BRAND.red, `ALERTA PRIORITARIA · ${esc(d.estrellas)}/5`,
      `Recibiste una reseña de ${esc(d.estrellas)} estrellas — te recomendamos responder.`,
      `<h1>Recibiste una reseña de ${esc(d.estrellas)}/5 ${'⭐'.repeat(Number(d.estrellas) || 2)}</h1>
       <p style="font-style:italic;">"${esc(d.comentario)}"</p>
       <p style="color:${BRAND.slate};font-size:0.85rem;">— ${esc(d.cliente || 'Cliente reciente')}</p>
       <p><b>Te recomendamos responder dentro de las próximas 24 horas.</b> Una respuesta a tiempo puede cambiar cómo la ven otros viajeros.</p>`,
      'Responder ahora', d.link || '#'),
  }),
};

module.exports = { PLANTILLAS, shell, BRAND };
