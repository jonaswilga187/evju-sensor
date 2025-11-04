import React from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Beispiel-Daten für Temperatur, Feuchtigkeit und Stromverbrauch
const data = [
  { zeit: '00:00', temperatur: 18.5, feuchtigkeit: 65, stromverbrauch: 320 },
  { zeit: '02:00', temperatur: 17.8, feuchtigkeit: 68, stromverbrauch: 280 },
  { zeit: '04:00', temperatur: 17.2, feuchtigkeit: 70, stromverbrauch: 250 },
  { zeit: '06:00', temperatur: 16.9, feuchtigkeit: 72, stromverbrauch: 310 },
  { zeit: '08:00', temperatur: 18.5, feuchtigkeit: 68, stromverbrauch: 450 },
  { zeit: '10:00', temperatur: 21.3, feuchtigkeit: 60, stromverbrauch: 580 },
  { zeit: '12:00', temperatur: 24.1, feuchtigkeit: 55, stromverbrauch: 720 },
  { zeit: '14:00', temperatur: 26.5, feuchtigkeit: 50, stromverbrauch: 850 },
  { zeit: '16:00', temperatur: 27.2, feuchtigkeit: 48, stromverbrauch: 780 },
  { zeit: '18:00', temperatur: 25.8, feuchtigkeit: 52, stromverbrauch: 920 },
  { zeit: '20:00', temperatur: 22.4, feuchtigkeit: 58, stromverbrauch: 650 },
  { zeit: '22:00', temperatur: 20.1, feuchtigkeit: 62, stromverbrauch: 480 },
]

// Custom Tooltip für moderne Darstellung
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const getUnit = (name) => {
      if (name === 'temperatur') return '°C'
      if (name === 'feuchtigkeit') return '%'
      if (name === 'stromverbrauch') return 'W'
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
  // Durchschnittswerte berechnen
  const avgTemperatur = (data.reduce((sum, item) => sum + item.temperatur, 0) / data.length).toFixed(1)
  const avgFeuchtigkeit = (data.reduce((sum, item) => sum + item.feuchtigkeit, 0) / data.length).toFixed(0)
  
  // kWh über 24h berechnen (Watt -> kWh)
  // Annahme: Werte sind alle 2 Stunden, also 12 Messungen über 24h
  const avgStromverbrauchWatt = data.reduce((sum, item) => sum + item.stromverbrauch, 0) / data.length
  const kwhPer24h = ((avgStromverbrauchWatt * 24) / 1000).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Umgebungs- & Energiemonitoring
            </h1>
            <p className="text-gray-600">
              Echtzeit-Überwachung der Umgebungsbedingungen und des Stromverbrauchs
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ø Temperatur (24h)
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {avgTemperatur}°C
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aktuell: {data[data.length - 1].temperatur}°C
                  </p>
                </div>
                <div className="w-16 h-16 bg-orange-400/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    Aktuell: {data[data.length - 1].feuchtigkeit}%
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
                    Aktuell: {data[data.length - 1].stromverbrauch}W
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
              <LineChart
                data={data}
                margin={{ top: 10, right: 60, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zeit" 
                  stroke="#6b7280"
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#f97316"
                  style={{ fontSize: '14px' }}
                  label={{ value: '°C', angle: 0, position: 'insideLeft', offset: 10, style: { fill: '#f97316', textAnchor: 'middle' } }}
                  domain={[-5, 35]}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#3b82f6"
                  style={{ fontSize: '14px' }}
                  label={{ value: '%', angle: 0, position: 'insideRight', offset: 10, style: { fill: '#3b82f6', textAnchor: 'middle' } }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <Line
                  type="monotone"
                  dataKey="temperatur"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="temperatur"
                  yAxisId="left"
                />
                <Line
                  type="monotone"
                  dataKey="feuchtigkeit"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="feuchtigkeit"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stromverbrauch Chart */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Stromverbrauch (24h)
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorStromverbrauch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zeit" 
                  stroke="#6b7280"
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '14px' }}
                  label={{ value: 'Watt', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

