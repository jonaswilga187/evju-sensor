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

  // Statistiken berechnen
  const totalCycles = cycles.length
  const heatingCycles = cycles.filter(c => c.cycle_type === 'heating').length
  const coolingCycles = cycles.filter(c => c.cycle_type === 'cooling').length
  const avgHeatingDuration = heatingCycles > 0
    ? Math.round(cycles.filter(c => c.cycle_type === 'heating').reduce((sum, c) => sum + c.duration_minutes, 0) / heatingCycles)
    : 0
  const avgCoolingDuration = coolingCycles > 0
    ? Math.round(cycles.filter(c => c.cycle_type === 'cooling').reduce((sum, c) => sum + c.duration_minutes, 0) / coolingCycles)
    : 0

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Temperatur-Zyklen
        </h2>
        <p className="text-sm text-gray-600">
          Übersicht über alle Heiz- und Abkühlzyklen der letzten {daysRange} Tage
        </p>
      </div>

      {/* Filter-Box */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Zeitraum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zeitraum
            </label>
            <select
              value={daysRange}
              onChange={(e) => setDaysRange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={7}>Letzte 7 Tage</option>
              <option value={14}>Letzte 14 Tage</option>
              <option value={30}>Letzte 30 Tage</option>
            </select>
          </div>

          {/* Typ-Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alle</option>
              <option value="heating">Heizen</option>
              <option value="cooling">Abkühlen</option>
            </select>
          </div>

          {/* Sortierung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sortierung
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="date">Datum</option>
                <option value="duration">Dauer</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && cycles.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Zyklen-Daten...</p>
        </div>
      )}

      {/* Content */}
      {!loading && cycles.length > 0 && (
        <>
          {/* Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Heizzyklen Stats */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-orange-900 mb-3">
                🔥 Heizzyklen
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Anzahl:</p>
                  <p className="text-lg font-bold text-orange-700">{heatingCycles}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ø Dauer:</p>
                  <p className="text-lg font-bold text-orange-700">{formatDuration(avgHeatingDuration)}</p>
                </div>
              </div>
            </div>

            {/* Abkühlzyklen Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                ❄️ Abkühlzyklen
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Anzahl:</p>
                  <p className="text-lg font-bold text-blue-700">{coolingCycles}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ø Dauer:</p>
                  <p className="text-lg font-bold text-blue-700">{formatDuration(avgCoolingDuration)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tagesvergleich */}
          {dailyStats.length > 0 && (
            <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
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
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Alle Zyklen ({sortedCycles.length})
            </h3>
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
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && cycles.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 text-lg mb-2">Keine Zyklen gefunden</p>
          <p className="text-gray-500 text-sm">Für den ausgewählten Zeitraum wurden noch keine Zyklen erfasst</p>
        </div>
      )}
    </div>
  )
}

export default TemperatureCycles
