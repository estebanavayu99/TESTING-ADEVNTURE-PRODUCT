// Clima real vía Open-Meteo (gratis, sin API key — misma elección ya
// tomada en bot-darwin/js/contexto.js, ver CLAUDE.md), con clima_cache
// como caché de lectura antes de golpear la API externa.
//
// Reglas de vigencia (pedidas por el usuario):
//   fuente = 'pronostico'           -> válido por 6 horas
//   fuente = 'historico_estacional' -> válido por 30 días
const supabase = require('./supabaseRest');

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

const VIGENCIA_MS = {
  pronostico: 6 * 60 * 60 * 1000,
  historico_estacional: 30 * 24 * 60 * 60 * 1000,
};

function vigente(actualizadoEn, fuente) {
  if (!actualizadoEn) return false;
  const edadMs = Date.now() - new Date(actualizadoEn).getTime();
  return edadMs < (VIGENCIA_MS[fuente] || 0);
}

async function buscarEnCache(destino, mesReferencia, fuente) {
  const filas = await supabase.select('clima_cache', {
    select: '*',
    destino: `eq.${destino}`,
    mes_referencia: `eq.${mesReferencia}`,
    fuente: `eq.${fuente}`,
    limit: '1',
  });
  return filas && filas[0] ? filas[0] : null;
}

// fuente: 'pronostico' — clima real de hoy/próximos días para un lat/lng.
async function climaAhora({ destino, lat, lng }) {
  const mesReferencia = new Date().getMonth() + 1;
  const cacheado = await buscarEnCache(destino, mesReferencia, 'pronostico');
  if (cacheado && vigente(cacheado.actualizado_en, 'pronostico')) return cacheado;

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    timezone: 'auto',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode',
    forecast_days: '1',
  });
  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo forecast respondió ${res.status}`);
  const data = await res.json();
  const fila = {
    destino,
    lat,
    lng,
    mes_referencia: mesReferencia,
    temp_promedio: promedio([data.daily.temperature_2m_max[0], data.daily.temperature_2m_min[0]]),
    condicion: codigoATexto(data.daily.weathercode[0]),
    probabilidad_lluvia: (data.daily.precipitation_probability_max[0] ?? 0) / 100,
    fuente: 'pronostico',
    dias_anticipacion: 0,
  };
  const guardado = await supabase.upsert('clima_cache', [fila], { onConflict: 'destino,mes_referencia,fuente' });
  return guardado[0];
}

// fuente: 'historico_estacional' — promedio real de los últimos 5 años
// para ese mes en ese destino, usado para viajes futuros donde no hay
// pronóstico real todavía (Open-Meteo solo pronostica ~16 días).
async function climaHistoricoEstacional({ destino, lat, lng, mesReferencia }) {
  const cacheado = await buscarEnCache(destino, mesReferencia, 'historico_estacional');
  if (cacheado && vigente(cacheado.actualizado_en, 'historico_estacional')) return cacheado;

  const anioActual = new Date().getFullYear();
  const diasDelMes = new Date(anioActual, mesReferencia, 0).getDate();
  const mesStr = String(mesReferencia).padStart(2, '0');
  const diaFinal = String(diasDelMes).padStart(2, '0');

  const tempMaxes = [];
  const tempMins = [];
  const diasConLluvia = [];
  const totalDias = [];

  for (let i = 1; i <= 5; i++) {
    const anio = anioActual - i;
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      timezone: 'auto',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
      start_date: `${anio}-${mesStr}-01`,
      end_date: `${anio}-${mesStr}-${diaFinal}`,
    });
    const res = await fetch(`${ARCHIVE_URL}?${params.toString()}`);
    if (!res.ok) continue; // un año fallido no debería tumbar el promedio completo
    const data = await res.json();
    if (!data.daily) continue;
    tempMaxes.push(...data.daily.temperature_2m_max.filter((v) => v != null));
    tempMins.push(...data.daily.temperature_2m_min.filter((v) => v != null));
    const lluvias = data.daily.precipitation_sum.filter((v) => v != null);
    diasConLluvia.push(lluvias.filter((mm) => mm > 1).length);
    totalDias.push(lluvias.length);
  }

  if (!tempMaxes.length) throw new Error('climaHistoricoEstacional: Open-Meteo archive sin datos utilizables');

  const fila = {
    destino,
    lat,
    lng,
    mes_referencia: mesReferencia,
    temp_promedio: promedio([...tempMaxes, ...tempMins]),
    condicion: null, // no hay weathercode agregado confiable en el promedio de 5 años
    probabilidad_lluvia: promedio(totalDias.map((total, i) => (total ? diasConLluvia[i] / total : 0))),
    fuente: 'historico_estacional',
    dias_anticipacion: null,
  };
  const guardado = await supabase.upsert('clima_cache', [fila], { onConflict: 'destino,mes_referencia,fuente' });
  return guardado[0];
}

function promedio(valores) {
  const filtrados = valores.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!filtrados.length) return null;
  return Math.round((filtrados.reduce((a, b) => a + b, 0) / filtrados.length) * 10) / 10;
}

function codigoATexto(weathercode) {
  if ([0].includes(weathercode)) return 'despejado';
  if ([1, 2, 3].includes(weathercode)) return 'parcialmente_nublado';
  if ([45, 48].includes(weathercode)) return 'niebla';
  if ([51, 53, 55, 56, 57].includes(weathercode)) return 'llovizna';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weathercode)) return 'lluvia';
  if ([71, 73, 75, 77, 85, 86].includes(weathercode)) return 'nieve';
  if ([95, 96, 99].includes(weathercode)) return 'tormenta';
  return 'desconocido';
}

module.exports = { climaAhora, climaHistoricoEstacional };
