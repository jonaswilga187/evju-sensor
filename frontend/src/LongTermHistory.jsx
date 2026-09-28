import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { sensorAPI } from './services/api'

// Zeigt die Tages-Durchschnitte aus DailySummary - die Rohdaten selbst
// werden nach 30 Tagen automatisch gelöscht (siehe backend/dataRetentionService.js),
// diese Zusammenfassung bleibt bis zu 90 Tage erhalten.
function LongTermHistory() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    sensorAPI.getDailySummaries(90)
      .then((data) => setSummaries(data || []))
      .catch((err) => {
        console.error('Fehler beim Laden der Langzeit-Historie:', err)
        setError('Langzeit-Historie konnte nicht geladen werden.')
      })
      .finally(() => setLoading(false))
  }, [])

  const chartData = summaries.map((s) => ({
    datum: new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    temperatur: s.avg_temperatur != null ? parseFloat(s.avg_temperatur.toFixed(1)) : null,
    stromverbrauch: s.avg_stromverbrauch != null ? Math.round(s.avg_stromverbrauch) : null
  }))

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Langzeit-Verlauf (bis 90 Tage)</h2>
      <p className="text-sm text-gray-600 mb-6">
        Tages-Durchschnitte — bleiben erhalten, auch wenn die minütlichen Rohdaten nach 30 Tagen automatisch gelöscht werden.
      </p>

      {loading && <p className="text-sm text-gray-500">Lade...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && chartData.length === 0 && (
        <p className="text-sm text-gray-500">Noch keine Tages-Zusammenfassungen vorhanden (entstehen erst, sobald Rohdaten mindestens einen Tag alt sind).</p>
      )}

      {!loading && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLtTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorLtStrom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="datum" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" stroke="#ef4444" style={{ fontSize: '12px' }} label={{ value: '°C', angle: 0, position: 'insideLeft', style: { fill: '#ef4444' } }} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: '12px' }} label={{ value: 'W', angle: 0, position: 'insideRight', style: { fill: '#10b981' } }} />
            <Tooltip formatter={(value, name) => [value, name === 'temperatur' ? 'Ø Temperatur' : 'Ø Verbrauch']} />
            <Area type="monotone" dataKey="temperatur" stroke="#ef4444" strokeWidth={2} fill="url(#colorLtTemp)" yAxisId="left" connectNulls />
            <Area type="monotone" dataKey="stromverbrauch" stroke="#10b981" strokeWidth={2} fill="url(#colorLtStrom)" yAxisId="right" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default LongTermHistory
