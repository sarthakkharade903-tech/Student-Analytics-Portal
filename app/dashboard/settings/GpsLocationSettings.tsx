'use client'

import { useState } from 'react'
import { MapPin, Loader2, CheckCircle2, AlertCircle, LocateFixed, Trash2 } from 'lucide-react'

interface Props {
  currentLat: number | null
  currentLon: number | null
  currentRadius: number
  coachingCenterId: string
}

export default function GpsLocationSettings({ currentLat, currentLon, currentRadius, coachingCenterId }: Props) {
  const [lat, setLat] = useState<number | null>(currentLat)
  const [lon, setLon] = useState<number | null>(currentLon)
  const [radius, setRadius] = useState<number>(currentRadius)
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDetectLocation = async () => {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support geolocation.')
      return
    }
    setDetecting(true)
    setError(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })
      setLat(pos.coords.latitude)
      setLon(pos.coords.longitude)
    } catch (e: any) {
      if (e.code === 1) setError('Location access denied. Please allow location in browser settings.')
      else if (e.code === 2) setError('Location unavailable. Ensure GPS is enabled.')
      else setError('Failed to get location. Try again.')
    } finally {
      setDetecting(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/coaching/gps-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, radius }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Remove the saved GPS location? Students will no longer need to be within a radius to mark attendance.')) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/coaching/gps-location', {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove GPS')
      setLat(null)
      setLon(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isSet = lat !== null && lon !== null

  return (
    <div className="p-6 space-y-5 bg-gray-50/30">
      {/* Current Status */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${isSet ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSet ? 'bg-green-100' : 'bg-orange-100'}`}>
          <MapPin className={`w-5 h-5 ${isSet ? 'text-green-600' : 'text-orange-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isSet ? 'text-green-800' : 'text-orange-700'}`}>
            {isSet ? 'GPS Location Set ✓' : 'No GPS Location Configured'}
          </p>
          <p className={`text-xs mt-0.5 ${isSet ? 'text-green-600' : 'text-orange-500'}`}>
            {isSet
              ? `Lat: ${lat!.toFixed(5)}, Lon: ${lon!.toFixed(5)} · Radius: ${radius}m`
              : 'Attendance can be marked from anywhere. Set a location to restrict it.'}
          </p>
        </div>
        {isSet && (
          <button
            onClick={handleClear}
            disabled={loading}
            title="Remove GPS restriction"
            className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Detect Button */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Step 1 — Set Location</p>
        <button
          onClick={handleDetectLocation}
          disabled={detecting || loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
        >
          {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          {detecting ? 'Detecting your location...' : 'Detect My Current Location'}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Click this while at the coaching center. The browser will ask for location permission.
        </p>
      </div>

      {/* Manual Input */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat ?? ''}
            onChange={e => setLat(e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. 18.52043"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={lon ?? ''}
            onChange={e => setLon(e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. 73.85674"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Radius Slider */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Step 2 — Set Radius</p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="50"
            max="500"
            step="25"
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-sm font-bold text-gray-800 w-16 text-right">{radius} m</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>50m (tight)</span>
          <span>150m (recommended)</span>
          <span>500m (loose)</span>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Location settings saved successfully!
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading || lat === null || lon === null}
        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-40 shadow-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Save GPS Location
      </button>
    </div>
  )
}
