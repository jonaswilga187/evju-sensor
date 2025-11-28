# 🎨 CSS/Design-Stil Beschreibung - Frontend-Anwendung

Diese Dokumentation beschreibt den Design-Stil, die Farbpalette und die CSS-Patterns einer React-Anwendung mit Tailwind CSS. Sie kann als Prompt für eine KI verwendet werden, um eine ähnliche Anwendung im gleichen Design zu erstellen.

## 📋 Tech Stack

- **Framework:** React 18
- **Styling:** Tailwind CSS (Utility-First)
- **Build Tool:** Vite
- **Charts:** Recharts
- **Icons:** Inline SVG (Heroicons-Style)

## 🎨 Farbpalette & Design-System

### Haupt-Hintergrund
- **Gradient-Hintergrund:** `bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50`
- **Minimaler Gradients:** Sanfte Übergänge zwischen hellen Pastelltönen
- **Hauptcontainer:** Weiße Karten mit `bg-white rounded-2xl shadow-xl`

### Farbschema für verschiedene Datenbereiche

#### 1. Temperatur (Rot/Rosa)
- **Hauptfarbe:** Rot (`red-600`, `#ef4444`)
- **Cards:** `bg-gradient-to-br from-red-50 to-red-100` mit `border-red-200`
- **Icon-Hintergrund:** `bg-red-400/20` (20% Opacity)
- **Chart-Farbe:** Rot mit Gradient (`from-red-500 to-red-600`)

#### 2. Luftfeuchtigkeit (Blau/Cyan)
- **Hauptfarbe:** Blau (`blue-600`, `#3b82f6`)
- **Cards:** `bg-gradient-to-br from-blue-50 to-cyan-50` mit `border-blue-200`
- **Icon-Hintergrund:** `bg-blue-400/20`
- **Chart-Farbe:** Blau mit Gradient

#### 3. Stromverbrauch (Grün/Emerald)
- **Hauptfarbe:** Grün (`green-600`, `#10b981`)
- **Cards:** `bg-gradient-to-br from-green-50 to-emerald-50` mit `border-green-200`
- **Icon-Hintergrund:** `bg-green-400/20`
- **Chart-Farbe:** Grün mit Gradient

#### 4. Steuerungs-Interface (Lila/Pink)
- **Hauptfarbe:** Lila (`purple-600`, `indigo-600`)
- **Container:** `bg-gradient-to-br from-purple-50 to-pink-50` mit `border-purple-200`
- **Buttons:** `bg-indigo-600 hover:bg-indigo-700`

#### 5. Vergleich/Komparison (Blau/Orange)
- **Tag 1:** Blau (`blue-50`, `border-blue-200`)
- **Tag 2:** Orange (`orange-50`, `border-orange-200`, `#f97316`)

### Neutrale Farben
- **Text primär:** `text-gray-900` (fast schwarz)
- **Text sekundär:** `text-gray-600` (mittelgrau)
- **Text tertiär:** `text-gray-500` (hellgrau)
- **Borders:** `border-gray-200` oder `border-gray-300`
- **Charts Hintergrund:** `bg-gray-50`

## 🏗️ Layout-Patterns

### Container-Struktur
```
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Inhalt */}
    </div>
  </div>
</div>
```

### Responsive Grid
- **Stats Cards:** `grid grid-cols-1 md:grid-cols-3 gap-6`
- **Buttons/Controls:** `flex flex-col md:flex-row gap-6 items-center`
- **Formulare:** `grid grid-cols-1 md:grid-cols-3 gap-4`

### Padding & Spacing
- **Hauptcontainer:** `p-8`
- **Karten:** `p-6` oder `p-4`
- **Sektionen:** `mb-8` (Abstand zwischen Sektionen)
- **Elemente innerhalb Cards:** `gap-4`, `gap-6`

## 🎯 Komponenten-Styles

### Statistik-Cards (Stats Cards)
```
<div className="bg-gradient-to-br from-[FARBE]-50 to-[FARBE]-100 rounded-xl p-6 border border-[FARBE]-200">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600 mb-1">Label</p>
      <p className="text-3xl font-bold text-gray-900">Wert</p>
      <p className="text-xs text-gray-500 mt-1">Zusatzinfo</p>
    </div>
    <div className="w-16 h-16 bg-[FARBE]-400/20 rounded-full flex items-center justify-center">
      {/* SVG Icon */}
    </div>
  </div>
</div>
```

### Buttons
- **Primär-Button:** `px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors`
- **Toggle-Button (groß):** `w-48 h-48 rounded-full shadow-2xl transition-all duration-300`
- **Toggle-Switch:** `h-10 w-20 rounded-full transition-all duration-300` mit animierter Kugel

### Charts-Container
```
<div className="bg-gray-50 rounded-xl p-6 mb-8">
  <h2 className="text-xl font-semibold text-gray-800 mb-6">Titel</h2>
  <ResponsiveContainer width="100%" height={350}>
    {/* Chart */}
  </ResponsiveContainer>
</div>
```

### Formular-Elemente
- **Input:** `px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`
- **Label:** `block text-sm font-medium text-gray-700 mb-2`
- **Date-Picker:** Gleicher Style wie Input

### Tooltips (Custom)
```
<div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
  {/* Tooltip Inhalt mit kleinen runden Farb-Indikatoren */}
</div>
```

### Loading States
- **Spinner:** `animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600`
- **Loading-Container:** Zentriert mit Flexbox, grauer Text

### Status-Badges
- **Punkt-Indikator:** `w-3 h-3 rounded-full bg-green-500 animate-pulse`
- **Text:** `text-sm text-gray-600` oder `text-sm font-medium text-gray-700`

## 🌈 Chart-Styling (Recharts)

### Farben
- **Temperatur:** `#ef4444` (Rot)
- **Luftfeuchtigkeit:** `#3b82f6` (Blau)
- **Stromverbrauch:** `#10b981` (Grün)
- **kWh kumulativ:** `#8b5cf6` (Lila)

### Gradient-Definitionen
```xml
<linearGradient id="colorTemperatur" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
</linearGradient>
```

### Chart-Eigenschaften
- **Stroke Width:** `3` für Hauptlinien, `2` für sekundäre
- **Grid:** `strokeDasharray="3 3" stroke="#e5e7eb"`
- **Axis:** `stroke="#6b7280"` oder farbig passend zur Datenreihe
- **Font Size:** `14px` für Labels

## ✨ Spezielle Effekte

### Backdrop Blur
- **Glassmorphism:** `bg-white/80 backdrop-blur-sm` oder `bg-white/95 backdrop-blur-sm`
- Verwendet für: Info-Boxen, Status-Cards, Tooltips

### Schatten
- **Card-Shadow:** `shadow-xl`
- **Button-Shadow:** `shadow-2xl` oder farbige Schatten `shadow-green-500/50`

### Hover-Effekte
- **Buttons:** `hover:bg-indigo-700 transition-colors`
- **Toggle-Button:** `hover:scale-105 active:scale-95`
- **Cards:** Keine speziellen Hover-Effekte (ruhiges Design)

### Animationen
- **Pulse:** `animate-pulse` für Status-Indikatoren
- **Spin:** `animate-spin` für Loading-Spinner
- **Transition:** `transition-all duration-300` für Toggle-Switches

## 📐 Typografie

### Überschriften
- **H1:** `text-4xl font-bold text-gray-900 mb-2`
- **H2:** `text-xl font-semibold text-gray-800 mb-6` oder `flex items-center gap-2`
- **H3:** `text-lg font-semibold text-gray-800 mb-4`

### Text
- **Beschreibung:** `text-sm text-gray-600`
- **Werte (groß):** `text-3xl font-bold text-gray-900`
- **Werte (mittel):** `text-lg font-bold text-[FARBE]-700`
- **Kleine Labels:** `text-xs text-gray-500`

