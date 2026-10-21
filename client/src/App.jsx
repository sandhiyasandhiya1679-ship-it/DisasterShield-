import { useEffect, useState } from 'react'
import DisasterMap from './components/DisasterMap'
import AdminLogin from './components/AdminLogin'
import { getDashboardStats } from './services/adminService'
import './App.css'

import DisasterAlerts from './components/DisasterAlerts'
import EmergencyRequests from './components/EmergencyRequests'
import Volunteers from './components/Volunteers'
import Users from './components/Users'
import Notifications from './components/Notifications'
import Reports from './components/Reports'
import Shelters from './components/Shelters'

import RoleSelection from './components/RoleSelection'
import UserLogin from './components/UserLogin'
import UserRegister from './components/UserRegister'
import UserDashboard from './components/UserDashboard'
import VolunteerLogin from './components/VolunteerLogin'
import VolunteerRegister from './components/VolunteerRegister'
import VolunteerDashboard from './components/VolunteerDashboard'

const menuItems = [
  'Dashboard',
  'Disaster Alerts',
  'Emergency Requests',
  'Volunteers',
  'Users',
  'Shelters',
  'Map',
  'Notifications',
  'Reports',
]

function App() {
  const [view, setView] = useState(() => {
    if (localStorage.getItem('token')) return 'admin'
    if (localStorage.getItem('userToken')) return 'user-dashboard'
    if (localStorage.getItem('volunteerToken')) return 'volunteer-dashboard'
    return 'roles'
  })

  const [activePage, setActivePage] = useState('Dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem('token'))
  )
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [statsLoading, setStatsLoading] = useState(false)

  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('admin') || '{}')
    } catch {
      return {}
    }
  })()

  useEffect(() => {
    if (!isLoggedIn || view !== 'admin') return

    let cancelled = false

    const loadStats = async () => {
      setStatsLoading(true)
      setStatsError('')

      try {
        const data = await getDashboardStats()

        if (!cancelled) {
          setStats(data)
        }
      } catch (error) {
        if (!cancelled) {
          setStatsError(
            error.response?.data?.message ||
              'Unable to load dashboard statistics.'
          )

          if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('admin')
            setIsLoggedIn(false)
            setView('admin-login')
          }
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, view])

  const handleAdminLogin = () => {
    setIsLoggedIn(true)
    setActivePage('Dashboard')
    setView('admin')
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    setStats(null)
    setStatsError('')
    setActivePage('Dashboard')
    setIsLoggedIn(false)
    setView('roles')
  }

  const handleUserLogin = () => {
    setView('user-dashboard')
  }

  const handleUserLogout = () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('user')
    setView('roles')
  }

  const handleVolunteerLogin = () => {
    setView('volunteer-dashboard')
  }

  const handleVolunteerLogout = () => {
    localStorage.removeItem('volunteerToken')
    localStorage.removeItem('volunteer')
    setView('roles')
  }

  // Role selection
  if (view === 'roles') {
    return (
      <RoleSelection
        onSelect={(selectedView) => {
          if (selectedView === 'admin-login' && isLoggedIn) {
            setView('admin')
          } else {
            setView(selectedView)
          }
        }}
      />
    )
  }

  // Admin login with Back to Role Selection
  if (view === 'admin-login' || (view === 'admin' && !isLoggedIn)) {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBack={() => setView('roles')}
      />
    )
  }

  // User login
  if (view === 'user-login') {
    return (
      <UserLogin
        onLogin={handleUserLogin}
        onRegister={() => setView('user-register')}
        onBack={() => setView('roles')}
      />
    )
  }

  // User registration
  if (view === 'user-register') {
    return (
      <UserRegister
        onRegistered={() => setView('user-login')}
        onBack={() => setView('roles')}
      />
    )
  }

  // User dashboard
  if (view === 'user-dashboard') {
    return <UserDashboard onLogout={handleUserLogout} />
  }

  // Volunteer login
  if (view === 'volunteer-login') {
    return (
      <VolunteerLogin
        onLogin={handleVolunteerLogin}
        onRegister={() => setView('volunteer-register')}
        onBack={() => setView('roles')}
      />
    )
  }

  // Volunteer registration
  if (view === 'volunteer-register') {
    return (
      <VolunteerRegister
        onRegistered={() => setView('volunteer-login')}
        onBack={() => setView('roles')}
      />
    )
  }

  // Volunteer dashboard
  if (view === 'volunteer-dashboard') {
    return <VolunteerDashboard onLogout={handleVolunteerLogout} />
  }

  // Admin dashboard
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🛡️</span>
          <div>
            <h2>DisasterShield</h2>
            <p>Emergency Management</p>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`nav-item ${
                activePage === item ? 'active' : ''
              }`}
              onClick={() => setActivePage(item)}
            >
              {item === 'Dashboard' && '▦'}
              {item === 'Disaster Alerts' && '⚠'}
              {item === 'Emergency Requests' && '🚨'}
              {item === 'Volunteers' && '♧'}
              {item === 'Users' && '♙'}
              {item === 'Shelters' && '⌂'}
              {item === 'Map' && '◎'}
              {item === 'Notifications' && '♧'}
              {item === 'Reports' && '▤'}
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="logout-button"
          onClick={handleAdminLogout}
        >
          ↪ Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">DISASTER MANAGEMENT SYSTEM</p>
            <h1>{activePage}</h1>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">
              {(admin.fullName || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{admin.fullName || 'Administrator'}</strong>
              <p>System Admin</p>
            </div>
          </div>
        </header>

        {activePage === 'Dashboard' && (
          <>
            <section className="welcome-section">
              <div>
                <h2>Emergency Operations Center</h2>
                <p>
                  Monitor disaster alerts, emergency requests, and
                  volunteer activity from one place.
                </p>
              </div>
              <span className="system-status">
                ● System Dashboard
              </span>
            </section>

            {statsError && (
              <div className="card" role="alert">
                <p className="login-error">{statsError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setStats(null)
                    setIsLoggedIn(false)
                    setIsLoggedIn(true)
                  }}
                >
                  Retry statistics
                </button>
              </div>
            )}

            <section className="stats-grid">
              <StatCard
                title="Active Alerts"
                value={
                  statsLoading && !stats
                    ? '…'
                    : stats?.activeAlerts ?? '—'
                }
                icon="⚠"
                color="red"
              />

              <StatCard
                title="Pending Requests"
                value={
                  statsLoading && !stats
                    ? '…'
                    : stats?.pendingRequests ?? '—'
                }
                icon="🚨"
                color="orange"
              />

              <StatCard
                title="Available Volunteers"
                value={
                  statsLoading && !stats
                    ? '…'
                    : stats?.activeVolunteers ?? '—'
                }
                icon="♧"
                color="green"
              />

              <StatCard
                title="Completed Requests"
                value={
                  statsLoading && !stats
                    ? '…'
                    : stats?.completedRequests ?? '—'
                }
                icon="✓"
                color="blue"
              />
            </section>

            <section className="content-grid">
              <div className="card map-card">
                <div className="section-heading">
                  <div>
                    <h2>Live Disaster Map</h2>
                    <p>
                      View disaster locations, affected areas, shelters,
                      and available volunteers.
                    </p>
                  </div>
                  <span className="live-label">MAP</span>
                </div>

                <div className="map-wrapper">
                  <DisasterMap dashboardType="admin" />
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === 'Disaster Alerts' && <DisasterAlerts />}
        {activePage === 'Emergency Requests' && <EmergencyRequests />}
        {activePage === 'Volunteers' && <Volunteers />}
        {activePage === 'Users' && <Users />}
        {activePage === 'Notifications' && <Notifications />}
        {activePage === 'Reports' && <Reports />}
        {activePage === 'Shelters' && <Shelters />}

        {activePage !== 'Dashboard' &&
          activePage !== 'Disaster Alerts' &&
          activePage !== 'Emergency Requests' &&
          activePage !== 'Volunteers' &&
          activePage !== 'Users' &&
          activePage !== 'Notifications' &&
          activePage !== 'Reports' &&
          activePage !== 'Shelters' && (
            <section className="card placeholder-card">
              <h2>{activePage}</h2>
              <p>This section will be implemented next.</p>
              {activePage === 'Map' && (
  <DisasterMap dashboardType="admin" />
)}
            </section>
          )}
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </article>
  )
}

export default App