import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { sensorAPI } from './services/api'

// Custom Tooltip für moderne Darstellung
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">{payload[0].payload.zeit}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.name}:</span>
            <span className="text-sm font-semibold text-gray-800">
              {entry.value?.toFixed(1)}{entry.dataKey.includes('temperatur') ? '°C' : '%'}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function DayComparison() {
  // State
  const [date1, setDate1] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [date2, setDate2] = useState(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  })
  const [data1, setData1] = useState([])
  const [data2, setData2] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Daten laden
  const loadComparison = async () => {
    if (!date1 || !date2) {
      setError('Bitte beide Daten auswählen')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Parallel beide Tage laden
      const [rawData1, rawData2] = await Promise.all([
        sensorAPI.getDataByDate(date1),
        sensorAPI.getDataByDate(date2)
      ])

      // Daten formatieren - gruppiere nach Stunden für bessere Übersicht
      const formatData = (data) => {
        const hourlyData = {}
        
        data.forEach(item => {
          const date = new Date(item.zeitstempel)
          const hour = date.getHours()
          const key = `${hour.toString().padStart(2, '0')}:00`
          
          if (!hourlyData[key]) {
            hourlyData[key] = {
              zeit: key,
              temps: [],
              hums: []
            }
          }
          
          hourlyData[key].temps.push(item.temperatur)
          hourlyData[key].hums.push(item.luftfeuchtigkeit)
        })
        
        // Durchschnitt berechnen
        return Object.values(hourlyData).map(item => ({
          zeit: item.zeit,
          temperatur: item.temps.reduce((a, b) => a + b, 0) / item.temps.length,
          luftfeuchtigkeit: item.hums.reduce((a, b) => a + b, 0) / item.hums.length
        })).sort((a, b) => a.zeit.localeCompare(b.zeit))
      }

      setData1(formatData(rawData1))
      setData2(formatData(rawData2))
      setHasLoaded(true)

    } catch (err) {
      console.error('Fehler beim Laden der Vergleichsdaten:', err)
      setError('Daten konnten nicht geladen werden. Möglicherweise keine Daten für diese Tage verfügbar.')
    } finally {
      setLoading(false)
    }
  }

  // Kombinierte Daten für Chart
  const getCombinedData = () => {
    const allTimes = new Set([...data1.map(d => d.zeit), ...data2.map(d => d.zeit)])
    
    return Array.from(allTimes).sort().map(zeit => {
      const d1 = data1.find(d => d.zeit === zeit)
      const d2 = data2.find(d => d.zeit === zeit)
      
      return {
        zeit,
        temp_tag1: d1?.temperatur,
        temp_tag2: d2?.temperatur,
        hum_tag1: d1?.luftfeuchtigkeit,
        hum_tag2: d2?.luftfeuchtigkeit
      }
    })
  }

  const combinedData = hasLoaded ? getCombinedData() : []

  // Statistiken berechnen
  const getStats = (data) => {
    if (data.length === 0) return { avgTemp: 0, avgHum: 0, minTemp: 0, maxTemp: 0 }
    
    const temps = data.map(d => d.temperatur)
    const hums = data.map(d => d.luftfeuchtigkeit)
    
    return {
      avgTemp: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      avgHum: (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(0),
      minTemp: Math.min(...temps).toFixed(1),
      maxTemp: Math.max(...temps).toFixed(1)
    }
  }

  const stats1 = getStats(data1)
  const stats2 = getStats(data2)

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Tagesvergleich
        </h2>
        <p className="text-sm text-gray-600">
          Vergleichen Sie Temperatur und Luftfeuchtigkeit von zwei verschiedenen Tagen
        </p>
      </div>

      {/* Datumsauswahl */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Tag 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag 1 (Blau)
            </label>
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tag 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag 2 (Orange)
            </label>
            <input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Button */}
          <div>
            <button
              onClick={loadComparison}
              disabled={loading || !date1 || !date2}
              className={`
                w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2
                ${loading || !date1 || !date2
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Lädt...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Vergleichen
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Charts */}
      {hasLoaded && !loading && (
        <>
          {/* Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Tag 1 Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                📅 {new Date(date1).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Ø Temperatur:</p>
                  <p className="text-lg font-bold text-blue-700">{stats1.avgTemp}°C</p>
                </div>
                <div>
                  <p className="text-gray-600">Ø Luftfeuchtigkeit:</p>
                  <p className="text-lg font-bold text-blue-700">{stats1.avgHum}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Min/Max Temp:</p>
                  <p className="text-sm font-semibold text-blue-600">{stats1.minTemp}°C / {stats1.maxTemp}°C</p>
                </div>
                <div>
                  <p className="text-gray-600">Messpunkte:</p>
                  <p className="text-sm font-semibold text-blue-600">{data1.length} Stunden</p>
                </div>
              </div>
            </div>

            {/* Tag 2 Stats */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-orange-900 mb-3">
                📅 {new Date(date2).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Ø Temperatur:</p>
                  <p className="text-lg font-bold text-orange-700">{stats2.avgTemp}°C</p>
                </div>
                <div>
                  <p className="text-gray-600">Ø Luftfeuchtigkeit:</p>
                  <p className="text-lg font-bold text-orange-700">{stats2.avgHum}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Min/Max Temp:</p>
                  <p className="text-sm font-semibold text-orange-600">{stats2.minTemp}°C / {stats2.maxTemp}°C</p>
                </div>
                <div>
                  <p className="text-gray-600">Messpunkte:</p>
                  <p className="text-sm font-semibold text-orange-600">{data2.length} Stunden</p>
                </div>
              </div>
            </div>
          </div>

          {/* Temperatur Vergleich */}
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🌡️ Temperatur-Vergleich
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zeit" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: '°C', angle: 0, position: 'insideLeft', offset: 10, style: { fill: '#6b7280' } }}
                  domain={[5, 30]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => {
                    if (value === 'temp_tag1') return `${new Date(date1).toLocaleDateString('de-DE')}`
                    if (value === 'temp_tag2') return `${new Date(date2).toLocaleDateString('de-DE')}`
                    return value
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temp_tag1"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  name="temp_tag1"
                />
                <Line
                  type="monotone"
                  dataKey="temp_tag2"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', r: 3 }}
                  name="temp_tag2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Luftfeuchtigkeit Vergleich */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💧 Luftfeuchtigkeit-Vergleich
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zeit" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: '%', angle: 0, position: 'insideLeft', offset: 10, style: { fill: '#6b7280' } }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => {
                    if (value === 'hum_tag1') return `${new Date(date1).toLocaleDateString('de-DE')}`
                    if (value === 'hum_tag2') return `${new Date(date2).toLocaleDateString('de-DE')}`
                    return value
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hum_tag1"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  name="hum_tag1"
                />
                <Line
                  type="monotone"
                  dataKey="hum_tag2"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', r: 3 }}
                  name="hum_tag2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Initial State */}
      {!hasLoaded && !loading && (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 text-lg mb-2">Wählen Sie zwei Tage zum Vergleichen aus</p>
          <p className="text-gray-500 text-sm">Klicken Sie auf "Vergleichen" um die Daten zu laden</p>
        </div>
      )}
    </div>
  )
}

export default DayComparison

