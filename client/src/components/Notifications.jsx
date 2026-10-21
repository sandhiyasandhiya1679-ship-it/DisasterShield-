
import { useCallback, useEffect, useState } from 'react'
import { getAdminNotifications } from '../services/notificationService'
import './Notifications.css'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load notifications.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const unreadCount = notifications.filter(
    (notification) =>
      notification.status === 'UNREAD' ||
      notification.isRead === false
  ).length

  const filteredNotifications = notifications.filter((notification) => {
    const isUnread =
      notification.status === 'UNREAD' ||
      notification.isRead === false

    if (filter === 'UNREAD') return isUnread
    if (filter === 'READ') return !isUnread

    return true
  })

  return (
    <section className="notifications-page">
      <div className="notifications-heading">
        <div>
          <h2>Notifications</h2>
          <p>View disaster updates and emergency response activity.</p>
        </div>

        <button
          className="notifications-refresh"
          onClick={loadNotifications}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="notifications-summary">
        <article className="notifications-summary-card">
          <span>🔔</span>
          <div>
            <p>Total Notifications</p>
            <h3>{notifications.length}</h3>
          </div>
        </article>

        <article className="notifications-summary-card">
          <span>📩</span>
          <div>
            <p>Unread Notifications</p>
            <h3>{unreadCount}</h3>
          </div>
        </article>
      </div>

      <div className="notifications-filters">
        {['ALL', 'UNREAD', 'READ'].map((option) => (
          <button
            key={option}
            className={filter === option ? 'active' : ''}
            onClick={() => setFilter(option)}
          >
            {option === 'ALL'
              ? 'All'
              : option === 'UNREAD'
                ? 'Unread'
                : 'Read'}
          </button>
        ))}
      </div>

      {error && (
        <div className="notifications-error">
          <p>{error}</p>
          <button onClick={loadNotifications}>Try again</button>
        </div>
      )}

      {loading ? (
        <div className="notifications-empty">Loading notifications...</div>
      ) : !error && filteredNotifications.length === 0 ? (
        <div className="notifications-empty">
          <span>🔔</span>
          <h3>No notifications found</h3>
          <p>Notifications will appear here when activity occurs.</p>
        </div>
      ) : (
        !error && (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => {
              const isUnread =
                notification.status === 'UNREAD' ||
                notification.isRead === false

              return (
                <article
                  className={`notification-card ${
                    isUnread ? 'notification-unread' : ''
                  }`}
                  key={notification._id}
                >
                  <div className="notification-icon">
                    {isUnread ? '🔔' : '📩'}
                  </div>

                  <div className="notification-content">
                    <div className="notification-card-heading">
                      <h3>
                        {notification.title ||
                          notification.type ||
                          'System Notification'}
                      </h3>

                      <span
                        className={
                          isUnread
                            ? 'notification-badge unread'
                            : 'notification-badge read'
                        }
                      >
                        {isUnread ? 'UNREAD' : 'READ'}
                      </span>
                    </div>

                    <p>
                      {notification.message ||
                        notification.description ||
                        'No additional details provided.'}
                    </p>

                    <span className="notification-date">
                      {notification.createdAt
                        ? new Date(
                            notification.createdAt
                          ).toLocaleString()
                        : 'Date unavailable'}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )
      )}
    </section>
  )
}

export default Notifications
