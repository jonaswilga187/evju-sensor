import { getDailyKwhConsumption } from './sensorService.js';
import { sendVerbrauchAlarm } from './emailService.js';

// Speichert, ob bereits eine Benachrichtigung für heute gesendet wurde
let lastAlarmDate = null;
const SCHWELLENWERT_KWH = parseFloat(process.env.VERBRAUCH_SCHWELLENWERT) || 12;

/**
 * Prüft den täglichen Verbrauch und sendet eine E-Mail, wenn der Schwellenwert überschritten wird
 * Verhindert mehrfache Benachrichtigungen am selben Tag
 */
export const checkVerbrauchAlarm = async () => {
  try {
    const today = new Date();
    const todayString = today.toDateString();

    // Prüfen ob bereits heute eine Benachrichtigung gesendet wurde
    if (lastAlarmDate === todayString) {
      console.log('ℹ️  Alarm-Prüfung: Bereits heute benachrichtigt, überspringe...');
      return;
    }

    // Täglichen Verbrauch berechnen
    const kwhVerbrauch = await getDailyKwhConsumption(today);

    console.log(`📊 Täglicher Verbrauch: ${kwhVerbrauch} kWh (Schwellenwert: ${SCHWELLENWERT_KWH} kWh)`);

    // Prüfen ob Schwellenwert überschritten wurde
    if (kwhVerbrauch > SCHWELLENWERT_KWH) {
      console.log(`⚠️  Schwellenwert überschritten! Sende E-Mail-Benachrichtigung...`);
      
      const emailSent = await sendVerbrauchAlarm(kwhVerbrauch, SCHWELLENWERT_KWH);
      
      if (emailSent) {
        // Markieren, dass heute bereits benachrichtigt wurde
        lastAlarmDate = todayString;
        console.log('✅ E-Mail-Benachrichtigung erfolgreich gesendet');
      } else {
        console.log('❌ E-Mail-Benachrichtigung konnte nicht gesendet werden');
      }
    } else {
      console.log(`✅ Verbrauch im Normalbereich (${kwhVerbrauch} kWh ≤ ${SCHWELLENWERT_KWH} kWh)`);
    }
  } catch (error) {
    console.error('❌ Fehler bei Verbrauch-Alarm-Prüfung:', error.message);
  }
};

/**
 * Setzt den Alarm-Status zurück (z.B. für Tests oder bei Tageswechsel)
 */
export const resetAlarmStatus = () => {
  lastAlarmDate = null;
  console.log('🔄 Alarm-Status zurückgesetzt');
};


