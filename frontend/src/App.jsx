import React, { useState, useEffect } from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { sensorAPI } from './services/api'
import PlugControl from './PlugControl'
import DayComparison from './DayComparison'

// Spannung für Ampere-Berechnung (Deutschland: 230V)
const SPANNUNG = 230 // Volt

// Fallback Beispiel-Daten (falls API nicht erreichbar)
const fallbackData = [
  { zeit: '00:00', temperatur: 18.5, feuchtigkeit: 65, stromverbrauch: 320, ampere: 320/SPANNUNG },
  { zeit: '02:00', temperatur: 17.8, feuchtigkeit: 68, stromverbrauch: 280, ampere: 280/SPANNUNG },
  { zeit: '04:00', temperatur: 17.2, feuchtigkeit: 70, stromverbrauch: 250, ampere: 250/SPANNUNG },
  { zeit: '06:00', temperatur: 16.9, feuchtigkeit: 72, stromverbrauch: 310, ampere: 310/SPANNUNG },
  { zeit: '08:00', temperatur: 18.5, feuchtigkeit: 68, stromverbrauch: 450, ampere: 450/SPANNUNG },
  { zeit: '10:00', temperatur: 21.3, feuchtigkeit: 60, stromverbrauch: 580, ampere: 580/SPANNUNG },
  { zeit: '12:00', temperatur: 24.1, feuchtigkeit: 55, stromverbrauch: 720, ampere: 720/SPANNUNG },
  { zeit: '14:00', temperatur: 26.5, feuchtigkeit: 50, stromverbrauch: 850, ampere: 850/SPANNUNG },
  { zeit: '16:00', temperatur: 27.2, feuchtigkeit: 48, stromverbrauch: 780, ampere: 780/SPANNUNG },
  { zeit: '18:00', temperatur: 25.8, feuchtigkeit: 52, stromverbrauch: 920, ampere: 920/SPANNUNG },
  { zeit: '20:00', temperatur: 22.4, feuchtigkeit: 58, stromverbrauch: 650, ampere: 650/SPANNUNG },
  { zeit: '22:00', temperatur: 20.1, feuchtigkeit: 62, stromverbrauch: 480, ampere: 480/SPANNUNG },
]

