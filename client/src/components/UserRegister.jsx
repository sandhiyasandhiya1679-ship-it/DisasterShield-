
import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'

import { registerUser } from '../services/userService'
import './AuthForms.css'
import 'leaflet/dist/leaflet.css'

const initialForm = {
  fullName: '',
  email: '',
  mobile: '',
  password: '',
  city: '',
  address: '',
  emergencyContact: '',
}

const defaultCenter = [13.0827, 80.2707]

const markerIcon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })
    },
  })

  return null
}

function MapViewUpdater({ coordinates }) {
  const map = useMap()

  useEffect(() => {
    if (coordinates) {
      map.setView(
        [coordinates.latitude, coordinates.longitude],
        15
      )
    }
  }, [coordinates, map])

  return null
}

function UserRegister({ onRegistered, onBack }) {
  const [form, setForm] = useState(initialForm)
  const [coordinates, setCoordinates] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [locationMessage, setLocationMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  // Automatically detect city and address whenever the selected
  // coordinates change.
  useEffect(() => {
    if (!coordinates) return

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        setLocationMessage('Finding your city and address...')

        const params = new URLSearchParams({
          format: 'jsonv2',
          lat: String(coordinates.latitude),
          lon: String(coordinates.longitude),
          addressdetails: '1',
        })

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?${params}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Location lookup failed')
        }

        const data = await response.json()
        const addressParts = data.address || {}

        const detectedCity =
          addressParts.city ||
          addressParts.town ||
          addressParts.village ||
          addressParts.municipality ||
          addressParts.county ||
          ''

        const detectedAddress = data.display_name || ''

        setForm((previous) => ({
          ...previous,
          city: detectedCity || previous.city,
          address: detectedAddress || previous.address,
        }))

        setLocationMessage(
          detectedCity || detectedAddress
            ? 'City and address detected. You can edit them if needed.'
            : 'City and address were not found. Please enter them manually.'
        )
      } catch (lookupError) {
        if (lookupError.name !== 'AbortError') {
          setLocationMessage(
            'Location selected. Please enter your city and address manually if they were not filled.'
          )
        }
      }
    }, 1100)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [coordinates])

  const handleCurrentLocation = () => {
    setError('')
    setLocationMessage('')

    if (!navigator.geolocation) {
      setLocationMessage(
        'Your browser does not support location detection. Please select your location on the map.'
      )
      return
    }

    setLocating(true)
    setLocationMessage('Detecting your current location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const selectedCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setCoordinates(selectedCoordinates)
        setLocationMessage(
          'Location detected. Finding your city and address...'
        )
        setLocating(false)
      },
      (locationError) => {
        let explanation =
          'Unable to detect your location. Please select it on the map.'

        if (locationError.code === 1) {
          explanation =
            'Location permission was denied. Allow location access in your browser or select your location on the map.'
        } else if (locationError.code === 3) {
          explanation =
            'Location detection timed out. Please try again or select your location on the map.'
        }

        setLocationMessage(explanation)
        setLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!coordinates) {
      setError(
        'Please detect your current location or select a point on the map.'
      )
      return
    }

    if (!form.city.trim()) {
      setError('Please enter your city.')
      return
    }

    if (!form.address.trim()) {
      setError('Please enter your address.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...form,
        city: form.city.trim(),
        address: form.address.trim(),
        location: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
      }

      const result = await registerUser(payload)

      setMessage(result.message || 'Registration successful.')
      setForm({ ...initialForm })
      setCoordinates(null)
      setLocationMessage('')

      // App.jsx handles the transition to login.
      onRegistered?.()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to register. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ds-auth-page">
      <form className="ds-auth-card" onSubmit={handleSubmit}>
        <div className="ds-auth-logo">🛡️</div>

        <p className="ds-auth-eyebrow">DISASTERSHIELD</p>
        <h1>Create User Account</h1>

        <p className="ds-auth-subtitle">
          Receive disaster alerts and request emergency assistance.
        </p>

        {error && (
          <div className="ds-auth-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="ds-auth-success" role="status">
            {message}
          </div>
        )}

        <label htmlFor="user-fullName">Full Name</label>
        <input
          id="user-fullName"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          autoComplete="name"
          required
        />

        <label htmlFor="user-email">Email Address</label>
        <input
          id="user-email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <label htmlFor="user-mobile">Mobile Number</label>
        <input
          id="user-mobile"
          name="mobile"
          type="tel"
          value={form.mobile}
          onChange={handleChange}
          autoComplete="tel"
          required
        />

        <label htmlFor="user-password">Password</label>
        <input
          id="user-password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label htmlFor="user-city">Location / City</label>
        <input
          id="user-city"
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="Enter your city or town"
          autoComplete="address-level2"
          required
        />

        <label htmlFor="user-address">Address</label>
        <textarea
          id="user-address"
          name="address"
          value={form.address}
          onChange={handleChange}
          rows={2}
          autoComplete="street-address"
          required
        />

        <label>Choose Your Location on the Map</label>

        <p
          style={{
            margin: '0 0 6px',
            fontSize: '13px',
            color: '#66758a',
          }}
        >
          Use your current location or click the map to place
          the marker where you live.
        </p>

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={locating}
          style={{ marginTop: '0' }}
        >
          {locating
            ? 'Detecting Location...'
            : '📍 Use My Current Location'}
        </button>

        {locationMessage && (
          <p
            role="status"
            style={{
              margin: '4px 0',
              fontSize: '13px',
              color: '#176b87',
              lineHeight: 1.5,
            }}
          >
            {locationMessage}
          </p>
        )}

        <div
          style={{
            width: '100%',
            height: '320px',
            marginTop: '4px',
            overflow: 'hidden',
            border: '1px solid #d6e0e8',
            borderRadius: '10px',
          }}
        >
          <MapContainer
            center={defaultCenter}
            zoom={7}
            minZoom={4}
            maxZoom={18}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onSelect={setCoordinates} />

            <MapViewUpdater coordinates={coordinates} />

            {coordinates && (
              <Marker
                position={[
                  coordinates.latitude,
                  coordinates.longitude,
                ]}
                icon={markerIcon}
              >
                <Popup>
                  <strong>Your selected location</strong>
                  <br />
                  Latitude: {coordinates.latitude.toFixed(6)}
                  <br />
                  Longitude: {coordinates.longitude.toFixed(6)}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {coordinates && (
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: '#e9f8ef',
              color: '#176b45',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            <strong>Selected coordinates</strong>
            <br />
            Latitude: {coordinates.latitude.toFixed(6)}
            <br />
            Longitude: {coordinates.longitude.toFixed(6)}
          </div>
        )}

        <label htmlFor="user-emergencyContact">
          Emergency Contact
        </label>

        <input
          id="user-emergencyContact"
          name="emergencyContact"
          type="tel"
          value={form.emergencyContact}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading || locating}>
          {loading ? 'Registering...' : 'Create Account'}
        </button>

        <button
          type="button"
          className="ds-auth-secondary"
          onClick={onBack}
        >
          Back to Role Selection
        </button>
      </form>
    </div>
  )
}

export default UserRegister
