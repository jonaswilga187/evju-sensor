import React, { useState, useEffect } from 'react'
import { temperatureCycleAPI } from './services/api'

function TemperatureCycles() {
  const [cycles, setCycles] = useState([])
  const [dailyStats, setDailyStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'heating', 'cooling'
  const [daysRange, setDaysRange] = useState(30) // 7, 14, 30
  const [sortBy, setSortBy] = useState('date') // 'date', 'duration'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'

  // Daten laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysRange)

        // Zyklen und Statistiken parallel laden
        const [cyclesData, statsData] = await Promise.all([
          temperatureCycleAPI.getCycles(startDate, endDate, filterType === 'all' ? null : filterType),
          temperatureCycleAPI.getDailyStatistics(startDate, endDate)
        ])

        setCycles(cyclesData)
        setDailyStats(statsData)
      } catch (err) {
        console.error('Fehler beim Laden der Zyklen:', err)
        setError('Daten konnten nicht geladen werden')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filterType, daysRange])

  // Sortierung
  const sortedCycles = [...cycles].sort((a, b) => {
    let comparison = 0
    
    if (sortBy === 'date') {
      comparison = new Date(a.start_time) - new Date(b.start_time)
    } else if (sortBy === 'duration') {
      comparison = a.duration_minutes - b.duration_minutes
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Formatierung
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} Min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}Min` : `${hours}h`
  }

  const getCycleTypeLabel = (type) => {
    return type === 'heating' ? 'Heizen' : 'Abkühlen'
  }

  const getCycleTypeColor = (type) => {
    return type === 'heating' ? 'text-orange-600' : 'text-blue-600'
  }

  if (loading && cycles.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Zyklen-Daten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header mit Filtern */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Temperatur-Zyklen
          </h2>
          
          <div className="flex flex-wrap gap-4">
            {/* Tage-Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Zeitraum:</label>
              <select
                value={daysRange}
                onChange={(e) => setDaysRange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value={7}>Letzte 7 Tage</option>
                <option value={14}>Letzte 14 Tage</option>
                <option value={30}>Letzte 30 Tage</option>
              </select>
            </div>

            {/* Typ-Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Typ:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">Alle</option>
                <option value="heating">Heizen</option>
                <option value="cooling">Abkühlen</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* Tagesstatistiken */}
        {dailyStats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Tagesvergleich
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heizzyklen
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abkühlzyklen
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ø Heizzeit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ø Abkühlzeit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyStats.map((stat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(stat.date + 'T00:00:00').toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.heating_cycles || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.cooling_cycles || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.avg_heating_duration 
                          ? formatDuration(Math.round(stat.avg_heating_duration))
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.avg_cooling_duration 
                          ? formatDuration(Math.round(stat.avg_cooling_duration))
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Zyklen-Tabelle */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Alle Zyklen ({sortedCycles.length})
            </h3>
            
            {/* Sortierung */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sortieren nach:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="date">Datum</option>
                <option value="duration">Dauer</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {sortedCycles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Keine Zyklen gefunden für den ausgewählten Zeitraum.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum/Zeit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start-Temp
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End-Temp
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dauer
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schwellenwert
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modus
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCycles.map((cycle, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(cycle.start_time)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-medium ${getCycleTypeColor(cycle.cycle_type)}`}>
                        {getCycleTypeLabel(cycle.cycle_type)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {cycle.start_temperature.toFixed(1)}°C
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {cycle.end_temperature.toFixed(1)}°C
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600 font-medium">
                        {formatDuration(cycle.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {cycle.threshold.toFixed(1)}°C
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cycle.mode === 'auto' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {cycle.mode === 'auto' ? 'Auto' : 'Manuell'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemperatureCycles

