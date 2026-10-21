import { useState } from 'react'
import api from '../services/api'
import './AuthForms.css'

function AdminLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/admin/login', {
        email,
        password,
      })

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('admin', JSON.stringify(response.data.admin))

      onLogin()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to log in. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="ds-auth-page">
      <form className="ds-auth-card" onSubmit={handleSubmit}>
        <div className="ds-auth-logo">🛡️</div>
        <p className="ds-auth-eyebrow">DISASTERSHIELD</p>
        <h1>Administrator Login</h1>
        <p className="ds-auth-subtitle">
          Sign in to manage disaster alerts and emergency responses.
        </p>

        <label htmlFor="admin-email">Email address</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="off"
          required
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="ds-auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <button
          type="button"
          className="ds-auth-secondary"
          onClick={onBack}
        >
          ← Back to Role Selection
        </button>
      </form>
    </main>
  )
}

export default AdminLogin