// Path: src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAdminAccess } from '../utils/support.js'

function SettingsPage() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('English')
  const [showTime, setShowTime] = useState(true)
  const [status, setStatus] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')

  const handleSave = () => {
    setStatus('Settings saved')
    setTimeout(() => setStatus(''), 2000)
  }

  const handleAdminAccess = () => {
    if (adminPassword === 'otanai2026') {
      setAdminAccess(true)
      setAdminError('')
      navigate('/admin/support')
      return
    }
    setAdminError('Wrong password')
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-section">
        <h2>Theme</h2>
        <label className="radio-item">
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === 'dark'}
            onChange={() => setTheme('dark')}
          />
          Dark (default)
        </label>
        <label className="radio-item disabled">
          <input type="radio" name="theme" value="light" disabled />
          Light (coming soon)
        </label>
      </div>

      <div className="settings-section">
        <h2>Interface language</h2>
        <select
          className="select"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option>English</option>
          <option>Русский</option>
        </select>
      </div>

      <div className="settings-section">
        <h2>Chat settings</h2>
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={showTime}
            onChange={(event) => setShowTime(event.target.checked)}
          />
          Show time for each message
        </label>
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary" type="button" onClick={handleSave}>
          Save settings
        </button>
        {status ? <span className="status">{status}</span> : null}
      </div>

      <div className="settings-section">
        <h2>Support</h2>
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/support')}>
          Contact support
        </button>
      </div>

      <div className="settings-section">
        <h2>Admin panel</h2>
        <p className="settings-hint">
          Enter the admin password to access the support operator view.
        </p>
        <div className="admin-access">
          <input
            className="text-input"
            type="password"
            placeholder="Admin password"
            value={adminPassword}
            onChange={(event) => {
              setAdminPassword(event.target.value)
              setAdminError('')
            }}
          />
          <button className="btn btn-primary" type="button" onClick={handleAdminAccess}>
            Admin panel
          </button>
        </div>
        {adminError ? <span className="status error-text">{adminError}</span> : null}
      </div>

      <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>
        Back to chat
      </button>
    </section>
  )
}

export default SettingsPage
