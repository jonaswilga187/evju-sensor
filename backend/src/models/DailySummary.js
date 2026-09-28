import mongoose from 'mongoose';

// Ein Dokument pro Kalendertag: Tagesdurchschnitt der Rohmesswerte. Wird von
// dataRetentionService.js erzeugt, BEVOR die Rohdaten (sensor_messwerte)
// durch ihren eigenen TTL-Index nach 30 Tagen automatisch gelöscht werden -
// so bleibt ein grober Langzeitverlauf über mehrere Monate erhalten, ohne
// dass die Rohdaten-Sammlung unbegrenzt wächst.
const dailySummarySchema = new mongoose.Schema(
  {
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      unique: true
    },
    avg_temperatur: { type: Number, default: null },
    avg_luftfeuchtigkeit: { type: Number, default: null },
    avg_stromverbrauch: { type: Number, default: null },
    avg_stromverbrauch_heizung: { type: Number, default: null },
    avg_stromverbrauch_entfeuchter: { type: Number, default: null },
    anzahl_messwerte: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Eigene, längere Aufbewahrung als die Rohdaten (Default 90 Tage ≈ 3 Monate).
const RETENTION_SECONDS = (parseInt(process.env.DAILY_SUMMARY_RETENTION_DAYS) || 90) * 24 * 60 * 60;
dailySummarySchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

dailySummarySchema.statics.getRecent = function (days = 90) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return this.find({ date: { $gte: since } }).sort({ date: 1 }).select('-_id -__v').lean();
};

export default mongoose.model('DailySummary', dailySummarySchema);
