import React, { useState, useEffect } from 'react'
import { plugAPI } from './services/api'

function PlugControl() {
  const [plugStatus, setPlugStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState(null)
  const [temperatureInput, setTemperatureInput] = useState(20)

  // Status laden
  const fetchStatus = async () => {
    try {
      setError(null)
      const status = await plugAPI.getStatus()
      setPlugStatus(status)
      // Temperatur-Input mit aktuellem Schwellenwert aktualisieren
      if (status.temperature_threshold) {
        setTemperatureInput(status.temperature_threshold)
      }
    } catch (err) {
      console.error('Fehler beim Laden des Plug-Status:', err)
      setError('Status konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  // Initial laden
  useEffect(() => {
    fetchStatus()
    
    // Auto-Update alle 5 Sekunden
    const interval = setInterval(fetchStatus, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Status umschalten
  const togglePlug = async () => {
    if (!plugStatus || switching || plugStatus.mode === 'auto') return

    try {
      setSwitching(true)
      const newState = plugStatus.desired_state === 'on' ? 'off' : 'on'
      const updatedStatus = await plugAPI.setDesiredState(newState)
      setPlugStatus(updatedStatus)
    } catch (err) {
      console.error('Fehler beim Schalten:', err)
      setError('Schalten fehlgeschlagen')
    } finally {
      setSwitching(false)
    }
  }

  // Modus wechseln
  const toggleMode = async () => {
    if (!plugStatus || switching) return

    try {
      setSwitching(true)
      const newMode = plugStatus.mode === 'manual' ? 'auto' : 'manual'
      const updatedStatus = await plugAPI.setMode(newMode, temperatureInput)
      setPlugStatus(updatedStatus)
    } catch (err) {
      console.error('Fehler beim Modus-Wechsel:', err)
      setError('Modus-Wechsel fehlgeschlagen')
    } finally {
      setSwitching(false)
    }
  }

  // Temperaturschwellenwert ändern
  const updateTemperature = async () => {
    if (!plugStatus || plugStatus.mode === 'manual') return

    try {
      const updatedStatus = await plugAPI.setMode('auto', temperatureInput)
      setPlugStatus(updatedStatus)
    } catch (err) {
      console.error('Fehler beim Setzen der Temperatur:', err)
      setError('Temperatur-Update fehlgeschlagen')
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  const isOn = plugStatus?.desired_state === 'on'
  const isReportedOn = plugStatus?.reported_state === 'on'
  const isSynced = plugStatus?.desired_state === plugStatus?.reported_state

  // Status-Badge-Farbe
  const getStatusColor = () => {
    if (plugStatus?.reported_state === 'unknown') return 'bg-gray-500'
    if (!isSynced) return 'bg-yellow-500'
    return isReportedOn ? 'bg-green-500' : 'bg-red-500'
  }

  const getStatusText = () => {
    if (plugStatus?.reported_state === 'unknown') return 'Unbekannt'
    if (!isSynced) return 'Wird aktualisiert...'
    return isReportedOn ? 'Eingeschaltet' : 'Ausgeschaltet'
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            Heizung Steuerung
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Heizung über ESP32 fernsteuern
          </p>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Modus-Steuerung */}
      <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Modus-Schalter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Steuerungsmodus
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMode}
                disabled={switching}
                className={`
                  relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300
                  ${plugStatus?.mode === 'auto' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                    : 'bg-gray-300'
                  }
                  ${switching ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
                `}
              >
                <span
                  className={`
                    inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300
                    ${plugStatus?.mode === 'auto' ? 'translate-x-11' : 'translate-x-1'}
                  `}
                />
              </button>
              <div className="flex flex-col">
                <span className={`text-sm font-bold ${plugStatus?.mode === 'auto' ? 'text-blue-600' : 'text-gray-600'}`}>
                  {plugStatus?.mode === 'auto' ? '🤖 Automatik' : '👤 Manuell'}
                </span>
                <span className="text-xs text-gray-500">
                  {plugStatus?.mode === 'auto' 
                    ? 'Temperaturbasiert' 
                    : 'Manuelles Schalten'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Temperatur-Einstellung (nur bei Auto) */}
          {plugStatus?.mode === 'auto' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperaturschwellenwert
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="30"
                  step="0.5"
                  value={temperatureInput}
                  onChange={(e) => setTemperatureInput(parseFloat(e.target.value))}
                  onBlur={updateTemperature}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">°C</span>
                <button
                  onClick={updateTemperature}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  ✓
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Heizung geht an bei &lt; {temperatureInput}°C
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hauptsteuerung */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Toggle Button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={togglePlug}
            disabled={switching || plugStatus?.mode === 'auto'}
            className={`
              relative w-48 h-48 rounded-full shadow-2xl transition-all duration-300 transform
              ${switching || plugStatus?.mode === 'auto' ? 'scale-95 opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
              ${isOn 
                ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/50' 
                : 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-gray-500/50'
              }
            `}
          >
            {switching ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <svg className="w-20 h-20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-2xl font-bold">
                  {isOn ? 'EIN' : 'AUS'}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Status-Details */}
        <div className="flex-1 space-y-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Modus:</span>
              <span className={`text-sm font-bold ${plugStatus?.mode === 'auto' ? 'text-blue-600' : 'text-gray-600'}`}>
                {plugStatus?.mode === 'auto' ? '🤖 AUTO' : '👤 MANUELL'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Soll-Status:</span>
              <span className={`text-sm font-bold ${isOn ? 'text-green-600' : 'text-red-600'}`}>
                {isOn ? 'EIN' : 'AUS'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Ist-Status:</span>
              <span className={`text-sm font-bold ${
                plugStatus?.reported_state === 'unknown' ? 'text-gray-600' :
                isReportedOn ? 'text-green-600' : 'text-red-600'
              }`}>
                {plugStatus?.reported_state === 'unknown' ? 'UNBEKANNT' :
                 isReportedOn ? 'EIN' : 'AUS'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Synchronisiert:</span>
              <span className={`text-sm font-bold ${isSynced ? 'text-green-600' : 'text-yellow-600'}`}>
                {isSynced ? '✓ Ja' : '⟳ Nein'}
              </span>
            </div>
          </div>

          {/* Zeitstempel */}
          {plugStatus?.last_fetched && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Letzter ESP32-Abruf:</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(plugStatus.last_fetched).toLocaleString('de-DE')}
              </p>
            </div>
          )}

          {plugStatus?.last_changed && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Letzte Änderung:</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(plugStatus.last_changed).toLocaleString('de-DE')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info-Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 font-medium mb-1">
              {plugStatus?.mode === 'auto' ? '🤖 Automatik-Modus:' : '👤 Manueller Modus:'}
            </p>
            <p className="text-xs text-blue-700">
              {plugStatus?.mode === 'auto' 
                ? `Die Heizung schaltet automatisch ein, wenn die Temperatur unter ${temperatureInput}°C fällt. Sie schaltet bei ${(temperatureInput + 0.5).toFixed(1)}°C wieder aus.`
                : 'Der ESP32 fragt alle paar Sekunden den gewünschten Status ab. Nach dem Umschalten kann es einen Moment dauern, bis die Heizung reagiert.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlugControl

