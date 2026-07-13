/* PickMap — Darwin — Tools de Prioridad 2 (contexto fisico, "ve el mundo real")
 *
 * clima/hora_solar -> Open-Meteo (gratis, sin API key, CORS abierto).
 * calcular_ruta/optimizar_itinerario (real) -> OSRM demo publico (gratis,
 * sin key). Estas SI hacen fetch de verdad: no se pueden probar dentro de
 * este sandbox (sin salida a internet), pero funcionan apenas el bot
 * corra en un navegador con red — que es como se prueba/inyecta despues.
 * Cuando el negocio quiera SLA/soporte propio, basta con cambiar la URL
 * de estas dos funciones por OpenWeather/Google Directions/Mapbox.
 *
 * hora_local no necesita red (calculo con Intl + zona horaria).
 * Todo lo que depende de red tiene un fallback sincrono sin red (haversine)
 * para que el bot nunca se caiga por un fetch que falla.
 */
(() => {
  const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
  const OSRM_BASE = 'https://router.project-osrm.org';

  function severoDesdeCodigoOMS(weathercode, vientoKmh) {
    const codigosTormenta = [95, 96, 99];
    const lluviaFuerte = [65, 82];
    if (codigosTormenta.includes(weathercode)) return true;
    if (lluviaFuerte.includes(weathercode)) return true;
    if ((vientoKmh || 0) >= 60) return true;
    return false;
  }

  async function clima({ lat, lng, fecha }) {
    const params = new URLSearchParams({
      latitude: lat, longitude: lng, timezone: 'auto',
      daily: 'precipitation_probability_max,temperature_2m_max,temperature_2m_min,windspeed_10m_max,weathercode',
    });
    if (fecha) { params.set('start_date', fecha); params.set('end_date', fecha); }
    const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`clima: Open-Meteo respondio ${res.status}`);
    const data = await res.json();
    const i = 0;
    const weathercode = data.daily.weathercode[i];
    const vientoKmh = data.daily.windspeed_10m_max[i];
    return {
      fecha: data.daily.time[i],
      temp_max: data.daily.temperature_2m_max[i],
      temp_min: data.daily.temperature_2m_min[i],
      lluvia_prob: (data.daily.precipitation_probability_max[i] ?? 0) / 100,
      viento_kmh: vientoKmh,
      weathercode,
      evento_severo: severoDesdeCodigoOMS(weathercode, vientoKmh),
    };
  }

  async function horaSolar({ lat, lng, fecha }) {
    const params = new URLSearchParams({ latitude: lat, longitude: lng, timezone: 'auto', daily: 'sunrise,sunset' });
    if (fecha) { params.set('start_date', fecha); params.set('end_date', fecha); }
    const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`hora_solar: Open-Meteo respondio ${res.status}`);
    const data = await res.json();
    const amanecer = data.daily.sunrise[0];
    const atardecer = data.daily.sunset[0];
    const horasLuz = (new Date(atardecer) - new Date(amanecer)) / 3600000;
    return { amanecer, atardecer, horas_luz: Math.round(horasLuz * 10) / 10 };
  }

  function horaLocal(timeZone = 'America/Santiago', ahora = new Date()) {
    const fmtHora = new Intl.DateTimeFormat('es-CL', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
    const fmtDia = new Intl.DateTimeFormat('es-CL', { timeZone, weekday: 'long' });
    return { hora: fmtHora.format(ahora), dia_semana: fmtDia.format(ahora), zona_horaria: timeZone };
  }

  async function calcularRuta(origen, destino, perfil = 'driving') {
    const url = `${OSRM_BASE}/route/v1/${perfil}/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`calcular_ruta: OSRM respondio ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || !data.routes.length) throw new Error('calcular_ruta: sin ruta encontrada');
    const ruta = data.routes[0];
    return { duracion_min: Math.round(ruta.duration / 60), distancia_km: Math.round((ruta.distance / 1000) * 10) / 10 };
  }

  async function matrizDuraciones(paradas, perfil = 'driving') {
    const coords = paradas.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_BASE}/table/v1/${perfil}/${coords}?annotations=duration`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`optimizar_itinerario: OSRM table respondio ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error('optimizar_itinerario: OSRM table sin resultado');
    return data.durations; // matriz [i][j] en segundos
  }

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function costoTotal(orden, matriz) {
    let total = 0;
    for (let i = 0; i < orden.length - 1; i++) total += matriz[orden[i]][orden[i + 1]];
    return total;
  }

  function vecinoMasCercano(matriz, nParadas) {
    const visitado = new Array(nParadas).fill(false);
    const orden = [0];
    visitado[0] = true;
    for (let paso = 1; paso < nParadas; paso++) {
      const actual = orden[orden.length - 1];
      let mejor = -1;
      let mejorCosto = Infinity;
      for (let j = 0; j < nParadas; j++) {
        if (!visitado[j] && matriz[actual][j] < mejorCosto) { mejorCosto = matriz[actual][j]; mejor = j; }
      }
      orden.push(mejor);
      visitado[mejor] = true;
    }
    return orden;
  }

  function mejorar2opt(orden, matriz) {
    let mejorOrden = orden.slice();
    let mejorCosto = costoTotal(mejorOrden, matriz);
    let mejorado = true;
    while (mejorado) {
      mejorado = false;
      for (let i = 1; i < mejorOrden.length - 2; i++) {
        for (let k = i + 1; k < mejorOrden.length - 1; k++) {
          const candidato = mejorOrden.slice(0, i).concat(mejorOrden.slice(i, k + 1).reverse(), mejorOrden.slice(k + 1));
          const costo = costoTotal(candidato, matriz);
          if (costo < mejorCosto) { mejorOrden = candidato; mejorCosto = costo; mejorado = true; }
        }
      }
    }
    return { orden: mejorOrden, costo: mejorCosto };
  }

  // Version sin red: siempre disponible, usa distancia en linea recta.
  function optimizarItinerario(paradas) {
    if (paradas.length <= 2) return { orden: paradas.map((_, i) => i), paradas_ordenadas: paradas };
    const n = paradas.length;
    const matriz = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => haversineKm(paradas[i], paradas[j])));
    const inicial = vecinoMasCercano(matriz, n);
    const { orden } = mejorar2opt(inicial, matriz);
    return { orden, paradas_ordenadas: orden.map((i) => paradas[i]) };
  }

  // Version con red (duraciones reales OSRM); si falla, cae a la de arriba.
  async function optimizarItinerarioReal(paradas, perfil = 'driving') {
    if (paradas.length <= 2) return { orden: paradas.map((_, i) => i), paradas_ordenadas: paradas, fuente: 'trivial' };
    try {
      const matriz = await matrizDuraciones(paradas, perfil);
      const inicial = vecinoMasCercano(matriz, paradas.length);
      const { orden } = mejorar2opt(inicial, matriz);
      return { orden, paradas_ordenadas: orden.map((i) => paradas[i]), fuente: 'osrm' };
    } catch (err) {
      const fallback = optimizarItinerario(paradas);
      return { ...fallback, fuente: 'fallback_haversine', error: String(err.message || err) };
    }
  }

  window.PickmapDarwin = window.PickmapDarwin || {};
  window.PickmapDarwin.contexto = {
    clima, horaSolar, horaLocal, calcularRuta,
    optimizarItinerario, optimizarItinerarioReal,
    _internas: { severoDesdeCodigoOMS, haversineKm },
  };
})();
