// Path: src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { languages } from '../i18n/translations.js'
import { useI18n } from '../i18n/useI18n.js'
import { setAdminAccess } from '../utils/support.js'

function SettingsPage() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useI18n()
  const [theme, setTheme] = useState('dark')
  const [showTime, setShowTime] = useState(true)
  const [status, setStatus] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')

  const handleSave = () => {
    setStatus(t('settingsSaved'))
    setTimeout(() => setStatus(''), 2000)
  }

  const handleAdminAccess = () => {
    if (adminPassword === 'otanai2026') {
      setAdminAccess(true)
      setAdminError('')
      navigate('/admin/support')
      return
    }
    setAdminError(t('wrongPassword'))
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>{t('settings')}</h1>
      </header>

      <div className="settings-section">
        <h2>{t('theme')}</h2>
        <label className="radio-item">
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === 'dark'}
            onChange={() => setTheme('dark')}
          />
          {t('darkDefault')}
        </label>
        <label className="radio-item disabled">
          <input type="radio" name="theme" value="light" disabled />
          {t('lightSoon')}
        </label>
      </div>

      <div className="settings-section">
        <h2>{t('interfaceLanguage')}</h2>
        <select
          className="select"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <h2>{t('chatSettings')}</h2>
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={showTime}
            onChange={(event) => setShowTime(event.target.checked)}
          />
          {t('showTime')}
        </label>
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary" type="button" onClick={handleSave}>
          {t('saveSettings')}
        </button>
        {status ? <span className="status">{status}</span> : null}
      </div>

      <div className="settings-section">
        <h2>{t('support')}</h2>
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/support')}>
          {t('contactSupport')}
        </button>
      </div>

      <div className="settings-section">
        <h2>{t('adminPanel')}</h2>
        <p className="settings-hint">
          {t('adminHint')}
        </p>
        <div className="admin-access">
          <input
            className="text-input"
            type="password"
            placeholder={t('adminPassword')}
            value={adminPassword}
            onChange={(event) => {
              setAdminPassword(event.target.value)
              setAdminError('')
            }}
          />
          <button className="btn btn-primary" type="button" onClick={handleAdminAccess}>
            {t('adminPanel')}
          </button>
        </div>
        {adminError ? <span className="status error-text">{adminError}</span> : null}
      </div>

      <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>
        {t('backToChat')}
      </button>
    </section>
  )
}

export default SettingsPage
