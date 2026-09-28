import mongoose from 'mongoose';

// Fernkonfiguration für ESP32-Geräte (aktuell nur WLAN-Zugangsdaten).
// Der ESP32 pollt seine Config regelmäßig (wie /api/plug/:id/desired) und
// übernimmt neue Werte erst, wenn sich `version` erhöht hat - das Gerät
// speichert diese Zugangsdaten dann nur als "pending" und probiert sie erst
// beim nächsten Neustart aus (siehe docs/05-PLUG-CONTROL.md), damit ein
// Update nicht sofort die laufende Verbindung kappt, während das Gerät noch
// am alten Standort hängt.
const deviceConfigSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    wifi_ssid: {
      type: String,
      default: ''
    },
    wifi_password: {
      type: String,
      default: ''
    },
    version: {
      type: Number,
      default: 0
    },
    last_ack_version: {
      type: Number,
      default: 0
    },
    last_ack_status: {
      type: String,
      enum: ['pending', 'applied', 'failed'],
      default: 'pending'
    },
    last_ack_at: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

deviceConfigSchema.statics.getOrCreate = async function (deviceId) {
  let doc = await this.findOne({ device_id: deviceId });
  if (!doc) {
    doc = await this.create({ device_id: deviceId });
  }
  return doc;
};

deviceConfigSchema.statics.setWifiConfig = async function (deviceId, { wifi_ssid, wifi_password }) {
  const doc = await this.getOrCreate(deviceId);
  doc.wifi_ssid = wifi_ssid;
  doc.wifi_password = wifi_password;
  doc.version += 1;
  doc.last_ack_status = 'pending';
  await doc.save();
  return doc;
};

deviceConfigSchema.statics.acknowledge = async function (deviceId, version, status) {
  const doc = await this.getOrCreate(deviceId);
  doc.last_ack_version = version;
  doc.last_ack_status = status;
  doc.last_ack_at = new Date();
  await doc.save();
  return doc;
};

export default mongoose.model('DeviceConfig', deviceConfigSchema);
