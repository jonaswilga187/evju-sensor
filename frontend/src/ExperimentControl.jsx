import React, { useState, useEffect } from 'react'
import { experimentAPI } from './services/api'

// Steuerung für die "Testwoche": startet/stoppt eine automatisch
// durchlaufende Sequenz aus Heizung/Entfeuchter-Kombinationen mit
// unterschiedlichen Laufzeiten, um gezielt Vergleichsdaten für die
// Verbrauchsanalyse zu erzeugen, statt nur auf die normale Automatik zu warten.
function ExperimentControl() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const fetchStatus = async () => {
    try {
      setError(null)
      const data = await experimentAPI.getStatus()
      setStatus(data)
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

  const formatRemaining = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
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
            Schaltet Heizung/Entfeuchter automatisch durch verschiedene Kombinationen,
            um gezielt Vergleichsdaten für die Verbrauchsanalyse zu sammeln.
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
              noch {formatRemaining(status.remaining_seconds)}
            </span>
          </div>
          <p className="text-base font-medium text-gray-800">
            {status.current_phase.label}
          </p>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>🔥 Heizung: <strong>{status.current_phase.heizung === 'on' ? 'AN' : 'AUS'}</strong></span>
            <span>💧 Entfeuchter: <strong>{status.current_phase.entfeuchter === 'on' ? 'AN' : 'AUS'}</strong></span>
          </div>
        </div>
      )}

      {!status?.active && (
        <p className="mt-3 text-xs text-gray-500">
          Läuft in einer Endlosschleife (17 Phasen, ca. 100 Min. pro Durchlauf), bis du sie stoppst.
          Danach übernehmen Heizung und Entfeuchter wieder ihre eigenen Modus-Einstellungen (manuell/auto).
        </p>
      )}
    </div>
  )
}

export default ExperimentControl
