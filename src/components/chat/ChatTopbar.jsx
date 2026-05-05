import { useAuth } from '../../auth/useAuth.js'
import { APP_STORE_URL } from '../../chat/utils/appStore.js'
import { useI18n } from '../../i18n/useI18n.js'

function ChatTopbar({
  isSidebarCollapsed,
  syncLabel,
  title,
  onOpenMobileSidebar,
  onToggleSidebar
}) {
  const { authLoading, currentUser, isAuthenticated, isGuestMode } = useAuth()
  const { t } = useI18n()
  const statusLabel = authLoading
    ? t('loadingSession')
    : isAuthenticated
      ? currentUser?.displayName || t('signedIn')
      : isGuestMode
        ? t('guestMode')
        : t('guestMode')

  return (
    <header className="chat-topbar">
      <div className="chat-topbar__left">
        <button
          aria-label={t('openSidebar')}
          className="chat-topbar__mobile-toggle"
          type="button"
          onClick={onOpenMobileSidebar}
        >
          ☰
        </button>

        <button
          aria-label={isSidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')}
          className="chat-topbar__desktop-toggle"
          type="button"
          onClick={onToggleSidebar}
        >
          {isSidebarCollapsed ? '→' : '←'}
        </button>

        <div className="chat-topbar__title-block">
          <span className="chat-topbar__title">{title}</span>
          <span className="chat-topbar__subtitle">
            {syncLabel || t('localWorkspace')}
          </span>
        </div>
      </div>

      <div className="chat-topbar__right">
        <a
          className="chat-topbar__app-store"
          href={APP_STORE_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="chat-topbar__app-store-full">Скачать в App Store</span>
          <span className="chat-topbar__app-store-short">App Store</span>
        </a>
        <div className="chat-topbar__badge">{statusLabel}</div>
      </div>
    </header>
  )
}

export default ChatTopbar
