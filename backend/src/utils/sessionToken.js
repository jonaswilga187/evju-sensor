import crypto from 'crypto';

// Leichtgewichtige, zustandslose Session: ein signiertes Token (kein JWT-Paket
// nötig), das nur ein Ablaufdatum trägt. Ersetzt den bisherigen nginx
// Basic-Auth-Dialog durch eine serverseitig geprüfte Session, auf der die
// echte Login-Seite im Frontend aufsetzt.
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

const sign = (payload) => {
  const secret = process.env.SESSION_SECRET;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

export const createSessionToken = () => {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

export const verifySessionToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
};
