// Path: src/pages/ProfilePage.jsx
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n.js'

function ProfilePage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <section className="page">
      <header className="page-header">
        <h1>{t('profile')}</h1>
      </header>

      <div className="profile-card">
        <div className="avatar">OA</div>
        <div className="profile-fields">
          <div className="field">
            <div className="field-label">{t('displayName')}</div>
            <div className="field-value">Otan User</div>
          </div>
          <div className="field">
            <div className="field-label">{t('email')}</div>
            <div className="field-value">user@example.com</div>
          </div>
          <div className="field">
            <div className="field-label">{t('accountId')}</div>
            <div className="field-value">acc_91KD-OTAN-07</div>
          </div>
        </div>
        <button className="btn btn-secondary" type="button" disabled>
          {t('edit')}
        </button>
      </div>

      <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}
      >
        {t('backToChat')}
      </button>
    </section>
  )
}

export default ProfilePage
