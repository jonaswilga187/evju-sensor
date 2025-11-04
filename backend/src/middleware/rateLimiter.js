import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 Minuten
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Max Requests pro Window
  message: {
    success: false,
    message: 'Zu viele Anfragen. Bitte später erneut versuchen.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


