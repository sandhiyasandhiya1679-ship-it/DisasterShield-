
import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import './VolunteerDashboard.css'

const ACTIVE_TASK_STATUSES = [
  'ASSIGNED',
  'ACCEPTED',
  'ON_THE_WAY',
  'ARRIVED',
  'WORK_IN_PROGRESS',
]

const COMPLETED_TASK_STATUSES = ['WORK_COMPLETED', 'COMPLETED']

const TASK_ACTIONS = {
  ASSIGNED: [
    { label: 'Accept Request', action: 'accept', primary: true },
    { label: 'Reject Request', action: 'reject', danger: true },
  ],
  ACCEPTED: [
    { label: 'On the Way', action: 'on-the-way', primary: true },
  ],
  ON_THE_WAY: [
    { label: 'Mark Arrived', action: 'arrived', primary: true },
  ],
  ARRIVED: [
    { label: 'Start Work', action: 'work-started', primary: true },
  ],
  WORK_IN_PROGRESS: [
    { label: 'Work Completed', action: 'complete', primary: true },
  ],
}

const STATUS_LABELS = {
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  ON_THE_WAY: 'On the Way',
  ARRIVED: 'Arrived',
  WORK_IN_PROGRESS: 'Work in Progress',
  WORK_COMPLETED: 'Work Completed',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
}

function formatLocation(location) {
  if (!location) return 'Location not provided'

  if (typeof location === 'string') return location

  if (location.address) return location.address

  if (location.latitude != null && location.longitude != null) {
    return `${location.latitude}, ${location.longitude}`
  }

  return 'Location not provided'
}

