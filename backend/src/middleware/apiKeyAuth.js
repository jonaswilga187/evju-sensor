import crypto from 'crypto';

// Konstante-Zeit-Vergleich, um Timing-Angriffe auf den API-Key zu verhindern
const safeCompare = (a, b) => {
  const bufA = Buffer.from(String(a ?? ''), 'utf8');
  const bufB = Buffer.from(String(b ?? ''), 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
};

// Schützt schreibende Endpunkte (Heizungssteuerung, Sensor-Ingestion) mit einem
// gemeinsamen API-Key. Ohne diesen Schutz kann jeder im Internet die Heizung
// schalten oder gefälschte Sensordaten einspielen (siehe docs/05-PLUG-CONTROL.md).
export const requireApiKey = (req, res, next) => {
  const configuredKey = process.env.API_KEY;

  if (!configuredKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ API_KEY ist nicht gesetzt! Schreibzugriffe werden blockiert.');
      return res.status(503).json({
        success: false,
        message: 'Server ist nicht korrekt konfiguriert (API_KEY fehlt)'
      });
    }

    console.warn('⚠️  API_KEY ist nicht gesetzt - Schreibzugriffe sind in dieser Umgebung ungeschützt!');
    return next();
  }

  const providedKey = req.get('X-API-Key');

  if (!safeCompare(providedKey, configuredKey)) {
    return res.status(401).json({
      success: false,
      message: 'Ungültiger oder fehlender API-Key (Header "X-API-Key" erforderlich)'
    });
  }

  next();
};