### Font Family
- System-Font-Stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`
- `font-smoothing: antialiased`

## 🎭 Besondere UI-Elemente

### Toggle Switch (für Modus)
- Großer runder Toggle mit animierter Kugel
- Gradient-Hintergrund wenn aktiv: `bg-gradient-to-r from-blue-500 to-cyan-500`
- Grauer Hintergrund wenn inaktiv: `bg-gray-300`

### Große Toggle-Buttons (für Ein/Aus)
- `w-48 h-48` (großer Kreis)
- Gradient-Hintergrund: `bg-gradient-to-br from-green-400 to-green-600` (EIN)
- Grauer Gradient wenn AUS
- SVG-Icon in der Mitte mit Text

### Status-Indikatoren
- Kleine runde Punkte mit Pulse-Animation
- Farben: Grün (aktiv), Rot (inaktiv), Gelb (Warnung), Grau (unbekannt)

### Info-Boxen
- Warnung: `bg-yellow-50 border border-yellow-200`
- Fehler: `bg-red-50 border border-red-200`
- Info: `bg-blue-50 border border-blue-200`
- Text: `text-[farbe]-800` mit Emoji am Anfang

## 📱 Responsive Design

### Breakpoints (Tailwind Standard)
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px

### Responsive Patterns
- Grid: `grid-cols-1 md:grid-cols-3` (1 Spalte mobil, 3 Spalten Desktop)
- Flex: `flex-col md:flex-row` (Spalten mobil, Zeile Desktop)
- Padding: `px-4 sm:px-6 lg:px-8` (mehr Padding auf größeren Screens)

## 🎨 Emoji-Verwendung

Emojis werden dezent als visuelle Marker verwendet:
- 🌡️ Temperatur
- 💧 Luftfeuchtigkeit
- ⚡ Strom/Energie
- 🔥 Heizung
- 📅 Datum/Tag
- 🤖 Automatik-Modus
- 👤 Manuell-Modus
- ✅ Erfolg
- ❌ Fehler
- ⚠️ Warnung
- 🔄 Aktualisierung

## 🔍 Design-Prinzipien

1. **Minimalismus:** Viel Weißraum, klare Struktur
2. **Farbsystematik:** Jeder Datentyp hat seine eigene Farbwelt
3. **Konsistenz:** Einheitliche Abstände, Rundungen, Schatten
4. **Weichheit:** Abgerundete Ecken (`rounded-xl`, `rounded-2xl`), sanfte Gradienten
5. **Hierarchie:** Klare visuelle Hierarchie durch Größe, Farbe, Gewicht
6. **Feedback:** Hover-States, Loading-States, Status-Indikatoren
7. **Modernität:** Glassmorphism, sanfte Schatten, Gradienten

## 📝 Code-Beispiele

### Komplette Statistik-Card
```jsx
<div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600 mb-1">
        Ø Temperatur (24h)
      </p>
      <p className="text-3xl font-bold text-gray-900">
        22.5°C
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Aktuell: 23.2°C
      </p>
    </div>
    <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Icon Path */}
      </svg>
    </div>
  </div>
</div>
```

### Primär-Button mit Icon
```jsx
<button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* Icon */}
  </svg>
  Aktualisieren
</button>
```

### Chart-Container mit Titel
```jsx
<div className="bg-gray-50 rounded-xl p-6 mb-8">
  <h2 className="text-xl font-semibold text-gray-800 mb-6">
    Temperatur & Luftfeuchtigkeit (24h)
  </h2>
  <ResponsiveContainer width="100%" height={350}>
    {/* Chart-Komponente */}
  </ResponsiveContainer>
</div>
```

## 🎯 Zusammenfassung für KI-Prompt

Wenn du eine ähnliche Anwendung erstellen sollst, halte dich an diese Prinzipien:

1. **Verwende Tailwind CSS** mit Utility-First-Ansatz
2. **Hintergrund:** Sanfter Gradient von blau über indigo zu lila (`from-blue-50 via-indigo-50 to-purple-50`)
3. **Hauptcontainer:** Weiße Karten mit `rounded-2xl shadow-xl`
4. **Farbschema:** Jeder Funktionsbereich hat eigene Farbwelt (rot, blau, grün, lila)
5. **Abstände:** Großzügig (`p-8`, `mb-8`, `gap-6`)
6. **Rundungen:** `rounded-xl` für Karten, `rounded-lg` für Buttons
7. **Schatten:** `shadow-xl` für Cards, `shadow-2xl` für Buttons
8. **Icons:** Inline SVG im Heroicons-Stil
9. **Typography:** System-Fonts, klare Hierarchie
10. **Responsive:** Mobile-First mit `md:` und `lg:` Breakpoints
11. **Effekte:** Sanfte Transitionen, Pulse für Status, Backdrop-Blur für Glassmorphism

Der Gesamteindruck soll **modern, clean, professionell und freundlich** sein.


