import { verifySessionToken } from '../utils/sessionToken.js';

// Name des Session-Cookies, den authController beim Login setzt.
export const SESSION_COOKIE_NAME = 'dashboard_session';

// Express hat ohne das "cookie-parser"-Paket kein req.cookies - der Cookie-
// Header wird hier bewusst selbst geparst, um keine zusätzliche Dependency
// für diese eine Zeile einzuführen.
const parseCookies = (header) => {
  const cookies = {};
  if (!header) return cookies;

  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (!key) return;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  });

  return cookies;
};

// Schützt die lesenden Dashboard-Endpunkte (ersetzt den bisherigen nginx
// Basic-Auth-Dialog). Von ESP32-Geräten genutzte Endpunkte (z.B.
// GET /api/plug/:plugId/desired) bleiben bewusst davon ausgenommen - die
// Geräte haben keine Browser-Session, sondern nutzen ggf. den API-Key.
export const requireSession = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];

  if (!verifySessionToken(token)) {
    return res.status(401).json({ success: false, message: 'Bitte zuerst einloggen' });
  }

  next();
};
