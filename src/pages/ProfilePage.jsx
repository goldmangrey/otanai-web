// Path: src/pages/ProfilePage.jsx
import { useNavigate } from 'react-router-dom'

function ProfilePage() {
  const navigate = useNavigate()

  return (
    <section className="page">
      <header className="page-header">
        <h1>Profile</h1>
      </header>

      <div className="profile-card">
        <div className="avatar">OA</div>
        <div className="profile-fields">
          <div className="field">
            <div className="field-label">Display name</div>
            <div className="field-value">Otan User</div>
          </div>
          <div className="field">
            <div className="field-label">Email</div>
            <div className="field-value">user@example.com</div>
          </div>
          <div className="field">
            <div className="field-label">Account ID</div>
            <div className="field-value">acc_91KD-OTAN-07</div>
          </div>
        </div>
        <button className="btn btn-secondary" type="button" disabled>
          Edit
        </button>
      </div>

      <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}
      >
        Back to chat
      </button>
    </section>
  )
}

export default ProfilePage
