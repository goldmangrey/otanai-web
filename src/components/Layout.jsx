import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

function Layout() {
  const location = useLocation()
  const isChatRoute = location.pathname === '/'

  return (
    <div className={`app-shell ${isChatRoute ? 'app-shell--chat' : ''}`}>
      {!isChatRoute ? <Sidebar /> : null}
      <main className={`main-area ${isChatRoute ? 'main-area--chat' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
