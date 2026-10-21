
import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { getDisasterAlerts } from '../services/disasterService'
import DisasterMap from './DisasterMap'
import './UserDashboard.css'

function formatLocation(location) {
  if (!location) return 'Not provided'

  if (typeof location === 'string') return location

  if (typeof location === 'object') {
    if (location.address) return location.address

    if (location.latitude != null && location.longitude != null) {
      return `${location.latitude}, ${location.longitude}`
    }
  }

  return 'Location not provided'
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371

  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  )
}

function hasValidCoordinates(latitude, longitude) {
  return (
    latitude !== null &&
    latitude !== undefined &&
    latitude !== '' &&
    longitude !== null &&
    longitude !== undefined &&
    longitude !== '' &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 &&
    Number(latitude) <= 90 &&
    Number(longitude) >= -180 &&
    Number(longitude) <= 180
  )
}

const initialForm = {
  emergencyType: 'FLOOD',
  description: '',
  location: '',
  latitude: '',
  longitude: '',
  numberOfPeople: 1,
  priority: 'HIGH',
  contactNumber: '',
  additionalInformation: '',
}

function UserDashboard({ onLogout }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })

  const [requests, setRequests] = useState([])
  const [disasterAlerts, setDisasterAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [form, setForm] = useState({ ...initialForm })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const submissionKeyRef = useRef(null)
  const submittingRef = useRef(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [profileResult, requestsResult] =
        await Promise.allSettled([
          api.get('/auth/profile'),
          api.get('/emergency/my-requests'),
        ])

      if (profileResult.status === 'fulfilled') {
        const data = profileResult.value.data
        const profile = data.user || data.profile || data

        if (profile && typeof profile === 'object') {
          setUser(profile)
          localStorage.setItem('user', JSON.stringify(profile))
        }
      } else {
        console.error(
          'Unable to load user profile:',
          profileResult.reason
        )
      }

      if (requestsResult.status === 'fulfilled') {
        const fetched = requestsResult.value.data.requests || []
        setRequests(Array.isArray(fetched) ? fetched : [])
      } else {
        throw requestsResult.reason
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load your requests. Please check your connection and login.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    let cancelled = false

    async function loadActiveAlerts() {
      try {
        const alerts = await getDisasterAlerts('user')

        if (!cancelled) {
          setDisasterAlerts(Array.isArray(alerts) ? alerts : [])
        }
      } catch (err) {
        console.error(
          'Unable to load alerts for location warning:',
          err
        )

        if (!cancelled) {
          setDisasterAlerts([])
        }
      } finally {
        if (!cancelled) {
          setAlertsLoading(false)
        }
      }
    }

    loadActiveAlerts()

    return () => {
      cancelled = true
    }
  }, [])

  const userLatitude = user.location?.latitude
  const userLongitude = user.location?.longitude

  const hasValidUserLocation = hasValidCoordinates(
    userLatitude,
    userLongitude
  )

  const affectedAlerts = hasValidUserLocation
    ? disasterAlerts.filter((alert) => {
        const status = String(alert.status || '')
          .trim()
          .toUpperCase()

        if (!['ACTIVE', 'PUBLISHED'].includes(status)) {
          return false
        }

        const latitude = alert.latitude ?? alert.location?.latitude
        const longitude = alert.longitude ?? alert.location?.longitude
        const radius = Number(alert.radius)

        if (
          !hasValidCoordinates(latitude, longitude) ||
          !Number.isFinite(radius) ||
          radius <= 0
        ) {
          return false
        }

        const distance = calculateDistanceKm(
          Number(userLatitude),
          Number(userLongitude),
          Number(latitude),
          Number(longitude)
        )

        return distance <= radius
      })
    : []

  const updateField = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]:
        name === 'numberOfPeople' ? Number(value) : value,
    }))
  }

  const useMyCurrentLocation = () => {
    setError('')
    setMessage('')

    if (!navigator.geolocation) {
      setError(
        'Your browser does not support location access. Please enter the coordinates manually.'
      )
      return
    }

    setGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        setForm((previous) => ({
          ...previous,
          latitude: String(latitude),
          longitude: String(longitude),
        }))

        setMessage(
          'Current coordinates added successfully. Please confirm they match the emergency location.'
        )
        setGettingLocation(false)
      },
      (locationError) => {
        let errorMessage =
          'Unable to get your location. Please enter the coordinates manually.'

        if (locationError.code === 1) {
          errorMessage =
            'Location permission denied. Allow location access in your browser settings and try again.'
        } else if (locationError.code === 2) {
          errorMessage =
            'Your location is unavailable. Check your device location settings and try again.'
        } else if (locationError.code === 3) {
          errorMessage =
            'Getting your location took too long. Please try again.'
        }

        setError(errorMessage)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  const submitRequest = async (event) => {
    event.preventDefault()

    if (submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)
    setError('')
    setMessage('')

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)

    if (
      form.latitude.trim() === '' ||
      form.longitude.trim() === '' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError('Enter a valid latitude and longitude.')
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    if (!form.description.trim()) {
      setError('Please describe the emergency.')
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    if (!form.location.trim()) {
      setError('Please enter the emergency address or landmark.')
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    if (
      !Number.isInteger(Number(form.numberOfPeople)) ||
      Number(form.numberOfPeople) < 1 ||
      Number(form.numberOfPeople) > 10000
    ) {
      setError('Enter a number of people between 1 and 10000.')
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    if (!form.contactNumber.trim()) {
      setError('Please enter a contact number.')
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        emergencyType: form.emergencyType,
        description: form.description.trim(),
        location: {
          address: form.location.trim(),
          latitude,
          longitude,
        },
        numberOfPeople: Number(form.numberOfPeople),
        priority: form.priority,
        contactNumber: form.contactNumber.trim(),
        additionalInformation: form.additionalInformation.trim(),
      }

      const signature = JSON.stringify(payload)

      if (
        !submissionKeyRef.current ||
        submissionKeyRef.current.signature !== signature
      ) {
        submissionKeyRef.current = {
          signature,
          key: crypto.randomUUID(),
        }
      }

      const response = await api.post('/emergency/request', {
        ...payload,
        submissionKey: submissionKeyRef.current.key,
      })

      setMessage(
        response.data.message ||
          'Emergency request submitted successfully.'
      )

      submissionKeyRef.current = null
      setForm({ ...initialForm })
      setActiveTab('requests')
      await loadDashboard()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to submit your emergency request. Please try again.'
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('user')
    onLogout?.()
  }

  const statusClass = (status) =>
    `ud-status ud-status-${String(status || 'PENDING')
      .toLowerCase()
      .replaceAll('_', '-')}`

  return (
    <div className="ud-page">
      <header className="ud-header">
        <div className="ud-brand">
          <span className="ud-brand-icon">🛡️</span>
          <div>
            <strong>DisasterShield</strong>
            <small>User Dashboard</small>
          </div>
        </div>

        <div className="ud-header-user">
          <span>Welcome, {user.fullName || 'User'}</span>
          <button
            type="button"
            className="ud-logout"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="ud-layout">
        <aside className="ud-sidebar">
          <p className="ud-sidebar-label">MENU</p>

          {[
            ['overview', 'Overview'],
            ['new-request', 'Request Emergency Help'],
            ['requests', 'My Help Requests'],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={`ud-nav-item ${
                activeTab === key ? 'active' : ''
              }`}
              onClick={() => {
                setActiveTab(key)
                setError('')
                setMessage('')
              }}
            >
              {label}
            </button>
          ))}

          <div className="ud-safety-note">
            <strong>In immediate danger?</strong>
            <p>
              Contact your local emergency services. Do not wait for an
              online response.
            </p>
          </div>
        </aside>

        <main className="ud-main">
          <div className="ud-page-heading">
            <div>
              <p className="ud-eyebrow">YOUR SAFETY MATTERS</p>
              <h1>
                {activeTab === 'overview' && 'Welcome back'}
                {activeTab === 'new-request' && 'Request Emergency Help'}
                {activeTab === 'requests' && 'My Help Requests'}
              </h1>
              <p>View and manage your disaster assistance requests.</p>
            </div>

            {activeTab === 'overview' && (
              <button
                type="button"
                className="ud-primary-button"
                onClick={() => setActiveTab('new-request')}
              >
                + Request Help
              </button>
            )}
          </div>

          {error && (
            <div className="ud-alert ud-error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="ud-alert ud-success" role="status">
              {message}
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              <section className="ud-stats">
                <article className="ud-stat-card">
                  <span>Total Requests</span>
                  <strong>{requests.length}</strong>
                </article>

                <article className="ud-stat-card">
                  <span>Pending Requests</span>
                  <strong>
                    {
                      requests.filter((r) =>
                        ['PENDING', 'ASSIGNED'].includes(r.status)
                      ).length
                    }
                  </strong>
                </article>

                <article className="ud-stat-card">
                  <span>Completed Requests</span>
                  <strong>
                    {
                      requests.filter((r) => r.status === 'COMPLETED')
                        .length
                    }
                  </strong>
                </article>
              </section>

              {!alertsLoading && affectedAlerts.length > 0 && (
                <section
                  role="alert"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #ef4444',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    color: '#991b1b',
                  }}
                >
                  <h2 style={{ marginTop: 0 }}>
                    ⚠️ Disaster Warning — Your Location May Be Affected
                  </h2>

                  <p>
                    Your registered location is within the affected radius
                    of the following active disaster alert(s). Follow
                    official safety instructions.
                  </p>

                  {affectedAlerts.map((alert) => (
                    <div key={alert._id} style={{ marginBottom: '12px' }}>
                      <strong>
                        {alert.title || alert.disasterType || 'Disaster Alert'}
                      </strong>
                      <p style={{ margin: '4px 0' }}>
                        Location: {alert.affectedLocation || 'Not specified'}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        Severity: {alert.severity || 'Not specified'}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        Affected radius: {alert.radius} km
                      </p>
                      {alert.safetyInstructions && (
                        <p style={{ margin: '4px 0' }}>
                          Safety instructions: {alert.safetyInstructions}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {!alertsLoading &&
                !hasValidUserLocation &&
                disasterAlerts.length > 0 && (
                  <section
                    role="status"
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #f59e0b',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      color: '#92400e',
                    }}
                  >
                    Your registered location coordinates are missing or
                    invalid. Location-based disaster warnings cannot be
                    checked. Please update your profile location.
                  </section>
                )}

              {/* Existing map remains unchanged */}
              <section className="ud-panel">
                <div className="ud-panel-heading">
                  <div>
                    <h2>Disaster Map &amp; Safety Alerts</h2>
                    <p>
                      View active disaster zones, emergency shelters, and
                      available volunteers.
                    </p>
                  </div>
                </div>

                <DisasterMap dashboardType="user" />
              </section>

              <section className="ud-panel">
                <div className="ud-panel-heading">
                  <div>
                    <h2>Recent Requests</h2>
                    <p>
                      Check the latest status of your emergency requests.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ud-text-button"
                    onClick={() => setActiveTab('requests')}
                  >
                    View all
                  </button>
                </div>

                {loading ? (
                  <p className="ud-empty">Loading your requests...</p>
                ) : requests.length === 0 ? (
                  <p className="ud-empty">
                    You haven't submitted any requests yet.
                  </p>
                ) : (
                  <RequestList
                    requests={requests.slice(0, 5)}
                    statusClass={statusClass}
                  />
                )}
              </section>
            </>
          )}

          {activeTab === 'new-request' && (
            <section className="ud-panel">
              <h2>Emergency Assistance Form</h2>
              <p className="ud-form-intro">
                Provide accurate details so the response team can assist you.
              </p>

              <form className="ud-form" onSubmit={submitRequest}>
                <label>
                  Emergency Type
                  <select
                    name="emergencyType"
                    value={form.emergencyType}
                    onChange={updateField}
                    required
                  >
                    <option value="FLOOD">Flood</option>
                    <option value="CYCLONE">Cyclone</option>
                    <option value="EARTHQUAKE">Earthquake</option>
                    <option value="FIRE">Fire</option>
                    <option value="LANDSLIDE">Landslide</option>
                    <option value="MEDICAL">Medical Emergency</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </label>

                <label className="ud-full-width">
                  Description of Emergency
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows="3"
                    placeholder="Explain what happened and what help is needed..."
                    required
                  />
                </label>

                <label className="ud-full-width">
                  Location / Address
                  <textarea
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    rows="2"
                    placeholder="Enter the actual emergency address or landmark"
                    required
                  />
                </label>

                <label>
                  Latitude
                  <input
                    type="number"
                    name="latitude"
                    value={form.latitude}
                    onChange={updateField}
                    step="any"
                    min="-90"
                    max="90"
                    placeholder="Latitude"
                    required
                  />
                </label>

                <label>
                  Longitude
                  <input
                    type="number"
                    name="longitude"
                    value={form.longitude}
                    onChange={updateField}
                    step="any"
                    min="-180"
                    max="180"
                    placeholder="Longitude"
                    required
                  />
                </label>

                <div className="ud-full-width">
                  <button
                    type="button"
                    className="ud-primary-button"
                    onClick={useMyCurrentLocation}
                    disabled={gettingLocation || submitting}
                  >
                    {gettingLocation
                      ? 'Getting your location...'
                      : '📍 Use My Current Location'}
                  </button>

                  <p className="ud-form-intro">
                    Your browser may ask for location permission. These
                    coordinates represent your device's current location;
                    verify that they match the emergency location before
                    submitting.
                  </p>
                </div>

                <label>
                  Number of People Affected
                  <input
                    name="numberOfPeople"
                    type="number"
                    min="1"
                    max="10000"
                    value={form.numberOfPeople}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  Contact Number
                  <input
                    name="contactNumber"
                    type="tel"
                    value={form.contactNumber}
                    onChange={updateField}
                    placeholder="Phone number"
                    required
                  />
                </label>

                <label className="ud-full-width">
                  Additional Information (Optional)
                  <textarea
                    name="additionalInformation"
                    value={form.additionalInformation}
                    onChange={updateField}
                    rows="2"
                    placeholder="Any other important details"
                  />
                </label>

                <div className="ud-full-width">
                  <button
                    className="ud-primary-button"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Submitting...'
                      : 'Submit Emergency Request'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'requests' && (
            <section className="ud-panel">
              <div className="ud-panel-heading">
                <div>
                  <h2>All My Requests</h2>
                  <p>
                    Request status updates appear here when you refresh.
                  </p>
                </div>
                <button
                  type="button"
                  className="ud-text-button"
                  onClick={loadDashboard}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <p className="ud-empty">Loading your requests...</p>
              ) : requests.length === 0 ? (
                <p className="ud-empty">
                  No requests found. Select “Request Emergency Help” to
                  submit one.
                </p>
              ) : (
                <RequestList
                  requests={requests}
                  statusClass={statusClass}
                />
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function RequestList({ requests, statusClass }) {
  return (
    <div className="ud-request-list">
      {requests.map((request) => (
        <article className="ud-request-card" key={request._id}>
          <div className="ud-request-top">
            <div>
              <h3>
                {String(request.emergencyType || 'Emergency').replaceAll('_', ' ')}
              </h3>
              <p>
                {typeof request.description === 'string'
                  ? request.description
                  : 'No description provided.'}
              </p>
            </div>

            <span className={statusClass(request.status)}>
              {String(request.status || 'PENDING').replaceAll('_', ' ')}
            </span>
          </div>

          <div className="ud-request-details">
            <span>
              <strong>Location:</strong> {formatLocation(request.location)}
            </span>
            <span>
              <strong>People affected:</strong> {request.numberOfPeople ?? 1}
            </span>
            <span>
              <strong>Priority:</strong>{' '}
              {typeof request.priority === 'string'
                ? request.priority
                : 'Not specified'}
            </span>
            <span>
              <strong>Submitted:</strong>{' '}
              {request.createdAt
                ? new Date(request.createdAt).toLocaleString()
                : 'Date unavailable'}
            </span>
          </div>

          {request.volunteerId &&
            typeof request.volunteerId === 'object' && (
              <div className="ud-assigned-volunteer">
                <strong>Assigned Volunteer:</strong>{' '}
                {request.volunteerId.fullName || 'Volunteer assigned'}
                {request.volunteerId.mobile
                  ? ` · ${request.volunteerId.mobile}`
                  : ''}
              </div>
            )}
        </article>
      ))}
    </div>
  )
}

export default UserDashboard