
import { useCallback, useEffect, useState } from 'react'
import { getAdminUsers } from '../services/userService'
import './Users.css'

function formatLocation(location, address) {
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
  }

  return 'Not provided'
}

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminUsers()
      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load users.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = users.filter((user) => {
    const searchableText = [
      user.fullName,
      user.email,
      user.mobile,
      user.address,
      formatLocation(user.location, user.address)
    ]
      .filter((value) => typeof value === 'string')
      .join(' ')
      .toLowerCase()

    return searchableText.includes(search.toLowerCase())
  })

  return (
    <section className="users-page">
      <div className="users-heading">
        <div>
          <h2>Registered Users</h2>
          <p>View people registered in the DisasterShield system.</p>
        </div>

        <button
          className="users-refresh"
          onClick={loadUsers}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="users-summary">
        <div className="users-summary-card">
          <span className="users-icon">👥</span>
          <div>
            <p>Total Registered Users</p>
            <h3>{users.length}</h3>
          </div>
        </div>
      </div>

      <div className="users-toolbar">
        <input
          type="search"
          placeholder="Search by name, email, mobile or location..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search registered users"
        />

        <span>
          Showing {filteredUsers.length} of {users.length}
        </span>
      </div>

      {error && (
        <div className="users-error">
          <p>{error}</p>
          <button onClick={loadUsers}>Try again</button>
        </div>
      )}

      {loading ? (
        <div className="users-empty">Loading registered users...</div>
      ) : !error && filteredUsers.length === 0 ? (
        <div className="users-empty">
          <span>👤</span>
          <h3>{search ? 'No matching users' : 'No registered users'}</h3>
          <p>
            {search
              ? 'Try another search term.'
              : 'Registered users will appear here.'}
          </p>
        </div>
      ) : (
        !error && (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Location</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="users-name-cell">
                        <div className="users-avatar">
                          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span>{user.fullName || 'Unnamed User'}</span>
                      </div>
                    </td>

                    <td>{user.email || 'Not provided'}</td>
                    <td>{user.mobile || 'Not provided'}</td>
                    <td>
                      {formatLocation(user.location, user.address)}
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'Not available'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  )
}

export default Users
