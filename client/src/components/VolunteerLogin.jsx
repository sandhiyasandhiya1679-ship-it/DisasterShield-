
import { useState } from 'react'
import { loginVolunteer } from '../services/volunteerService'
import './AuthForms.css'

function VolunteerLogin({ onLogin, onRegister, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginVolunteer({ email, password })

      if (!result.token || !result.volunteer) {
        throw new Error('Invalid login response from server.')
      }

      if (result.volunteer.role !== 'VOLUNTEER') {
        throw new Error('Please use the login page for your account role.')
      }

      localStorage.setItem('volunteerToken', result.token)
      localStorage.setItem('volunteer', JSON.stringify(result.volunteer))

      onLogin?.()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Login failed. Please check your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ds-auth-page">
      <form className="ds-auth-card" onSubmit={handleSubmit}>
        <div className="ds-auth-logo">🛡️</div>
        <p className="ds-auth-eyebrow">DISASTERSHIELD</p>
        <h1>Volunteer Login</h1>
        <p className="ds-auth-subtitle">
          Sign in to manage your emergency assignments.
        </p>

        {error && <div className="ds-auth-error" role="alert">{error}</div>}

        <label htmlFor="volunteer-email">Email Address</label>
        <input
          id="volunteer-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="off"
          required
        />

        <label htmlFor="volunteer-password">Password</label>
        <input
          id="volunteer-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <button
          type="button"
          className="ds-auth-secondary"
          onClick={onRegister}
        >
          Register as a Volunteer
        </button>

        <button
          type="button"
          className="ds-auth-secondary"
          onClick={onBack}
        >
          Back to Role Selection
        </button>
      </form>
    </div>
  )
}

export default VolunteerLogin
