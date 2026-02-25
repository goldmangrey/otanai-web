// Path: src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
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
import './styles/pages.css'
import './styles/forms.css'
import './styles/support.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/admin/support" element={<AdminSupportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
