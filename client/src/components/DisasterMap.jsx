import { useEffect, useState, Fragment } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from 'react-leaflet'
import L from 'leaflet'

import { getDisasterAlerts } from '../services/disasterService'
import { getShelters } from '../services/shelterService'
import { getAvailableVolunteers } from '../services/volunteerService'

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

const shelterIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
})

const volunteerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/921/921347.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
})

function extractArray(data, keys = []) {
  if (Array.isArray(data)) return data

  if (data && typeof data === 'object') {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key]
    }
  }

  return []
}

function isActiveAlert(alert) {
  const status = String(alert.status || '')
    .trim()
    .toUpperCase()

  return ['ACTIVE', 'PUBLISHED'].includes(status)
}

function hasCoordinates(location) {
  if (!location) return false

  const latitude = Number(location.latitude)
  const longitude = Number(location.longitude)

  return (
    location.latitude !== null &&
    location.latitude !== undefined &&
    location.latitude !== '' &&
    location.longitude !== null &&
    location.longitude !== undefined &&
    location.longitude !== '' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function DisasterMap({ dashboardType = 'user' }) {
  const [alerts, setAlerts] = useState([])
  const [shelters, setShelters] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadMapData() {
      setLoading(true)
      setErrors([])

      const results = await Promise.allSettled([
        getDisasterAlerts(dashboardType),
        getShelters(dashboardType),
        getAvailableVolunteers(),
      ])

      if (cancelled) return

      const [alertResult, shelterResult, volunteerResult] = results
      const failedRequests = []

      if (alertResult.status === 'fulfilled') {
        setAlerts(
          extractArray(alertResult.value, [
            'alerts',
            'disasters',
            'data',
          ])
        )
      } else {
        setAlerts([])
        failedRequests.push('disaster alerts')
        console.error('Failed to load disaster alerts:', alertResult.reason)
      }

      if (shelterResult.status === 'fulfilled') {
        setShelters(
          extractArray(shelterResult.value, ['shelters', 'data'])
        )
      } else {
        setShelters([])
        failedRequests.push('shelters')
        console.error('Failed to load shelters:', shelterResult.reason)
      }

      if (volunteerResult.status === 'fulfilled') {
        setVolunteers(
          extractArray(volunteerResult.value, ['volunteers', 'data'])
        )
      } else {
        setVolunteers([])
        failedRequests.push('volunteers')
        console.error('Failed to load volunteers:', volunteerResult.reason)
      }

      setErrors(failedRequests)
      setLoading(false)
    }

    loadMapData().catch((err) => {
      if (!cancelled) {
        console.error('Failed to load map data:', err)
        setErrors(['map data'])
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [dashboardType])

  const activeAlerts = alerts.filter(isActiveAlert)

  const validAlerts = activeAlerts.filter((alert) =>
    hasCoordinates({
      latitude: alert.latitude ?? alert.location?.latitude,
      longitude: alert.longitude ?? alert.location?.longitude,
    })
  )

  const validShelters = shelters.filter((shelter) =>
    hasCoordinates(shelter.location)
  )

  const availableVolunteers = volunteers.filter(
    (volunteer) =>
      String(volunteer.availabilityStatus || '')
        .trim()
        .toUpperCase() === 'ACTIVE'
  )

  const validVolunteers = availableVolunteers.filter((volunteer) =>
    hasCoordinates(volunteer.location)
  )

  return (
    <section>
      {loading && (
        <p>Loading disaster alerts, shelters, and volunteers...</p>
      )}

      {!loading && (
        <p>
          Active alerts: {activeAlerts.length} | Shelters: {shelters.length}
          {' '}| Available volunteers: {availableVolunteers.length}
        </p>
      )}

      {errors.length > 0 && (
        <p role="alert" style={{ color: '#dc2626' }}>
          Unable to load: {errors.join(', ')}. Check the browser console
          for details.
        </p>
      )}

      {!loading && (
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Locations on map: {validAlerts.length} alerts,{' '}
          {validShelters.length} shelters, {validVolunteers.length} volunteers.
          Items without valid coordinates cannot appear as markers.
        </p>
      )}

      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span>🔴 High / Critical Alert</span>
        <span>🟠 Low / Moderate Alert</span>
        <span>🏠 Emergency Shelter</span>
        <span>🧑‍🚒 Available Volunteer</span>
      </div>

      <MapContainer
        center={[13.0827, 80.2707]}
        zoom={7}
        minZoom={4}
        maxZoom={18}
        scrollWheelZoom={true}
        style={{
          height: '500px',
          width: '100%',
          borderRadius: '12px',
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validAlerts.map((alert) => {
          const latitude = Number(
            alert.latitude ?? alert.location?.latitude
          )
          const longitude = Number(
            alert.longitude ?? alert.location?.longitude
          )

          const highSeverity = ['HIGH', 'CRITICAL'].includes(
            String(alert.severity || '').toUpperCase()
          )

          return (
            <Fragment key={alert._id}>
              <Marker
                position={[latitude, longitude]}
                icon={markerIcon}
              >
                <Popup>
                  <strong>{alert.title || 'Disaster Alert'}</strong>
                  <br />
                  Type: {alert.disasterType || 'Not specified'}
                  <br />
                  Severity: {alert.severity || 'Not specified'}
                  <br />
                  Status: {alert.status || 'Not specified'}
                  <br />
                  Location: {alert.affectedLocation || 'Not specified'}
                  <br />
                  Radius: {alert.radius ?? 0} km
                  <br />
                  Description: {alert.description || 'No description'}
                </Popup>
              </Marker>

              {Number(alert.radius) > 0 && (
                <Circle
                  center={[latitude, longitude]}
                  radius={Number(alert.radius) * 1000}
                  pathOptions={{
                    color: highSeverity ? '#dc2626' : '#d97706',
                    fillColor: highSeverity ? '#ef4444' : '#f59e0b',
                    fillOpacity: 0.2,
                  }}
                />
              )}
            </Fragment>
          )
        })}

        {validShelters.map((shelter) => (
          <Marker
            key={shelter._id}
            position={[
              Number(shelter.location.latitude),
              Number(shelter.location.longitude),
            ]}
            icon={shelterIcon}
          >
            <Popup>
              <strong>{shelter.name || 'Emergency Shelter'}</strong>
              <br />
              Address: {shelter.address || 'Not specified'}
              <br />
              Capacity: {shelter.currentOccupancy ?? 0} /{' '}
              {shelter.capacity ?? 'Unknown'}
              <br />
              Available spaces:{' '}
              {Math.max(
                0,
                Number(shelter.capacity || 0) -
                  Number(shelter.currentOccupancy || 0)
              )}
              <br />
              Status: {shelter.status || 'Not specified'}
              <br />
              Facilities: {shelter.facilities?.join(', ') || 'Not specified'}
              <br />
              Contact: {shelter.contactNumber || 'Not specified'}
            </Popup>
          </Marker>
        ))}

        {validVolunteers.map((volunteer) => (
          <Marker
            key={volunteer._id}
            position={[
              Number(volunteer.location.latitude),
              Number(volunteer.location.longitude),
            ]}
            icon={volunteerIcon}
          >
            <Popup>
              <strong>{volunteer.fullName || 'Volunteer'}</strong>
              <br />
              Status: {volunteer.availabilityStatus}
              <br />
              Skills: {volunteer.skills?.join(', ') || 'Not specified'}
              <br />
              Services:{' '}
              {volunteer.availableServices?.join(', ') || 'Not specified'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  )
}

export default DisasterMap