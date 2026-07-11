(() => {
  const fab = document.getElementById('betoChatFab');
  const panel = document.getElementById('betoChatPanel');
  const badge = document.getElementById('betoChatBadge');
  const closeBtn = document.getElementById('betoChatClose');
  const messages = document.getElementById('betoChatMessages');
  const form = document.getElementById('betoChatForm');
  const input = document.getElementById('betoChatInput');
  if (!fab || !panel) return;

  const RULES = [
    { test: /precio|costo|cuesta|vale|caro|barato/, replies: [
      'Los precios varían según el panorama, pero la mayoría parte desde los $10.000. Si creas tu cuenta te muestro opciones ajustadas a tu presupuesto 😊',
    ] },
    { test: /reserv/, replies: [
      'Para reservar solo entra a Panoramas, elige el que más te guste y sigue los pasos — yo armo el itinerario automáticamente con horarios y todo.',
    ] },
    { test: /cancel|cambi.*fecha|modific/, replies: [
      'Puedes cancelar o modificar tu reserva desde "Mi cuenta → Reservas". Si es un caso especial, cuéntame más y te oriento.',
    ] },
    { test: /punto|pick points|canje/, replies: [
      'Los Pick Points se acumulan con cada check-in y reseña, y los canjeas en tu próxima reserva. ¡Mientras más vives, más ganas! ⭐',
    ] },
    { test: /empresa|aliad|negocio/, replies: [
      'Si tienes un negocio turístico puedes sumarte como aliado Pickmap: te traemos clientes y solo pagas comisión por reserva confirmada, sin publicidad extra. Mira la sección "Para empresas" 👆',
    ] },
    { test: /clima|lluv|sol|tiempo/, replies: [
      'Reviso el clima en tiempo real para que tus panoramas siempre tengan sentido según el pronóstico del momento.',
    ] },
    { test: /humano|persona real|hablar con alguien|soporte/, replies: [
      'Por ahora soy 100% IA 🤖, pero estamos sumando soporte humano pronto. Mientras tanto, ¡pregúntame lo que quieras!',
    ] },
    { test: /hola|buenas|hey|holi/, replies: [
      '¡Hola! 👋 Soy Beto, la IA de Pickmap. ¿En qué te ayudo?',
    ] },
    { test: /gracias|genial|excelente|perfecto/, replies: [
      '¡De nada! Que tengas un panorama increíble 🎉',
    ] },
    { test: /como funciona|qué es pickmap|que es pickmap/, replies: [
      'Cuéntame tu edad, con quién sales y tus gustos una vez, y yo armo panoramas listos —con horario y todo— cruzando eso con el clima y la hora. Tú solo apareces.',
    ] },
  ];

  const FALLBACKS = [
    'Buena pregunta 🤖 todavía estoy aprendiendo esa parte, pero puedo ayudarte con reservas, precios, Pick Points o cómo funciona Pickmap.',
    'Mmm no estoy 100% seguro de eso, pero cuéntame si quieres saber sobre reservas, panoramas o cómo sumar Pick Points 😊',
    'No manejo ese detalle todavía, pero mientras tanto puedo contarte cómo armo tus panoramas o cómo funciona la alianza para empresas.',
  ];

  function botReply(text) {
    for (const rule of RULES) {
      if (rule.test.test(text)) {
        return rule.replies[Math.floor(Math.random() * rule.replies.length)];
      }
    }
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }

  function addMessage(text, who) {
    const el = document.createElement('div');
    el.className = `beto-chat__msg beto-chat__msg--${who}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'beto-chat__msg beto-chat__msg--bot beto-chat__msg--typing';
    el.innerHTML = '<span class="beto-chat__typing-dot"></span><span class="beto-chat__typing-dot"></span><span class="beto-chat__typing-dot"></span>';
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  let opened = false;
  function openChat() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    badge.hidden = true;
    if (!opened) {
      opened = true;
      addMessage('¡Hola! Soy Beto 🤖, la IA de Pickmap. Pregúntame lo que quieras sobre panoramas, reservas, Pick Points o cómo sumarte como aliado.', 'bot');
    }
    input.focus();
  }

  function closeChat() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
  }

  fab.addEventListener('click', () => {
    if (panel.hidden) openChat();
    else closeChat();
  });
  closeBtn.addEventListener('click', closeChat);

  /* ---------- Teaser bubble: greets on every visit, dismissable ---------- */
  const teaser = document.getElementById('betoChatTeaser');
  const teaserClose = document.getElementById('betoChatTeaserClose');
  if (teaser) {
    function hideTeaser() { teaser.hidden = true; }
    setTimeout(() => {
      if (panel.hidden) teaser.hidden = false;
    }, 1600);
    teaserClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideTeaser();
    });
    fab.addEventListener('click', hideTeaser);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';

    const typingEl = showTyping();
    const delay = 600 + Math.random() * 700;
    setTimeout(() => {
      typingEl.remove();
      addMessage(botReply(text), 'bot');
    }, delay);
  });
})();
