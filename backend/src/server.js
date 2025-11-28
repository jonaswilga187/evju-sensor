import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import routes from './routes/index.js';
import { checkVerbrauchAlarm } from './services/verbrauchAlarmService.js';

// Umgebungsvariablen laden
dotenv.config();

// Express App initialisieren
const app = express();
const PORT = process.env.PORT || 5000;

// Datenbank verbinden
connectDB();

// Middleware
app.use(helmet()); // Security Headers
app.use(compression()); // Response Kompression
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
app.use('/api/', rateLimiter);

// Routes
app.use('/api', routes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error Handler (muss am Ende sein)
app.use(errorHandler);

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
  
  // Verbrauch-Alarm-Prüfung einrichten
  const checkInterval = parseInt(process.env.VERBRAUCH_CHECK_INTERVAL_MINUTES) || 60; // Standard: alle 60 Minuten
  const checkIntervalMs = checkInterval * 60 * 1000;
  
  console.log(`📧 Verbrauch-Alarm-Prüfung alle ${checkInterval} Minuten aktiviert`);
  
  // Sofort beim Start prüfen (nach kurzer Verzögerung, damit DB verbunden ist)
  setTimeout(() => {
    checkVerbrauchAlarm();
  }, 10000); // 10 Sekunden nach Start
  
  // Regelmäßig prüfen
  setInterval(() => {
    checkVerbrauchAlarm();
  }, checkIntervalMs);
});

export default app;


