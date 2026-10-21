
import { useCallback, useEffect, useState } from 'react'
import {
  getRequestStats,
  getVolunteerStats,
  getAlertStats
} from '../services/reportService'
import './Reports.css'

function Reports() {
  const [requests, setRequests] = useState(null)
  const [volunteers, setVolunteers] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [requestData, volunteerData, alertData] =
        await Promise.all([
          getRequestStats(),
          getVolunteerStats(),
          getAlertStats()
        ])

      setRequests(requestData)
      setVolunteers(volunteerData)
      setAlerts(alertData)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load reports. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const getTotal = (items = []) =>
    items.reduce((total, item) => total + (item.count || 0), 0)

  const renderBars = (items = [], labelKey = '_id') => {
    if (!items.length) {
      return <p className="report-no-data">No data available yet.</p>
    }

    const max = Math.max(...items.map((item) => item.count || 0), 1)

    return (
      <div className="report-bars">
        {items.map((item, index) => (
          <div className="report-bar-row" key={`${item[labelKey]}-${index}`}>
            <div className="report-bar-label">
              <span>{item[labelKey] || 'Unspecified'}</span>
              <strong>{item.count || 0}</strong>
            </div>

            <div className="report-bar-track">
              <div
                className="report-bar-fill"
                style={{
                  width: `${((item.count || 0) / max) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <section className="reports-page">
        <h2>Reports & Analytics</h2>
        <p>Loading report data...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="reports-page">
        <h2>Reports & Analytics</h2>
        <div className="reports-error">
          <p>{error}</p>
          <button onClick={loadReports}>Try again</button>
        </div>
      </section>
    )
  }

  return (
    <section className="reports-page">
      <div className="reports-heading">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Overview of emergency requests, volunteers and disaster alerts.</p>
        </div>

        <button
          className="reports-refresh"
          onClick={loadReports}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="reports-summary">
        <article className="reports-summary-card">
          <span>🚨</span>
          <div>
            <p>Total Emergency Requests</p>
            <h3>{getTotal(requests?.byStatus)}</h3>
          </div>
        </article>

        <article className="reports-summary-card">
          <span>👥</span>
          <div>
            <p>Total Volunteers</p>
            <h3>{getTotal(volunteers?.byAvailability)}</h3>
          </div>
        </article>

        <article className="reports-summary-card">
          <span>⚠️</span>
          <div>
            <p>Total Disaster Alerts</p>
            <h3>{getTotal(alerts?.byStatus)}</h3>
          </div>
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-panel">
          <h3>Emergency Requests by Type</h3>
          {renderBars(requests?.byType)}
        </article>

        <article className="report-panel">
          <h3>Emergency Requests by Status</h3>
          {renderBars(requests?.byStatus)}
        </article>

        <article className="report-panel">
          <h3>Emergency Requests by Priority</h3>
          {renderBars(requests?.byPriority)}
        </article>

        <article className="report-panel">
          <h3>Volunteer Availability</h3>
          {renderBars(volunteers?.byAvailability)}
        </article>

        <article className="report-panel">
          <h3>Volunteer Task Activity</h3>
          {renderBars(volunteers?.taskActivity)}
        </article>

        <article className="report-panel">
          <h3>Disaster Alerts by Type</h3>
          {renderBars(alerts?.byType)}
        </article>

        <article className="report-panel">
          <h3>Disaster Alerts by Severity</h3>
          {renderBars(alerts?.bySeverity)}
        </article>

        <article className="report-panel">
          <h3>Disaster Alerts by Status</h3>
          {renderBars(alerts?.byStatus)}
        </article>
      </div>
    </section>
  )
}

export default Reports
