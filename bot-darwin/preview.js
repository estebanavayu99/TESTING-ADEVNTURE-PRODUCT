(() => {
  const D = window.PickmapDarwin;

  function sessionId() {
    let id = sessionStorage.getItem('pickmap_darwin_preview_session');
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `s${Date.now()}${Math.random()}`;
      sessionStorage.setItem('pickmap_darwin_preview_session', id);
    }
    return id;
  }
  const SID = sessionId();

  const mensajesEl = document.getElementById('darwinMensajes');
  const debugEl = document.getElementById('darwinDebug');
  const form = document.getElementById('darwinForm');
  const input = document.getElementById('darwinInput');

  function agregarMensaje(texto, quien) {
    const el = document.createElement('div');
    el.className = `darwin-msg darwin-msg--${quien}`;
    el.textContent = texto;
    mensajesEl.appendChild(el);
    mensajesEl.scrollTop = mensajesEl.scrollHeight;
  }

  function mostrarDebug(perfil, debug) {
    debugEl.textContent = JSON.stringify({ perfil, debug }, null, 2);
  }

  function enviar(texto) {
    if (!texto.trim()) return;
    agregarMensaje(texto, 'user');
    const { texto: respuesta, perfil, debug } = D.motor.procesarMensaje(SID, texto);
    agregarMensaje(respuesta, 'bot');
    mostrarDebug(perfil, debug);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = input.value;
    input.value = '';
    enviar(texto);
  });

  const QUICK_REPLIES = [
    'Quiero algo de aventura para el sábado',
    'Somos pareja, buscamos algo romántico',
    'Es para nuestro aniversario',
    '¿Cuánto cuesta en total?',
    'Me gusta esa, resérvala',
    'Uy, muy caro para mí',
    'No sé cuál elegir, hay muchas opciones',
  ];
  const quickEl = document.getElementById('darwinQuick');
  for (const texto of QUICK_REPLIES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = texto;
    btn.addEventListener('click', () => enviar(texto));
    quickEl.appendChild(btn);
  }

  document.getElementById('darwinReset').addEventListener('click', () => {
    localStorage.removeItem(`pickmap_darwin_perfil::${SID}`);
    localStorage.removeItem(`pickmap_darwin_eventos::${SID}`);
    sessionStorage.removeItem('pickmap_darwin_preview_session');
    location.reload();
  });

  // Demuestra las tools de Prioridad 2 con red real (clima real vía
  // Open-Meteo). En este sandbox de desarrollo no hay salida a internet,
  // asi que se espera que falle acá — el catch deja el bot funcionando
  // igual, solo sin ese dato de contexto.
  document.getElementById('darwinClima').addEventListener('click', async () => {
    const coords = { lat: -33.4372, lng: -70.6506 }; // Santiago Centro, referencia demo
    try {
      const clima = await D.contexto.clima(coords);
      const perfil = D.motor.cargarPerfil(SID);
      perfil.contexto.clima = clima;
      D.motor.guardarPerfil(SID, perfil);
      agregarMensaje(`🌤️ Clima real actualizado para Santiago Centro: ${clima.temp_min}°–${clima.temp_max}°C, ${Math.round(clima.lluvia_prob * 100)}% de probabilidad de lluvia. Darwin ya lo va a tener en cuenta al armar el próximo combo.`, 'bot');
    } catch (err) {
      agregarMensaje('🌧️ No pude conectarme a internet para revisar el clima real desde acá — es normal en este preview (corre en un ambiente sin salida a internet o con restricciones de seguridad). El resto del bot funciona igual; esta función en particular hay que probarla corriendo el archivo local en tu computador.', 'bot');
    }
  });

  agregarMensaje('¡Hola! Soy Darwin (versión de prueba, motor de reglas). Cuéntame qué panorama buscas.', 'bot');
})();
