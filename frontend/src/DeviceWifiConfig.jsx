import React, { useState, useEffect } from 'react'
import { deviceAPI } from './services/api'

// Fernkonfiguration des ESP32-WLANs: neue Zugangsdaten werden hier hinterlegt,
// der ESP32 holt sie sich selbst per Poll ab und probiert sie erst beim
// nächsten Neustart aus (z. B. nach dem Umzug zum Veranstaltungsort) - die
// aktuell laufende Verbindung wird dadurch nicht unterbrochen.
const DEVICE_ID = 'esp32-main'

const statusLabel = {
  pending: 'Noch nicht vom Gerät bestätigt',
  applied: 'Vom Gerät übernommen',
  failed: 'Verbindung fehlgeschlagen (Gerät nutzt weiter die alten Daten)',
}

function DeviceWifiConfig() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchStatus = async () => {
    try {
      const data = await deviceAPI.getConfigStatus(DEVICE_ID)
      setStatus(data)
    } catch (err) {
      console.error('Fehler beim Laden des WLAN-Config-Status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!ssid.trim() || password.length < 8) {
      setMessage({ type: 'error', text: 'Bitte SSID und ein Passwort mit mindestens 8 Zeichen eingeben.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await deviceAPI.setWifiConfig(DEVICE_ID, ssid.trim(), password)
      setMessage({ type: 'ok', text: 'Gespeichert. Der ESP32 übernimmt die neuen Daten beim nächsten Neustart.' })
      setPassword('')
      await fetchStatus()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Speichern fehlgeschlagen.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="animate-pulse text-sm text-gray-500">Lade WLAN-Konfiguration...</div>
      </div>
    )
  }

  const pendingChange = status && status.version > status.last_ack_version

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6 border border-sky-200 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <span className="text-2xl">📶</span>
        ESP32 WLAN-Fernkonfiguration
      </h2>
      <p className="text-sm text-gray-600 mt-1">
        Neue WLAN-Zugangsdaten (z. B. fürs Veranstaltungs-WLAN) hier hinterlegen, während der ESP32
        noch am aktuellen Standort mit funktionierendem WLAN läuft. Er holt sie sich beim nächsten
        Poll ab und probiert sie erst beim nächsten Neustart aus — die laufende Verbindung bleibt
        bis dahin unangetastet. Schlägt die neue Verbindung fehl, fällt das Gerät automatisch auf
        die zuletzt funktionierenden Daten zurück.
      </p>

      <form onSubmit={handleSave} className="mt-4 bg-white/70 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WLAN-Name (SSID)</label>
          <input
            type="text"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="z. B. Veranstaltungstechnik-WLAN"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WLAN-Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="mindestens 8 Zeichen"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {saving ? 'Speichert…' : 'Neue Zugangsdaten hinterlegen'}
        </button>

        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
            {message.text}
          </p>
        )}
      </form>

      {status && (
        <div className="mt-4 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
          <span>Aktuell hinterlegte SSID: <strong>{status.wifi_ssid || '–'}</strong></span>
          <span>
            Status: <strong>{statusLabel[status.last_ack_status] || status.last_ack_status}</strong>
            {pendingChange && ' · wartet auf nächsten Neustart des ESP32'}
          </span>
          {status.last_ack_at && (
            <span>Zuletzt gemeldet: {new Date(status.last_ack_at).toLocaleString('de-DE')}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default DeviceWifiConfig
