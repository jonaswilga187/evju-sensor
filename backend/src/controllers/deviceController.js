import DeviceConfig from '../models/DeviceConfig.js';

// GET /api/device/:deviceId/config - Für ESP32: WLAN-Zugangsdaten abholen.
// Geschützt mit API-Key (nicht wie /plug/:id/desired offen), weil hier ein
// echtes WLAN-Passwort im Klartext zurückkommt.
export const getConfig = async (req, res, next) => {
  try {
    const doc = await DeviceConfig.getOrCreate(req.params.deviceId);
    res.status(200).json({
      success: true,
      data: {
        device_id: doc.device_id,
        wifi_ssid: doc.wifi_ssid,
        wifi_password: doc.wifi_password,
        version: doc.version
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/device/:deviceId/config/status - Für Website: Zeigt Version/Bestätigungsstatus,
// absichtlich OHNE das Passwort in der Antwort.
export const getConfigStatus = async (req, res, next) => {
  try {
    const doc = await DeviceConfig.getOrCreate(req.params.deviceId);
    res.status(200).json({
      success: true,
      data: {
        device_id: doc.device_id,
        wifi_ssid: doc.wifi_ssid,
        version: doc.version,
        last_ack_version: doc.last_ack_version,
        last_ack_status: doc.last_ack_status,
        last_ack_at: doc.last_ack_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/device/:deviceId/config - Für Website: Neue WLAN-Zugangsdaten hinterlegen.
export const setConfig = async (req, res, next) => {
  try {
    const { wifi_ssid, wifi_password } = req.body || {};

    if (!wifi_ssid || typeof wifi_ssid !== 'string') {
      return res.status(400).json({ success: false, message: 'wifi_ssid ist erforderlich.' });
    }
    if (typeof wifi_password !== 'string' || wifi_password.length < 8) {
      return res.status(400).json({ success: false, message: 'wifi_password ist erforderlich (mindestens 8 Zeichen).' });
    }

    const doc = await DeviceConfig.setWifiConfig(req.params.deviceId, { wifi_ssid, wifi_password });
    res.status(200).json({
      success: true,
      data: { device_id: doc.device_id, wifi_ssid: doc.wifi_ssid, version: doc.version }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/device/:deviceId/config/ack - Für ESP32: Meldet, ob eine Version
// erfolgreich übernommen wurde oder die Verbindung fehlgeschlagen ist.
export const acknowledgeConfig = async (req, res, next) => {
  try {
    const { version, status } = req.body || {};

    if (typeof version !== 'number') {
      return res.status(400).json({ success: false, message: 'version (Zahl) ist erforderlich.' });
    }
    if (!['applied', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status muss "applied" oder "failed" sein.' });
    }

    const doc = await DeviceConfig.acknowledge(req.params.deviceId, version, status);
    res.status(200).json({
      success: true,
      data: { last_ack_version: doc.last_ack_version, last_ack_status: doc.last_ack_status }
    });
  } catch (error) {
    next(error);
  }
};
