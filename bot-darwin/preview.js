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

  async function enviar(texto) {
    if (!texto.trim()) return;
    agregarMensaje(texto, 'user');
    // procesarMensaje es async: el clima del panorama se busca fresco
    // (red real) en cada propuesta, no solo el del cliente al apretar el
    // botón de ubicación.
    const { texto: respuesta, perfil, debug } = await D.motor.procesarMensaje(SID, texto);
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

  // Ubicación real (navigator.geolocation: nativa del navegador, gratis, sin
  // API key) + clima real para esas coordenadas exactas (Open-Meteo, gratis,
  // sin key). Todo esto SI requiere salida a internet real y permiso del
  // navegador — no se puede probar en un ambiente sandbox sin red, pero
  // corre de verdad apenas se abra este archivo en un navegador normal.
  function actualizarClimaPara(coords, nombre) {
    // Esto guarda el clima DE DONDE ESTÁS (secundario) + tu ubicación para
    // distancias reales. El clima del PANORAMA (el que importa para saber
    // qué ropa llevar) se busca aparte, fresco, cuando Darwin arma cada
    // propuesta — por eso acá no se mezcla con lo que se muestra en el combo.
    return D.contexto.clima(coords).then((clima) => {
      const perfil = D.motor.cargarPerfil(SID);
      perfil.origen = { ...coords, nombre };
      perfil.contexto.clima_usuario = clima;
      D.motor.guardarPerfil(SID, perfil);
      agregarMensaje(`📍 Ubicación real detectada (${nombre}). 🌤️ Clima donde estás: ${clima.temp_min}°–${clima.temp_max}°C, ${Math.round(clima.lluvia_prob * 100)}% de probabilidad de lluvia. El clima de cada panorama que te proponga lo busco aparte, fresco, para ese lugar específico.`, 'bot');
    }).catch((err) => {
      const perfil = D.motor.cargarPerfil(SID);
      perfil.origen = { ...coords, nombre };
      D.motor.guardarPerfil(SID, perfil);
      agregarMensaje(`📍 Ubicación real detectada (${nombre}), pero no pude conectarme a internet para revisar el clima real desde acá (${err.message}) — es normal en un ambiente sin salida a internet. La distancia real desde tu ubicación sí va a funcionar igual.`, 'bot');
    });
  }

  document.getElementById('darwinClima').addEventListener('click', () => {
    if (!navigator.geolocation) {
      agregarMensaje('Tu navegador no soporta geolocalización — usando Santiago Centro como referencia.', 'bot');
      actualizarClimaPara({ lat: -33.4372, lng: -70.6506 }, 'Santiago Centro (referencia)');
      return;
    }
    agregarMensaje('📍 Pidiendo permiso para usar tu ubicación real…', 'bot');
    navigator.geolocation.getCurrentPosition(
      (pos) => actualizarClimaPara({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'tu ubicación'),
      (err) => {
        agregarMensaje(`No se pudo obtener tu ubicación real (${err.message}) — revisa el permiso de ubicación del navegador. Mientras tanto uso Santiago Centro como referencia.`, 'bot');
        actualizarClimaPara({ lat: -33.4372, lng: -70.6506 }, 'Santiago Centro (referencia)');
      },
      { timeout: 8000 },
    );
  });

  agregarMensaje('¡Hola! Soy Darwin (versión de prueba, motor de reglas). Cuéntame qué panorama buscas.', 'bot');
})();
