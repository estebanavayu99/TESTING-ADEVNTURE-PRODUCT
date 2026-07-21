/* Widget de clima + ubicación real en el header de panoramas.html — pedido
 * explícito del usuario: reconocer dónde está el viajero AHORA (clima Y
 * lugar), al lado del mensaje de Darwin. Usa geolocalización real del
 * navegador + Open-Meteo (bot-darwin/js/contexto.js, sin API key) para el
 * clima, y BigDataCloud (reverse-geocode-client, gratis, sin API key,
 * CORS abierto) para traducir lat/lng a un nombre de lugar real. Si el
 * usuario no da permiso de ubicación, o algún fetch falla (o este sandbox
 * sin red), ese widget en particular se queda oculto — nunca se fabrica un
 * dato falso de clima ni de ubicación.
 */
(() => {
  const weatherBox = document.getElementById('panoramasWeather');
  const weatherIconEl = document.getElementById('panoramasWeatherIcon');
  const weatherTempEl = document.getElementById('panoramasWeatherTemp');
  const locationBox = document.getElementById('panoramasLocation');
  const locationNameEl = document.getElementById('panoramasLocationName');
  if (!weatherBox || !locationBox || !navigator.geolocation) return;

  // Mismos códigos WMO que ya usa contexto.js para detectar "evento_severo" —
  // acá solo se traducen a un ícono, sin duplicar esa lógica de severidad.
  function iconoDesdeCodigo(codigo) {
    if ([0].includes(codigo)) return '☀️';
    if ([1, 2].includes(codigo)) return '🌤️';
    if ([3].includes(codigo)) return '☁️';
    if ([45, 48].includes(codigo)) return '🌫️';
    if ([51, 53, 55, 56, 57, 61, 63, 66, 80, 81].includes(codigo)) return '🌦️';
    if ([65, 82].includes(codigo)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(codigo)) return '❄️';
    if ([95, 96, 99].includes(codigo)) return '⛈️';
    return '🌤️';
  }

  async function mostrarClima(lat, lng) {
    if (!window.PickmapDarwin || !window.PickmapDarwin.contexto) return;
    try {
      const clima = await window.PickmapDarwin.contexto.clima({ lat, lng });
      weatherIconEl.textContent = iconoDesdeCodigo(clima.weathercode);
      weatherTempEl.textContent = `${Math.round(clima.temp_max)}°C`;
      weatherBox.hidden = false;
    } catch { /* sin red o Open-Meteo caído: el widget se queda oculto */ }
  }

  async function mostrarUbicacion(lat, lng) {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`);
      if (!res.ok) throw new Error(`reverse-geocode respondió ${res.status}`);
      const data = await res.json();
      const lugar = data.city || data.locality || data.principalSubdivision;
      if (!lugar) return;
      locationNameEl.textContent = lugar;
      locationBox.hidden = false;
    } catch { /* sin red o servicio caído: el widget se queda oculto */ }
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      mostrarClima(lat, lng);
      mostrarUbicacion(lat, lng);
    },
    () => { /* permiso denegado: ambos widgets se quedan ocultos */ },
    { timeout: 8000 },
  );
})();
