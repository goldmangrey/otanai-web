import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n.js'

const navItems = [
  { to: '/', labelKey: 'navChat' },
  { to: '/profile', labelKey: 'navProfile' },
  { to: '/settings', labelKey: 'navSettings' },
  { to: '/support', labelKey: 'navSupport' },
  { to: '/privacy', labelKey: 'navPrivacy' }
]

function Sidebar() {
  const { t } = useI18n()

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__logo">O</div>
        <div>
          <div className="app-sidebar__eyebrow">OtanAI</div>
          <div className="app-sidebar__title">{t('controlPanel')}</div>
        </div>
      </div>

      <nav className="app-sidebar__nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `app-sidebar__link ${isActive ? 'is-active' : ''}`
            }
            to={item.to}
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <NavLink className="app-sidebar__support-link" to="/admin/support">
          {t('navAdminSupport')}
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
