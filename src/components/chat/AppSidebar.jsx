import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import { useI18n } from '../../i18n/useI18n.js'
import SidebarChatList from './SidebarChatList.jsx'

function getUserInitials(user) {
  const base = user?.displayName || user?.email || 'Guest'
  return base
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function AppSidebar({
  activeChatId,
  chatsByGroup,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onDeleteChat,
  onNewChat,
  onOpenAuthModal,
  onRenameChat,
  onSelectChat
}) {
  const { authLoading, currentUser, isAuthenticated, signOutUser } = useAuth()
  const { t } = useI18n()

  return (
    <>
      <div
        aria-hidden={!isMobileOpen}
        className={`chat-sidebar-backdrop ${isMobileOpen ? 'is-visible' : ''}`}
        onClick={onCloseMobile}
      />

      <aside
        className={[
          'chat-sidebar',
          isCollapsed ? 'is-collapsed' : '',
          isMobileOpen ? 'is-mobile-open' : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="chat-sidebar__header">
          <div className="chat-sidebar__brand">
            <div className="chat-sidebar__logo">O</div>
            <div className="chat-sidebar__brand-copy">
              <span className="chat-sidebar__eyebrow">Workspace AI</span>
              <strong>OtanAI</strong>
            </div>
          </div>

          <button
            aria-label="Close sidebar"
            className="chat-sidebar__mobile-close"
            type="button"
            onClick={onCloseMobile}
          >
            ×
          </button>
        </div>

        <button className="chat-sidebar__new-chat" type="button" onClick={onNewChat}>
          <span>＋</span>
          <span>{t('newChat')}</span>
        </button>

        <SidebarChatList
          activeChatId={activeChatId}
          chatsByGroup={chatsByGroup}
          onDeleteChat={onDeleteChat}
          onRenameChat={onRenameChat}
          onSelectChat={onSelectChat}
        />

        <div className="chat-sidebar__footer">
          {authLoading ? (
            <div className="chat-sidebar__account is-loading">
              <div className="chat-sidebar__account-avatar">…</div>
              <div className="chat-sidebar__account-copy">
                <strong>{t('loadingSession')}</strong>
                <span>{t('localWorkspace')}</span>
              </div>
            </div>
          ) : isAuthenticated ? (
            <div className="chat-sidebar__account">
              {currentUser?.photoURL ? (
                <img
                  alt={currentUser.displayName || currentUser.email || 'Account'}
                  className="chat-sidebar__account-avatar chat-sidebar__account-avatar--image"
                  src={currentUser.photoURL}
                />
              ) : (
                <div className="chat-sidebar__account-avatar">
                  {getUserInitials(currentUser)}
                </div>
              )}

              <div className="chat-sidebar__account-copy">
                <strong>{currentUser?.displayName || t('signedIn')}</strong>
                <span>{currentUser?.email || t('googleConnected')}</span>
              </div>

              <details className="chat-sidebar__account-menu">
                <summary aria-label={t('openAccountMenu')}>•••</summary>
                <div className="chat-sidebar__account-menu-panel">
                  <NavLink className="chat-sidebar__account-menu-link" to="/settings">
                    {t('settings')}
                  </NavLink>
                  <NavLink className="chat-sidebar__account-menu-link" to="/support">
                    {t('support')}
                  </NavLink>
                  <button
                    className="chat-sidebar__account-menu-link"
                    type="button"
                    onClick={signOutUser}
                  >
                    {t('logOut')}
                  </button>
                </div>
              </details>
            </div>
          ) : (
            <div className="chat-sidebar__auth-row">
              <button className="chat-sidebar__auth-button" type="button" onClick={onOpenAuthModal}>
                {t('signIn')}
              </button>
              <details className="chat-sidebar__account-menu">
                <summary aria-label={t('openSidebarMenu')}>•••</summary>
                <div className="chat-sidebar__account-menu-panel">
                  <NavLink className="chat-sidebar__account-menu-link" to="/settings">
                    {t('settings')}
                  </NavLink>
                  <NavLink className="chat-sidebar__account-menu-link" to="/support">
                    {t('support')}
                  </NavLink>
                </div>
              </details>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default AppSidebar
