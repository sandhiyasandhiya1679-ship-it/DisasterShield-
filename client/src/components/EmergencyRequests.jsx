
import { useCallback, useEffect, useState } from 'react'
import {
  getAllEmergencyRequests,
  assignVolunteer,
} from '../services/emergencyService'
import { getAvailableVolunteers } from '../services/volunteerService'
import './EmergencyRequests.css'

function EmergencyRequests() {
  const [requests, setRequests] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedVolunteers, setSelectedVolunteers] = useState({})
  const [assigningId, setAssigningId] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [requestData, volunteerData] = await Promise.all([
        getAllEmergencyRequests(),
        getAvailableVolunteers(),
      ])

      setRequests(Array.isArray(requestData) ? requestData : [])
      setVolunteers(
        Array.isArray(volunteerData)
          ? volunteerData
          : Array.isArray(volunteerData?.volunteers)
            ? volunteerData.volunteers
            : []
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load emergency requests. Check your backend and login.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAssign = async (request) => {
    const requestId = request._id
    const volunteerId = selectedVolunteers[requestId]

    if (!volunteerId) {
      setError('Please select a volunteer first.')
      return
    }

    if (request.status !== 'PENDING') {
      setError('Only pending requests can be assigned.')
      return
    }

    setAssigningId(requestId)
    setError('')
    setMessage('')

    try {
      await assignVolunteer(requestId, volunteerId)
      setMessage('Volunteer assigned successfully!')
      await loadData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to assign volunteer. Please try again.'
      )
    } finally {
      setAssigningId('')
    }
  }

  const filteredRequests = requests.filter((request) => {
    return filter === 'ALL' || request.status === filter
  })

  const getName = (value) => {
    if (!value) return 'Not provided'
    if (typeof value === 'string') return value
    return value.fullName || value.name || 'Not provided'
  }

  const getLocation = (location) => {
    if (!location) return 'Not provided'
    if (typeof location === 'string') return location

    return (
      location.address ||
      location.name ||
      [
        location.latitude ?? location.lat,
        location.longitude ?? location.lng ?? location.lon,
      ].filter((value) => value !== undefined && value !== null).join(', ') ||
      'Not provided'
    )
  }

  const formatStatus = (status) =>
    String(status || 'PENDING').replaceAll('_', ' ')

  return (
    <section className="emergency-page">
      <div className="emergency-heading">
        <div>
          <p className="emergency-eyebrow">ADMINISTRATION</p>
          <h1>Emergency Requests</h1>
          <p>Review help requests and coordinate volunteer assignments.</p>
        </div>

        <button
          className="emergency-refresh"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      <div className="emergency-summary">
        <div className="emergency-summary-card">
          <span>Total Requests</span>
          <strong>{requests.length}</strong>
        </div>
        <div className="emergency-summary-card">
          <span>Pending</span>
          <strong>
            {requests.filter((r) => r.status === 'PENDING').length}
          </strong>
        </div>
        <div className="emergency-summary-card">
          <span>Assigned / Active</span>
          <strong>
            {requests.filter((r) =>
              ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED',
                'WORK_IN_PROGRESS'].includes(r.status)
            ).length}
          </strong>
        </div>
        <div className="emergency-summary-card">
          <span>Completed</span>
          <strong>
            {requests.filter((r) => r.status === 'COMPLETED').length}
          </strong>
        </div>
      </div>

      {error && <div className="emergency-message error">{error}</div>}
      {message && <div className="emergency-message success">{message}</div>}

      <div className="emergency-toolbar">
        <h2>All Help Requests</h2>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter requests by status"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="ON_THE_WAY">On the way</option>
          <option value="ARRIVED">Arrived</option>
          <option value="WORK_IN_PROGRESS">Work in progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="emergency-empty">Loading emergency requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="emergency-empty">
          <span className="emergency-empty-icon">📋</span>
          <h3>No emergency requests found</h3>
          <p>Requests submitted by users will appear here.</p>
        </div>
      ) : (
        <div className="emergency-request-list">
          {filteredRequests.map((request) => (
            <article className="emergency-request-card" key={request._id}>
              <div className="emergency-card-top">
                <div>
                  <span className="emergency-type">
                    {String(request.emergencyType || 'Emergency')
                      .replaceAll('_', ' ')}
                  </span>
                  <h3>{getName(request.userId)}</h3>
                  <p className="emergency-description">
                    {request.description || 'No description provided.'}
                  </p>
                </div>

                <div className="emergency-badges">
                  <span
                    className={`priority-badge ${
                      String(request.priority || 'NORMAL').toLowerCase()
                    }`}
                  >
                    {request.priority || 'NORMAL'} PRIORITY
                  </span>
                  <span
                    className={`request-status ${
                      String(request.status || 'PENDING').toLowerCase()
                    }`}
                  >
                    {formatStatus(request.status)}
                  </span>
                </div>
              </div>

              <div className="emergency-details">
                <div>
                  <span>Location</span>
                  <strong>{getLocation(request.location)}</strong>
                </div>
                <div>
                  <span>People needing help</span>
                  <strong>{request.numberOfPeople ?? 'Not provided'}</strong>
                </div>
                <div>
                  <span>Contact number</span>
                  <strong>{request.contactNumber || 'Not provided'}</strong>
                </div>
                <div>
                  <span>Submitted</span>
                  <strong>
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleString()
                      : 'Not available'}
                  </strong>
                </div>
                <div>
                  <span>Assigned volunteer</span>
                  <strong>{getName(request.volunteerId)}</strong>
                </div>
              </div>

              {request.additionalInformation && (
                <p className="emergency-extra">
                  <strong>Additional information:</strong>{' '}
                  {request.additionalInformation}
                </p>
              )}

              {request.status === 'PENDING' && (
                <div className="emergency-assign-row">
                  <select
                    value={selectedVolunteers[request._id] || ''}
                    onChange={(event) =>
                      setSelectedVolunteers((previous) => ({
                        ...previous,
                        [request._id]: event.target.value,
                      }))
                    }
                    aria-label={`Select volunteer for ${request.emergencyType}`}
                  >
                    <option value="">Select an available volunteer</option>
                    {volunteers
                      .filter((volunteer) =>
                        volunteer.availabilityStatus === 'ACTIVE'
                      )
                      .map((volunteer) => (
                        <option
                          key={volunteer._id}
                          value={volunteer._id}
                        >
                          {volunteer.fullName}
                          {volunteer.skills?.length
                            ? ` — ${volunteer.skills.join(', ')}`
                            : ''}
                        </option>
                      ))}
                  </select>

                  <button
                    className="emergency-assign-button"
                    onClick={() => handleAssign(request)}
                    disabled={assigningId === request._id}
                  >
                    {assigningId === request._id
                      ? 'Assigning...'
                      : 'Assign Volunteer'}
                  </button>
                </div>
              )}

              {request.status !== 'PENDING' && (
                <p className="emergency-assignment-note">
                  Request workflow: {formatStatus(request.status)}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default EmergencyRequests