function VolunteerDashboard() {
  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyTaskId, setBusyTaskId] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('volunteerToken')
    window.location.reload()
  }

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError('')

    const results = await Promise.allSettled([
      api.get('/volunteer/profile'),
      api.get('/volunteer/notifications'),
      api.get('/emergency/volunteer/tasks'),
    ])

    const profileResult = results[0]
    const notificationResult = results[1]
    const tasksResult = results[2]

    if (profileResult.status === 'fulfilled') {
      setProfile(profileResult.value.data.volunteer)
    }

    if (notificationResult.status === 'fulfilled') {
      setNotifications(
        notificationResult.value.data.notifications || []
      )
    }

    if (tasksResult.status === 'fulfilled') {
      setTasks(tasksResult.value.data.tasks || [])
    }

    const failedRequests = results.filter(
      (result) => result.status === 'rejected'
    )

    if (failedRequests.length > 0) {
      const firstError = failedRequests[0].reason

      setError(
        firstError?.response?.data?.message ||
          'Some dashboard information could not be loaded. Check your login and backend connection.'
      )
    }

    if (showLoading) setLoading(false)
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const performTaskAction = async (task, action) => {
    const taskId = task._id

    if (!taskId) {
      setError('Task ID is missing.')
      return
    }

    setBusyTaskId(taskId)
    setError('')
    setMessage('')

    try {
      await api.put(
        `/emergency/volunteer/tasks/${taskId}/${action}`
      )

      const successMessages = {
        accept: 'Request accepted. Your availability is now BUSY.',
        reject: 'Request rejected and returned to the Admin.',
        'on-the-way': 'Your status is now On the Way.',
        arrived: 'Arrival confirmed.',
        'work-started': 'Work started successfully.',
        complete: 'Work completed. Your availability is now ACTIVE.',
      }

      setMessage(
        successMessages[action] || 'Task updated successfully.'
      )

      await loadDashboard(false)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update this task. Please try again.'
      )
    } finally {
      setBusyTaskId('')
    }
  }

  const availability = profile?.availabilityStatus || 'ACTIVE'

  const activeTasks = tasks.filter((task) =>
    ACTIVE_TASK_STATUSES.includes(task.status)
  )

  const completedTasks = tasks.filter((task) =>
    COMPLETED_TASK_STATUSES.includes(task.status)
  )

  const assignedTasks = tasks.filter(
    (task) => task.status === 'ASSIGNED'
  )

  const volunteerName = profile?.fullName || 'Volunteer'

  return (
    <div className="volunteer-dashboard">
      <section className="volunteer-welcome">
        <div>
          <p className="volunteer-eyebrow">VOLUNTEER PORTAL</p>
          <h2>Welcome, {volunteerName}</h2>
          <p>
            Manage emergency assignments and help people affected by disasters.
          </p>
        </div>

        <div className="volunteer-header-actions">
          <span
            className={`availability-badge ${availability.toLowerCase()}`}
          >
            <span className="status-dot">●</span> {availability}
          </span>

          <button
            type="button"
            className="volunteer-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </section>

      {error && (
        <div className="volunteer-message error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="volunteer-message success" role="status">
          {message}
        </div>
      )}

      <section className="volunteer-stat-grid">
        <article className="volunteer-stat-card">
          <span className="volunteer-stat-icon">📋</span>
          <div>
            <p>Active Tasks</p>
            <h3>{loading ? '…' : activeTasks.length}</h3>
          </div>
        </article>

        <article className="volunteer-stat-card">
          <span className="volunteer-stat-icon">📨</span>
          <div>
            <p>Awaiting Response</p>
            <h3>{loading ? '…' : assignedTasks.length}</h3>
          </div>
        </article>

        <article className="volunteer-stat-card">
          <span className="volunteer-stat-icon">✅</span>
          <div>
            <p>Completed Tasks</p>
            <h3>{loading ? '…' : completedTasks.length}</h3>
          </div>
        </article>

        <article className="volunteer-stat-card">
          <span className="volunteer-stat-icon">🔔</span>
          <div>
            <p>Notifications</p>
            <h3>{loading ? '…' : notifications.length}</h3>
          </div>
        </article>
      </section>

      <section className="volunteer-panel">
        <div className="volunteer-panel-heading">
          <div>
            <h3>My Availability</h3>
            <p>
              Your availability is updated automatically when you accept
              and complete a task.
            </p>
          </div>

          <span
            className={`availability-badge ${availability.toLowerCase()}`}
          >
            {availability}
          </span>
        </div>

        <div className="availability-info">
          {availability === 'ACTIVE'
            ? 'You are available to receive an emergency assignment.'
            : availability === 'BUSY'
              ? 'You are currently assigned to an emergency task.'
              : 'You are currently unavailable.'}
        </div>
      </section>

      <section className="volunteer-panel">
        <div className="volunteer-panel-heading">
          <div>
            <h3>My Emergency Tasks</h3>
            <p>
              Accept assignments and update your progress as you help.
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={() => loadDashboard()}
            disabled={loading || Boolean(busyTaskId)}
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="volunteer-empty">Loading your tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="volunteer-empty">
            <span className="empty-icon">🧭</span>
            <h4>No tasks assigned yet</h4>
            <p>
              When the Admin assigns an emergency request to you, it will
              appear here.
            </p>
          </div>
        ) : (
          <div className="volunteer-task-list">
            {tasks.map((task) => {
              const request = task.emergencyRequestId || {}
              const requestUser = request.userId || {}
              const taskId = task._id
              const status = task.status || 'ASSIGNED'
              const actions = TASK_ACTIONS[status] || []
              const isCompleted =
                COMPLETED_TASK_STATUSES.includes(status)
              const isRejected = status === 'REJECTED'
              const isBusy = busyTaskId === taskId

              return (
                <article className="volunteer-task-card" key={taskId}>
                  <div className="task-card-top">
                    <div>
                      <span className="task-type">
                        {request.emergencyType || 'Emergency assistance'}
                      </span>
                      <h4>
                        {requestUser.fullName ||
                          requestUser.name ||
                          'Person requesting help'}
                      </h4>
                    </div>

                    <span
                      className={`task-status ${status
                        .toLowerCase()
                        .replaceAll('_', '-')}`}
                    >
                      {STATUS_LABELS[status] ||
                        status.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <p className="task-description">
                    {request.description ||
                      'No additional description provided.'}
                  </p>

                  <div className="task-details">
                    <p>
                      <strong>Priority:</strong>{' '}
                      {request.priority || 'Normal'}
                    </p>

                    <p>
                      <strong>Location:</strong>{' '}
                      {formatLocation(request.location)}
                    </p>

                    <p>
                      <strong>Contact:</strong>{' '}
                      {request.contactNumber ||
                        requestUser.mobile ||
                        'Not provided'}
                    </p>

                    <p>
                      <strong>People needing help:</strong>{' '}
                      {request.numberOfPeople ?? 'Not specified'}
                    </p>

                    <p>
                      <strong>Assigned:</strong>{' '}
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleString()
                        : 'Not available'}
                    </p>
                  </div>

                  {request.location?.latitude != null &&
                    request.location?.longitude != null && (
                      <a
                        className="task-map-link"
                        href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(
                          request.location.latitude
                        )}&mlon=${encodeURIComponent(
                          request.location.longitude
                        )}#map=16/${encodeURIComponent(
                          request.location.latitude
                        )}/${encodeURIComponent(
                          request.location.longitude
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📍 View location on map
                      </a>
                    )}

                  {isCompleted ? (
                    <p className="completed-note">
                      ✓ Work completed successfully.
                    </p>
                  ) : isRejected ? (
                    <p className="rejected-note">
                      This assignment was rejected.
                    </p>
                  ) : actions.length > 0 ? (
                    <div className="task-actions">
                      {actions.map((item) => (
                        <button
                          type="button"
                          key={item.action}
                          className={
                            item.danger
                              ? 'task-action-button danger'
                              : 'task-action-button primary'
                          }
                          disabled={isBusy}
                          onClick={() =>
                            performTaskAction(task, item.action)
                          }
                        >
                          {isBusy ? 'Updating…' : item.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="task-description">
                      No action is available for this task status.
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="volunteer-panel">
        <div className="volunteer-panel-heading">
          <div>
            <h3>Recent Notifications</h3>
            <p>Updates about your emergency assignments.</p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="volunteer-empty">
            No notifications available.
          </div>
        ) : (
          <div className="volunteer-notification-list">
            {notifications.slice(0, 8).map((notification, index) => (
              <article
                className="volunteer-notification"
                key={notification._id || index}
              >
                <span>🔔</span>
                <div>
                  <strong>
                    {notification.title || 'Notification'}
                  </strong>
                  <p>
                    {notification.message ||
                      notification.description ||
                      'You have a new update.'}
                  </p>
                  {notification.createdAt && (
                    <small>
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default VolunteerDashboard
