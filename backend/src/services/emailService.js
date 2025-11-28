import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// E-Mail-Transporter konfigurieren
const createTransporter = () => {
  // Für Gmail (empfohlen für einfache Einrichtung)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // App-Passwort verwenden!
      }
    });
  }

  // Für andere SMTP-Server (z.B. Outlook, eigene Mail-Server)
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true für 465, false für andere Ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Sendet eine E-Mail-Benachrichtigung bei Überschreitung des täglichen Verbrauchs
 * @param {number} kwhVerbrauch - Aktueller täglicher Verbrauch in kWh
 * @param {number} schwellenwert - Schwellenwert in kWh (Standard: 12)
 */
export const sendVerbrauchAlarm = async (kwhVerbrauch, schwellenwert = 12) => {
  try {
    // Prüfen ob E-Mail konfiguriert ist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_TO) {
      console.warn('⚠️  E-Mail-Konfiguration fehlt. Benachrichtigung wird nicht gesendet.');
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Energie-Monitoring" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `⚠️ Energieverbrauch-Alarm: ${kwhVerbrauch.toFixed(2)} kWh überschritten!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⚠️ Energieverbrauch-Alarm</h2>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">
              Der tägliche Energieverbrauch hat den Schwellenwert überschritten!
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Aktueller Verbrauch:</td>
                <td style="padding: 8px 0; text-align: right; color: #dc2626; font-size: 20px; font-weight: bold;">
                  ${kwhVerbrauch.toFixed(2)} kWh
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Schwellenwert:</td>
                <td style="padding: 8px 0; text-align: right;">${schwellenwert} kWh</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Überschreitung:</td>
                <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: bold;">
                  +${(kwhVerbrauch - schwellenwert).toFixed(2)} kWh
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 20px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
            <p style="margin: 0; color: #1e40af;">
              <strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE', { 
                timeZone: 'Europe/Berlin',
                dateStyle: 'full',
                timeStyle: 'long'
              })}
            </p>
          </div>

          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Diese E-Mail wurde automatisch vom Energie-Monitoring-System gesendet.
          </p>
        </div>
      `,
      text: `
Energieverbrauch-Alarm

Der tägliche Energieverbrauch hat den Schwellenwert überschritten!

Aktueller Verbrauch: ${kwhVerbrauch.toFixed(2)} kWh
Schwellenwert: ${schwellenwert} kWh
Überschreitung: +${(kwhVerbrauch - schwellenwert).toFixed(2)} kWh

Zeitpunkt: ${new Date().toLocaleString('de-DE', { 
        timeZone: 'Europe/Berlin',
        dateStyle: 'full',
        timeStyle: 'long'
      })}

Diese E-Mail wurde automatisch vom Energie-Monitoring-System gesendet.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ E-Mail-Benachrichtigung gesendet: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der E-Mail:', error.message);
    return false;
  }
};

/**
 * Testet die E-Mail-Konfiguration
 */
export const testEmailConfig = async () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_TO) {
      return {
        success: false,
        message: 'E-Mail-Konfiguration fehlt. Bitte .env Datei prüfen.'
      };
    }

    const transporter = createTransporter();
    await transporter.verify();

    return {
      success: true,
      message: 'E-Mail-Konfiguration ist gültig'
    };
  } catch (error) {
    return {
      success: false,
      message: `E-Mail-Konfiguration fehlerhaft: ${error.message}`
    };
  }
};

