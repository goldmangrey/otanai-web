// Path: src/components/Layout.jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
