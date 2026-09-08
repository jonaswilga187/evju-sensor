import React, { useState, useEffect } from 'react'
import { analysisAPI } from './services/api'

// Read-only Auswertung: zeigt, welche Kombination aus Heizung/Entfeuchter
// (an/aus) historisch am wenigsten Strom verbraucht hat UND wie oft dabei
// Temperatur+Luftfeuchtigkeit im Ziel-Komfortbereich lagen. Steuert nichts
// automatisch - dient als Entscheidungshilfe zum manuellen Nachjustieren
// der Schwellenwerte.
function ConsumptionAnalysis() {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await analysisAPI.getConsumptionComparison(days)
        setData(result)
      } catch (err) {
        console.error('Fehler beim Laden der Verbrauchsanalyse:', err)
        setError('Analyse konnte nicht geladen werden')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [days])

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Verbrauchsvergleich: Heizung × Entfeuchter
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Welche Kombination hielt den Raum am effizientesten im Ziel-Komfortbereich?
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value={7}>Letzte 7 Tage</option>
          <option value={30}>Letzte 30 Tage</option>
          <option value={90}>Letzte 90 Tage</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-amber-600"></div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <p className="text-xs text-gray-500 mb-4">
            Ziel-Bereich: {data.targetRange.temperatur.min}–{data.targetRange.temperatur.max}°C,{' '}
            {data.targetRange.luftfeuchtigkeit.min}–{data.targetRange.luftfeuchtigkeit.max}% rF
            {' · '}
            {data.combinations.reduce((sum, c) => sum + c.messwerte_anzahl, 0)} Messwerte ausgewertet
          </p>

          {data.combinations.length === 0 ? (
            <div className="p-4 bg-white/60 rounded-lg text-sm text-gray-600">
              Noch keine Daten für diesen Zeitraum vorhanden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200 text-left text-gray-600">
                    <th className="pb-2 pr-4">Kombination</th>
                    <th className="pb-2 pr-4">Ø Verbrauch</th>
                    <th className="pb-2 pr-4">Im Zielbereich</th>
                    <th className="pb-2">Messwerte</th>
                  </tr>
                </thead>
                <tbody>
                  {data.combinations.map((c, i) => (
                    <tr key={c.combination} className={`border-b border-amber-100 ${i === 0 ? 'bg-green-50/60 font-medium' : ''}`}>
                      <td className="py-2 pr-4">
                        {i === 0 && <span className="mr-1">🏆</span>}
                        {c.combination}
                      </td>
                      <td className="py-2 pr-4">{c.durchschnitt_stromverbrauch} W</td>
                      <td className="py-2 pr-4">
                        <span className={c.anteil_im_zielbereich_prozent >= 80 ? 'text-green-700' : c.anteil_im_zielbereich_prozent >= 50 ? 'text-yellow-700' : 'text-red-700'}>
                          {c.anteil_im_zielbereich_prozent}%
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{c.messwerte_anzahl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4">
            💡 Dies ist eine reine Auswertung, keine automatische Regelung. Die oberste (🏆 markierte)
            Kombination hielt den Raum am zuverlässigsten im Zielbereich; bei Gleichstand entscheidet der
            niedrigere Verbrauch.
          </p>
        </>
      )}
    </div>
  )
}

export default ConsumptionAnalysis
