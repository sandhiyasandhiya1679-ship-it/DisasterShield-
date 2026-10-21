
import { useState } from 'react'
import { loginUser } from '../services/userService'
import './AuthForms.css'

function UserLogin({ onLogin, onRegister, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginUser({ email, password })

      if (!result.token || !result.user) {
        throw new Error('Invalid login response from server.')
      }

      if (result.user.role !== 'USER') {
        throw new Error('Please use the login page for your account role.')
      }

      localStorage.setItem('userToken', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))

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
        <h1>User Login</h1>
        <p className="ds-auth-subtitle">
          Sign in to view alerts and emergency assistance.
        </p>

        {error && <div className="ds-auth-error" role="alert">{error}</div>}

        <label htmlFor="login-user-email">Email Address</label>
        <input
          id="login-user-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="off"
          required
        />

        <label htmlFor="login-user-password">Password</label>
        <input
          id="login-user-password"
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
          Create a User Account
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

export default UserLogin
