const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_TIMEOUT_MS = parseInt(process.env.WEATHER_TIMEOUT_MS || '8000', 10);
const CACHE_TTL_MS = parseInt(process.env.WEATHER_CACHE_TTL_MS || '300000', 10);

let weatherCache = {
  key: null,
  data: null,
  fetchedAt: 0
};

export const get24HourTemperature = async (latitude = 52.62, longitude = 10.08) => {
  const cacheKey = `${latitude},${longitude}`;
  const now = Date.now();
  if (
    weatherCache.key === cacheKey &&
    Array.isArray(weatherCache.data) &&
    weatherCache.data.length > 0 &&
    now - weatherCache.fetchedAt < CACHE_TTL_MS
  ) {
    return weatherCache.data;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = `${OPEN_METEO_BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&past_days=1&timezone=Europe/Berlin`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Open-Meteo Fehler: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data?.hourly?.time || !data?.hourly?.temperature_2m) {
      throw new Error('Ungültiges Datenformat von Open-Meteo API');
    }

    const mapped = data.hourly.time.map((time, index) => ({
      time,
      temperature: data.hourly.temperature_2m[index]
    }));

    weatherCache = {
      key: cacheKey,
      data: mapped,
      fetchedAt: Date.now()
    };

    return mapped;
  } catch (error) {
    // Fallback: letzter erfolgreicher Abruf für denselben Standort
    if (
      weatherCache.key === cacheKey &&
      Array.isArray(weatherCache.data) &&
      weatherCache.data.length > 0
    ) {
      console.warn('⚠️ Open-Meteo fehlgeschlagen, nutze Wetter-Cache:', error.message);
      return weatherCache.data;
    }

    if (error.name === 'AbortError') {
      throw new Error(`Open-Meteo Timeout nach ${DEFAULT_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
