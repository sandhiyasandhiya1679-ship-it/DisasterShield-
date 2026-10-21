
import './AuthForms.css'

function RoleSelection({ onSelect }) {
  return (
    <div className="ds-auth-page">
      <div className="ds-auth-card">
        <div className="ds-auth-logo">🛡️</div>
        <p className="ds-auth-eyebrow">DISASTERSHIELD</p>
        <h1>Emergency Response System</h1>
        <p className="ds-auth-subtitle">
          Select your role to continue.
        </p>

        <button onClick={() => onSelect('admin-login')}>
          Admin Login
        </button>

        <button onClick={() => onSelect('user-login')}>
          User Login
        </button>

        <button
          className="ds-auth-secondary"
          onClick={() => onSelect('user-register')}
        >
          Register as a User
        </button>

        <button onClick={() => onSelect('volunteer-login')}>
          Volunteer Login
        </button>

        <button
          className="ds-auth-secondary"
          onClick={() => onSelect('volunteer-register')}
        >
          Register as a Volunteer
        </button>
      </div>
    </div>
  )
}

export default RoleSelection
