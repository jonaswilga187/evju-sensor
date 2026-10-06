import crypto from 'crypto';
import { createSessionToken, SESSION_TTL_MS } from '../utils/sessionToken.js';
import { SESSION_COOKIE_NAME } from '../middleware/requireSession.js';

// Konstante-Zeit-Vergleich wie in apiKeyAuth.js - verhindert Timing-Angriffe
// auf Benutzername/Passwort.
const safeCompare = (a, b) => {
  const bufA = Buffer.from(String(a ?? ''), 'utf8');
  const bufB = Buffer.from(String(b ?? ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const cookieOptions = () => ({
  httpOnly: true,
  // Frontend (sensor.wilga.tech) und Backend (sensor-api.wilga.tech) sind
  // unterschiedliche Subdomains -> aus Cookie-Sicht cross-site. Das erfordert
  // SameSite=None + Secure (nur über HTTPS, was in Produktion immer gilt).
  // Lokal (http://localhost) funktioniert SameSite=None+Secure nicht
  // zuverlässig, daher dort Lax ohne Secure.
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: SESSION_TTL_MS,
  path: '/'
});

// POST /api/auth/login - prüft DASHBOARD_USERNAME/DASHBOARD_PASSWORD und
// setzt bei Erfolg das Session-Cookie.
export const login = (req, res) => {
  const { username, password } = req.body || {};
  const expectedUser = process.env.DASHBOARD_USERNAME;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;

  if (!expectedUser || !expectedPassword || !process.env.SESSION_SECRET) {
    console.error('❌ DASHBOARD_USERNAME/DASHBOARD_PASSWORD/SESSION_SECRET sind nicht vollständig gesetzt - Login nicht möglich.');
    return res.status(503).json({
      success: false,
      message: 'Login ist serverseitig nicht konfiguriert'
    });
  }

  if (!safeCompare(username, expectedUser) || !safeCompare(password, expectedPassword)) {
    return res.status(401).json({
      success: false,
      message: 'Benutzername oder Passwort falsch'
    });
  }

  res.cookie(SESSION_COOKIE_NAME, createSessionToken(), cookieOptions());
  res.status(200).json({ success: true });
};

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.status(200).json({ success: true });
};

// GET /api/auth/me - läuft hinter requireSession; wird die Route erreicht,
// ist die Session gültig (die Middleware hätte sonst schon 401 geantwortet).
export const me = (req, res) => {
  res.status(200).json({ success: true, authenticated: true });
};
