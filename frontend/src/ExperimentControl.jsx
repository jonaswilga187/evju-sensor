import React, { useState, useEffect } from 'react'
import { experimentAPI } from './services/api'

// Steuerung für die "Testwoche": startet/stoppt eine automatisch
// durchlaufende Sequenz aus Heizung/Entfeuchter-Kombinationen. Jede
// "reach_target"-Phase läuft, bis der Komfort-Zielbereich (siehe .env:
// TARGET_TEMP_MIN/MAX, TARGET_HUMIDITY_MIN/MAX) tatsächlich erreicht ist
// (oder ein Sicherheits-Timeout greift) - das misst direkt, wie effizient
// jede Kombination ans Ziel kommt, statt nur feste Minuten abzuwarten.
function ExperimentControl() {
  const [status, setStatus] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const fetchStatus = async () => {
    try {
      setError(null)
      const [statusData, resultsData] = await Promise.all([
        experimentAPI.getStatus(),
        experimentAPI.getResults(10),
      ])
      setStatus(statusData)
      setResults(resultsData)
    } catch (err) {
      console.error('Fehler beim Laden des Experiment-Status:', err)
      setError('Status konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleStart = async () => {
    if (!window.confirm('Testwoche starten? Heizung und Entfeuchter werden dabei automatisch nach einem festen Plan geschaltet, unabhängig von den einzelnen Automatik-Einstellungen.')) {
      return
    }
    try {
      setBusy(true)
      await experimentAPI.start()
      await fetchStatus()
    } catch (err) {
      setError('Start fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const handleStop = async () => {
    try {
      setBusy(true)
      await experimentAPI.stop()
      await fetchStatus()
    } catch (err) {
      setError('Stopp fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="animate-pulse text-sm text-gray-500">Lade Experiment-Status...</div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            Testwoche (Experiment-Modus)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Testet jede Heizung/Entfeuchter-Kombination, bis der Komfort-Zielbereich
            tatsächlich erreicht ist, und misst dabei Dauer + Energieverbrauch.
            Sicherheitsgrenze: Die Heizung wird unabhängig vom Phasenplan zwangsweise
            ausgeschaltet, sobald 26&nbsp;°C erreicht sind (oder keine aktuellen Sensordaten vorliegen).
          </p>
        </div>

        {status?.active ? (
          <button
            onClick={handleStop}
            disabled={busy}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Stoppen
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={busy}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            Testwoche starten
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {status?.active && (
        <div className="mt-4 bg-white/70 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="text-sm text-gray-600">
              Phase {status.current_phase_index + 1} von {status.total_phases}
              {status.loop_count > 0 && ` · Durchlauf ${status.loop_count + 1}`}
            </span>
            <span className="text-sm font-mono font-semibold text-teal-700">
              läuft seit {formatDuration(status.elapsed_seconds)} (max. {formatDuration(status.max_duration_seconds)})
            </span>
          </div>
          <p className="text-base font-medium text-gray-800">
            {status.current_phase.label}
          </p>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
            <span>🔥 Heizung: <strong>{status.current_phase.heizung === 'on' ? 'AN' : 'AUS'}</strong></span>
            <span>💧 Entfeuchter: <strong>{status.current_phase.entfeuchter === 'on' ? 'AN' : 'AUS'}</strong></span>
            {status.latest_reading && (
              <span>
                📊 Aktuell: {status.latest_reading.temperatur}°C / {status.latest_reading.luftfeuchtigkeit}%
              </span>
            )}
            {status.current_phase.mode !== 'fixed' && (
              <span className={status.in_target_range ? 'text-green-700 font-semibold' : 'text-gray-500'}>
                {status.in_target_range ? '✅ Im Zielbereich' : '⏳ Noch außerhalb'}
              </span>
            )}
          </div>
        </div>
      )}

      {!status?.active && (
        <p className="mt-3 text-xs text-gray-500">
          Läuft in einer Endlosschleife, bis du sie stoppst. Jede Phase endet, sobald
          ihr Ziel erreicht ist (nicht nach einer festen Zeit). Danach übernehmen Heizung
          und Entfeuchter wieder ihre eigenen Modus-Einstellungen (manuell/auto).
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 bg-white/70 rounded-lg p-4 overflow-x-auto">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Letzte Ergebnisse: Zeit bis Zielbereich erreicht
          </p>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="py-1 pr-3">Kombination</th>
                <th className="py-1 pr-3">Dauer</th>
                <th className="py-1 pr-3">Ziel erreicht</th>
                <th className="py-1 pr-3">Energie</th>
                <th className="py-1">Temp. Start → Ende</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r._id} className="border-b border-gray-100 last:border-0">
                  <td className="py-1 pr-3">{r.label}</td>
                  <td className="py-1 pr-3 font-mono">{formatDuration(r.duration_seconds)}</td>
                  <td className="py-1 pr-3">{r.reached_target ? '✅' : '⏱️ Timeout'}</td>
                  <td className="py-1 pr-3">{r.energie_kwh != null ? `${r.energie_kwh} kWh` : '–'}</td>
                  <td className="py-1">
                    {r.start_temperatur != null ? `${r.start_temperatur}°C` : '–'} → {r.end_temperatur != null ? `${r.end_temperatur}°C` : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ExperimentControl