// Custom Tooltip für moderne Darstellung
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const getUnit = (name) => {
      if (name === 'temperatur') return '°C'
      if (name === 'feuchtigkeit') return '%'
      if (name === 'stromverbrauch') return 'W'
      if (name === 'ampere') return 'A'
      return ''
    }

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">{payload[0].payload.zeit}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 capitalize">{entry.name}:</span>
            <span className="text-sm font-semibold text-gray-800">
              {entry.value}{getUnit(entry.name)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function App() {
  // State für Daten
  const [data, setData] = useState(fallbackData)
  const [averages, setAverages] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Daten von API laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Parallel beide API-Aufrufe
        const [chartData, avgData] = await Promise.all([
          sensorAPI.get24HourData(),
          sensorAPI.getAverages()
        ])

        // Zeitstempel formatieren für Charts
        const formattedData = chartData.map(item => ({
          zeit: new Date(item.zeitstempel).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          temperatur: item.temperatur,
          feuchtigkeit: item.luftfeuchtigkeit,
          stromverbrauch: item.stromverbrauch,
          ampere: parseFloat((item.stromverbrauch / SPANNUNG).toFixed(2)) // Watt / 230V = Ampere
        }))

        setData(formattedData)
        setAverages(avgData)
        
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err)
        setError('Daten konnten nicht geladen werden. Verwende Beispieldaten.')
        setData(fallbackData)
      } finally {
        setLoading(false)
      }
    }

    // Initial laden
    fetchData()

    // Auto-Update alle 30 Sekunden (statt 5 Minuten)
    const interval = setInterval(fetchData, 30 * 1000)

    // Cleanup
    return () => clearInterval(interval)
  }, [])

  // Durchschnittswerte aus API oder berechnet
  const avgTemperatur = averages?.temperatur_avg?.toFixed(1) || 
    (data.reduce((sum, item) => sum + item.temperatur, 0) / data.length).toFixed(1)
  
  const avgFeuchtigkeit = averages?.luftfeuchtigkeit_avg?.toFixed(0) || 
    (data.reduce((sum, item) => sum + item.feuchtigkeit, 0) / data.length).toFixed(0)
  
  const kwhPer24h = averages?.kwh_24h?.toFixed(2) || 
    ((data.reduce((sum, item) => sum + item.stromverbrauch, 0) / data.length * 24) / 1000).toFixed(2)

  // Loading State
  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Lade Sensordaten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Umgebungs- & Energiemonitoring
                </h1>
                <p className="text-gray-600">
                  Echtzeit-Überwachung der Umgebungsbedingungen und des Stromverbrauchs
                </p>
              </div>
              {/* Status Indikator & Refresh Button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  title="Daten neu laden"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Aktualisieren
                </button>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${error ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
                  <span className="text-sm text-gray-600">
                    {error ? 'Offline' : 'Live (30s)'}
                  </span>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">⚠️ {error}</p>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ø Temperatur (24h)
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {avgTemperatur}°C
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aktuell: {data[data.length - 1]?.temperatur || 0}°C
                  </p>
                </div>
                <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ø Luftfeuchtigkeit (24h)
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {avgFeuchtigkeit}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aktuell: {data[data.length - 1]?.feuchtigkeit || 0}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-blue-400/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ø Verbrauch (24h)
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kwhPer24h} kWh
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aktuell: {data[data.length - 1]?.stromverbrauch || 0}W
                  </p>
                </div>
                <div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Temperatur & Feuchtigkeit Chart */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Temperatur & Luftfeuchtigkeit (24h)
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 60, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTemperatur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorFeuchtigkeit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zeit" 
                  stroke="#6b7280"
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#ef4444"
                  style={{ fontSize: '14px' }}
                  label={{ value: '°C', angle: 0, position: 'insideLeft', offset: 10, style: { fill: '#ef4444', textAnchor: 'middle' } }}
                  domain={[-5, 30]}
                  ticks={[-5, 0, 5, 10, 15, 20, 25, 30]}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#3b82f6"
                  style={{ fontSize: '14px' }}
                  label={{ value: '%', angle: 0, position: 'insideRight', offset: 10, style: { fill: '#3b82f6', textAnchor: 'middle' } }}
                  domain={[0, 150]}
                  ticks={[0, 25, 50, 75, 100, 125, 150]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <Area
                  type="monotone"
                  dataKey="temperatur"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTemperatur)"
                  name="temperatur"
                  yAxisId="left"
                />
                <Area
                  type="monotone"
                  dataKey="feuchtigkeit"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorFeuchtigkeit)"
                  name="feuchtigkeit"
                  yAxisId="right"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stromverbrauch Chart */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Stromverbrauch (24h)
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 60, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorStromverbrauch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorAmpere" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zeit" 
                  stroke="#6b7280"
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#10b981"
                  style={{ fontSize: '14px' }}
                  label={{ value: 'W', angle: 0, position: 'insideLeft', offset: 10, style: { fill: '#10b981', textAnchor: 'middle' } }}
                  domain={[0, 3600]}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#8b5cf6"
                  style={{ fontSize: '14px' }}
                  label={{ value: 'A', angle: 0, position: 'insideRight', offset: 10, style: { fill: '#8b5cf6', textAnchor: 'middle' } }}
                  domain={[0, 16]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <Area
                  type="monotone"
                  dataKey="stromverbrauch"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorStromverbrauch)"
                  name="stromverbrauch"
                  yAxisId="left"
                />
                <Area
                  type="monotone"
                  dataKey="ampere"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={0.6}
                  fill="url(#colorAmpere)"
                  name="ampere"
                  yAxisId="right"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Heizung Steuerung */}
          <div className="mb-8">
            <PlugControl />
          </div>

          {/* Tagesvergleich */}
          <div className="mb-8">
            <DayComparison />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

