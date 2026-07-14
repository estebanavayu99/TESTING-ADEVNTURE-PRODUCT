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

  // "Tu ruta": replica el truco de mapa sin API key que ya usa panoramas.js
  // en el sitio real (https://www.google.com/maps?saddr=...&daddr=...&output=embed
  // en un <iframe>), pero con coordenadas reales lat/lng del catálogo — acá
  // no hace falta el truco de "nombre de calle + comuna" de panoramas.js
  // porque el catálogo de Darwin sí trae lat/lng reales por actividad.
  const rutaEl = document.getElementById('darwinRuta');

  function paradaDesdeActividad(act) {
    return { nombre: act.nombre, lat: act.ubicacion.lat, lng: act.ubicacion.lng };
  }

  function construirParadas(perfil, comboCompleto, plan) {
    const paradas = [];
    if (perfil.origen && perfil.origen.lat !== undefined) {
      paradas.push({ nombre: perfil.origen.nombre || 'Tu ubicación', lat: perfil.origen.lat, lng: perfil.origen.lng });
    }
    if (plan) {
      for (const dia of plan.dias) paradas.push(paradaDesdeActividad(dia.actividad));
    } else if (comboCompleto) {
      for (const act of comboCompleto.actividades) paradas.push(paradaDesdeActividad(act));
    }
    return paradas;
  }

  function legEmbedHTML(a, b) {
    const saddr = encodeURIComponent(`${a.lat},${a.lng}`);
    const daddr = encodeURIComponent(`${b.lat},${b.lng}`);
    const url = `https://www.google.com/maps?saddr=${saddr}&daddr=${daddr}&output=embed`;
    const km = Math.round(D.tools._internas.haversineKm(a, b) * 10) / 10;
    const min = D.tools._internas.estimarTrasladoMin({ ubicacion: a }, { ubicacion: b });
    return `
      <div class="darwin-ruta__leg">
        <p class="darwin-ruta__leg-label">${a.nombre} → ${b.nombre} <span class="darwin-ruta__leg-chip">🚗 ${km} km · ~${min} min</span></p>
        <div class="darwin-ruta__embed">
          <iframe src="${url}" width="100%" height="180" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Ruta de ${a.nombre} a ${b.nombre}"></iframe>
        </div>
      </div>`;
  }

  function mostrarRuta(perfil, debug) {
    // El panel de mapas solo aparece para un plan real de 2+ paradas (combo
    // aceptado o plan multi-día) — igual que en panoramas.js, la
    // recomendación única (1 sola actividad) muestra el dato de distancia
    // como texto, pero no arma el panel de "Tu Ruta" con mapas todavía.
    const esPlanMultiStop = debug.plan || (debug.comboCompleto && debug.comboCompleto.actividades.length >= 2);
    if (!esPlanMultiStop) return;
    const paradas = construirParadas(perfil, debug.comboCompleto, debug.plan);
    if (paradas.length < 2) return; // sin origen real: no hay desde donde trazar el primer tramo
    const legs = paradas.slice(1).map((p, i) => legEmbedHTML(paradas[i], p)).join('');
    rutaEl.innerHTML = `${legs}<p class="darwin-ruta__caption">📍 Vista referencial en Google Maps entre las zonas de tu plan</p>`;
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
    mostrarRuta(perfil, debug);
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
