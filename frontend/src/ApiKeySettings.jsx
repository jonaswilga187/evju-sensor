import React, { useState } from 'react'
import { getApiKey, setApiKey } from './services/api'

// Fehlte bisher komplett: api.js unterstützt zwar schon das Speichern/Senden
// eines API-Keys (localStorage + X-API-Key Header), aber es gab nirgends eine
// UI, um ihn einzugeben. Ohne diese Komponente kann die Website die Heizung/
// den Entfeuchter nicht schalten (jeder Schreibversuch bekommt 401).
function ApiKeySettings() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(getApiKey())
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setApiKey(value.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasKey = Boolean(getApiKey())

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        API-Key {hasKey ? '(gesetzt)' : '(nicht gesetzt — Steuerung deaktiviert)'}
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-3">
            Wird nur lokal in deinem Browser gespeichert (localStorage) und bei jeder
            Schalt-Aktion als <code className="bg-gray-200 px-1 rounded">X-API-Key</code>-Header
            mitgeschickt. Muss mit der <code className="bg-gray-200 px-1 rounded">API_KEY</code>-Umgebungsvariable
            des Backends übereinstimmen.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="API-Key eingeben..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              {saved ? '✓ Gespeichert' : 'Speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiKeySettings
