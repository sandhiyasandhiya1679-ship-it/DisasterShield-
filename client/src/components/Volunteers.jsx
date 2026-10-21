
import { useCallback, useEffect, useState } from 'react'
import { getAvailableVolunteers } from '../services/volunteerService'
import './Volunteers.css'

function Volunteers() {
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadVolunteers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAvailableVolunteers()
      setVolunteers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load available volunteers.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVolunteers()
  }, [loadVolunteers])

  // Convert location objects into readable text.
  const formatLocation = (location, address) => {
    if (typeof address === 'string' && address.trim()) {
      return address
    }

    if (typeof location === 'string' && location.trim()) {
      return location
    }

    if (location && typeof location === 'object') {
      const { latitude, longitude } = location

      if (
        typeof latitude === 'number' &&
        typeof longitude === 'number'
      ) {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      }

      return 'Location not provided'
    }

    return 'Location not provided'
  }

  const formatList = (value) => {
    if (Array.isArray(value)) {
      return value.length ? value.join(', ') : 'Not specified'
    }

    if (typeof value === 'string') {
      return value || 'Not specified'
    }

    return 'Not specified'
  }

  const filteredVolunteers = volunteers.filter((volunteer) => {
    const skills = formatList(volunteer.skills)
    const services = formatList(volunteer.availableServices)
    const location = formatLocation(volunteer.location, volunteer.address)

    const searchableText = [
      volunteer.fullName,
      volunteer.email,
      volunteer.mobile,
      location,
      skills,
      services
    ]
      .filter((value) => typeof value === 'string')
      .join(' ')
      .toLowerCase()

    return searchableText.includes(search.toLowerCase())
  })

  return (
    <section className="volunteers-page">
      <div className="volunteers-heading">
        <div>
          <h2>Volunteers</h2>
          <p>
            View volunteers who are currently available for assignments.
          </p>
        </div>

        <button
          className="volunteers-refresh"
          onClick={loadVolunteers}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="volunteer-summary">
        <div className="volunteer-summary-card">
          <span className="volunteer-summary-icon">👥</span>
          <div>
            <p>Available Volunteers</p>
            <h3>{volunteers.length}</h3>
          </div>
        </div>

        <div className="volunteer-summary-card">
          <span className="volunteer-summary-icon">🟢</span>
          <div>
            <p>Availability</p>
            <h3>ACTIVE</h3>
          </div>
        </div>
      </div>

      <div className="volunteers-toolbar">
        <input
          type="search"
          placeholder="Search by name, skill or service..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search volunteers"
        />

        <span>
          Showing {filteredVolunteers.length} of {volunteers.length}
        </span>
      </div>

      {error && (
        <div className="volunteers-error">
          <p>{error}</p>
          <button onClick={loadVolunteers}>Try again</button>
        </div>
      )}

      {loading ? (
        <div className="volunteers-empty">
          Loading volunteers...
        </div>
      ) : !error && filteredVolunteers.length === 0 ? (
        <div className="volunteers-empty">
          <span>👥</span>
          <h3>
            {search
              ? 'No matching volunteers'
              : 'No available volunteers'}
          </h3>
          <p>
            {search
              ? 'Try a different name, skill or service.'
              : 'Volunteers with ACTIVE status will appear here.'}
          </p>
        </div>
      ) : (
        !error && (
          <div className="volunteer-cards">
            {filteredVolunteers.map((volunteer) => (
              <article
                className="volunteer-card"
                key={volunteer._id}
              >
                <div className="volunteer-card-top">
                  <div className="volunteer-avatar">
                    {volunteer.fullName?.charAt(0)?.toUpperCase() || 'V'}
                  </div>

                  <span className="volunteer-status">
                    <span className="volunteer-status-dot" />
                    ACTIVE
                  </span>
                </div>

                <h3>{volunteer.fullName || 'Unnamed Volunteer'}</h3>

                <p className="volunteer-location">
                  📍 {formatLocation(
                    volunteer.location,
                    volunteer.address
                  )}
                </p>

                <div className="volunteer-detail">
                  <span>Email</span>
                  <p>{volunteer.email || 'Not provided'}</p>
                </div>

                <div className="volunteer-detail">
                  <span>Mobile</span>
                  <p>{volunteer.mobile || 'Not provided'}</p>
                </div>

                <div className="volunteer-detail">
                  <span>Skills</span>
                  <p>{formatList(volunteer.skills)}</p>
                </div>

                <div className="volunteer-detail">
                  <span>Available Services</span>
                  <p>{formatList(volunteer.availableServices)}</p>
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </section>
  )
}

export default Volunteers
