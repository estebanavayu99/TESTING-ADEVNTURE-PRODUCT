/* Widget de clima/ubicación real en el header de panoramas.html — pedido
 * explícito del usuario: reconocer dónde está el viajero AHORA y qué clima
 * tiene, al lado del mensaje de Darwin. Usa geolocalización real del
 * navegador + Open-Meteo (bot-darwin/js/contexto.js, sin API key). Si el
 * usuario no da permiso de ubicación, o el fetch falla (o este sandbox sin
 * red), el widget se queda oculto — nunca se fabrica un dato falso.
 */
(() => {
  const box = document.getElementById('panoramasWeather');
  const iconEl = document.getElementById('panoramasWeatherIcon');
  const tempEl = document.getElementById('panoramasWeatherTemp');
  if (!box || !window.PickmapDarwin || !window.PickmapDarwin.contexto || !navigator.geolocation) return;

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

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude: lat, longitude: lng } = pos.coords;
        const clima = await window.PickmapDarwin.contexto.clima({ lat, lng });
        iconEl.textContent = iconoDesdeCodigo(clima.weathercode);
        tempEl.textContent = `${Math.round(clima.temp_max)}°C`;
        box.hidden = false;
      } catch { /* sin red o Open-Meteo caído: el widget se queda oculto */ }
    },
    () => { /* permiso denegado: el widget se queda oculto */ },
    { timeout: 8000 },
  );
})();
