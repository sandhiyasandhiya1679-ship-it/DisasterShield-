
import { useEffect, useState } from 'react'
import {
  getAdminDisasterAlerts,
  createDisasterAlert,
  updateDisasterAlert,
  cancelDisasterAlert,
} from '../services/disasterAdminService'

const initialForm = {
  disasterType: 'Flood',
  title: '',
  description: '',
  severity: 'HIGH',
  affectedLocation: '',
  latitude: '',
  longitude: '',
  radius: '10',
  safetyInstructions: '',
  evacuationInstructions: '',
  shelterInformation: '',
}

const disasterTypes = [
  'Flood',
  'Cyclone',
  'Earthquake',
  'Landslide',
  'Heavy Rain',
  'Tsunami',
  'Other',
]

const severityOptions = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']

function DisasterAlerts() {
  const [alerts, setAlerts] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [affectedCount, setAffectedCount] = useState(null)

  const loadAlerts = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminDisasterAlerts()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load disaster alerts.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setShowForm(false)
    setAffectedCount(null)
  }

  const handleEdit = (alert) => {
    setForm({
      disasterType: alert.disasterType || 'Flood',
      title: alert.title || '',
      description: alert.description || '',
      severity: alert.severity || 'HIGH',
      affectedLocation: alert.affectedLocation || '',
      latitude: alert.latitude ?? '',
      longitude: alert.longitude ?? '',
      radius: alert.radius ?? '10',
      safetyInstructions: alert.safetyInstructions || '',
      evacuationInstructions: alert.evacuationInstructions || '',
      shelterInformation: alert.shelterInformation || '',
    })

    setEditingId(alert._id)
    setShowForm(true)
    setMessage('')
    setError('')
    setAffectedCount(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    setAffectedCount(null)

    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius: Number(form.radius),
    }

    try {
      if (editingId) {
        await updateDisasterAlert(editingId, payload)
        setMessage('Disaster alert updated successfully.')
      } else {
        const result = await createDisasterAlert(payload)
        setAffectedCount(result.affectedUserCount ?? 0)
        setMessage('Disaster alert published successfully.')
      }

      resetForm()
      await loadAlerts()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to save disaster alert.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCancelAlert = async (alert) => {
    const confirmed = window.confirm(
      `Cancel "${alert.title}"? It will no longer appear as an active alert on the map.`
    )

    if (!confirmed) return

    setError('')
    setMessage('')
    setAffectedCount(null)

    try {
      await cancelDisasterAlert(alert._id)
      setMessage(`"${alert.title}" was cancelled successfully.`)
      await loadAlerts()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to cancel disaster alert.'
      )
    }
  }

  const activeCount = alerts.filter(
    (alert) => alert.status === 'ACTIVE'
  ).length

  const cancelledCount = alerts.filter(
    (alert) => ['CANCELLED', 'CANCELED'].includes(
      String(alert.status || '').toUpperCase()
    )
  ).length

  return (
    <div className="alerts-page">
      <div className="alerts-toolbar">
        <div>
          <h2>Disaster Alerts Management</h2>
          <p>Create and manage official disaster warnings.</p>
        </div>

        <button
          type="button"
          className="alerts-primary-button"
          onClick={() => {
            resetForm()
            setShowForm(true)
            setError('')
            setMessage('')
          }}
        >
          + Create Alert
        </button>
      </div>

      <div className="alerts-summary">
        <article className="alerts-summary-card">
          <span>Active alerts</span>
          <strong>{activeCount}</strong>
        </article>

        <article className="alerts-summary-card">
          <span>Total alerts</span>
          <strong>{alerts.length}</strong>
        </article>

        <article className="alerts-summary-card">
          <span>Cancelled alerts</span>
          <strong>{cancelledCount}</strong>
        </article>
      </div>

      {error && (
        <div className="alerts-message alerts-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alerts-message alerts-success" role="status">
          {message}
          {affectedCount !== null &&
            ` ${affectedCount} registered user(s) were inside the alert radius.`}
        </div>
      )}

      {showForm && (
        <section className="card alerts-form-card">
          <h3>{editingId ? 'Edit Disaster Alert' : 'Create Disaster Alert'}</h3>

          <form onSubmit={handleSubmit}>
            <div className="alerts-form-grid">
              <label>
                Disaster type
                <select
                  name="disasterType"
                  value={form.disasterType}
                  onChange={handleChange}
                  required
                >
                  {disasterTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Severity
                <select
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  required
                >
                  {severityOptions.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
              </label>

              <label className="alerts-full-width">
                Alert title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Example: Flood warning"
                  required
                />
              </label>

              <label className="alerts-full-width">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </label>

              <label className="alerts-full-width">
                Affected location
                <input
                  name="affectedLocation"
                  value={form.affectedLocation}
                  onChange={handleChange}
                  placeholder="Town, district, or area"
                  required
                />
              </label>

              <label>
                Latitude
                <input
                  name="latitude"
                  type="number"
                  min="-90"
                  max="90"
                  step="any"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 12.674"
                  required
                />
              </label>

              <label>
                Longitude
                <input
                  name="longitude"
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 79.285"
                  required
                />
              </label>

              <label>
                Alert radius (km)
                <input
                  name="radius"
                  type="number"
                  min="0.1"
                  step="any"
                  value={form.radius}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="alerts-full-width">
                Safety instructions
                <textarea
                  name="safetyInstructions"
                  value={form.safetyInstructions}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Steps people should follow"
                />
              </label>

              <label className="alerts-full-width">
                Evacuation instructions
                <textarea
                  name="evacuationInstructions"
                  value={form.evacuationInstructions}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Evacuation route or instructions"
                />
              </label>

              <label className="alerts-full-width">
                Shelter information
                <textarea
                  name="shelterInformation"
                  value={form.shelterInformation}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Nearest shelter and relevant details"
                />
              </label>
            </div>

            <div className="alerts-form-actions">
              <button type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Publish Alert'}
              </button>

              <button
                type="button"
                className="alerts-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Close
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card alerts-list-card">
        <h3>All Disaster Alerts</h3>

        {loading ? (
          <p>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p>No disaster alerts found. Create your first alert.</p>
        ) : (
          <div className="alerts-table-wrapper">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {alerts.map((alert) => {
                  const status = String(alert.status || 'UNKNOWN').toUpperCase()
                  const isCancelled = ['CANCELLED', 'CANCELED'].includes(status)

                  return (
                    <tr key={alert._id}>
                      <td>
                        <strong>{alert.title}</strong>
                        <small>{alert.disasterType}</small>
                      </td>

                      <td>{alert.affectedLocation}</td>

                      <td>
                        <span
                          className={`alerts-severity severity-${String(
                            alert.severity || 'LOW'
                          ).toLowerCase()}`}
                        >
                          {alert.severity}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`alerts-status status-${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {alert.publishedAt
                          ? new Date(alert.publishedAt).toLocaleString()
                          : '—'}
                      </td>

                      <td>
                        <div className="alerts-row-actions">
                          {!isCancelled && (
                            <>
                              <button
                                type="button"
                                className="alerts-edit-button"
                                onClick={() => handleEdit(alert)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="alerts-cancel-button"
                                onClick={() => handleCancelAlert(alert)}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {isCancelled && (
                            <span className="alerts-muted">
                              No actions available
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default DisasterAlerts
