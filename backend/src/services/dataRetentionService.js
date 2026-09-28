import SensorMesswert from '../models/SensorMesswert.js';
import DailySummary from '../models/DailySummary.js';

// Verdichtet vollständig abgeschlossene Tage (mindestens 1 Tag alt) zu einem
// Tagesdurchschnitt, BEVOR die Rohdaten durch den TTL-Index in
// SensorMesswert.js (30 Tage) automatisch gelöscht werden. Läuft regelmäßig
// (siehe server.js) und überspringt Tage, die schon zusammengefasst sind -
// kann also gefahrlos beliebig oft aufgerufen werden.
export const aggregateOldData = async () => {
  const oldest = await SensorMesswert.findOne().sort({ zeitstempel: 1 }).select('zeitstempel').lean();
  if (!oldest) return;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dayCursor = new Date(oldest.zeitstempel);
  dayCursor.setUTCHours(0, 0, 0, 0);

  let created = 0;

  while (dayCursor < oneDayAgo) {
    const dateStr = dayCursor.toISOString().slice(0, 10);
    const dayStart = new Date(dayCursor);
    const dayEnd = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000);

    const alreadyDone = await DailySummary.exists({ date: dateStr });
    if (!alreadyDone) {
      const [agg] = await SensorMesswert.aggregate([
        { $match: { zeitstempel: { $gte: dayStart, $lt: dayEnd } } },
        {
          $group: {
            _id: null,
            avg_temperatur: { $avg: '$temperatur' },
            avg_luftfeuchtigkeit: { $avg: '$luftfeuchtigkeit' },
            avg_stromverbrauch: { $avg: '$stromverbrauch' },
            avg_stromverbrauch_heizung: { $avg: '$stromverbrauch_heizung' },
            avg_stromverbrauch_entfeuchter: { $avg: '$stromverbrauch_entfeuchter' },
            anzahl_messwerte: { $sum: 1 }
          }
        }
      ]);

      if (agg && agg.anzahl_messwerte > 0) {
        await DailySummary.updateOne(
          { date: dateStr },
          {
            $set: {
              date: dateStr,
              avg_temperatur: agg.avg_temperatur,
              avg_luftfeuchtigkeit: agg.avg_luftfeuchtigkeit,
              avg_stromverbrauch: agg.avg_stromverbrauch,
              avg_stromverbrauch_heizung: agg.avg_stromverbrauch_heizung,
              avg_stromverbrauch_entfeuchter: agg.avg_stromverbrauch_entfeuchter,
              anzahl_messwerte: agg.anzahl_messwerte
            }
          },
          { upsert: true }
        );
        created += 1;
      }
    }

    dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
  }

  if (created > 0) {
    console.log(`📊 ${created} Tageszusammenfassung(en) erstellt`);
  }
};
