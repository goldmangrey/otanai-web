// Path: src/App.jsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import AuthProvider from './auth/AuthProvider.jsx'
import I18nProvider from './i18n/I18nProvider.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import SupportPage from './pages/SupportPage.jsx'
import AdminSupportPage from './pages/AdminSupportPage.jsx'
import './styles/base.css'
import './styles/layout.css'
import './styles/sidebar.css'
import './styles/chat.css'
import './styles/theme-shell.css'
import './styles/chat-shell.css'
import './styles/auth-modal.css'
import './styles/pages.css'
import './styles/forms.css'
import './styles/support.css'
import { isRichPlaygroundEnabled } from './config/richResponseFlags.js'

const RichResponsePlayground = lazy(() => import('./chat/rich-response/playground/RichResponsePlayground.jsx'))

function RichResponsePlaygroundRoute() {
  const enabled = isRichPlaygroundEnabled()

  if (!enabled) {
    return (
      <div className="content-page">
        <h1>Playground is disabled</h1>
        <p>Enable it with VITE_ENABLE_RICH_RESPONSE_PLAYGROUND=true or VITE_ENABLE_RICH_RESPONSE_DESIGN_MODE=true.</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="content-page">Loading playground...</div>}>
      <RichResponsePlayground />
    </Suspense>
  )
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<ChatPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/admin/support" element={<AdminSupportPage />} />
              <Route path="/dev/rich-response-playground" element={<RichResponsePlaygroundRoute />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
