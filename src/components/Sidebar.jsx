// Path: src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom'

const mockChats = [
  { id: 'c1', title: 'Chat about math' },
  { id: 'c2', title: 'Travel ideas' },
  { id: 'c3', title: 'Draft a resume' },
  { id: 'c4', title: 'Marketing copy' },
  { id: 'c5', title: 'Project planning' }
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="app-name">otan ai</div>
        <button className="btn btn-primary btn-full" type="button">
          New chat
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Chats</div>
        <ul className="chat-list">
          {mockChats.map((chat) => (
            <li key={chat.id} className="chat-list-item">
              <span className="chat-icon">●</span>
              <span className="chat-title">{chat.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <NavLink className="btn btn-ghost btn-full" to="/profile">
          Profile
        </NavLink>
        <NavLink className="btn btn-ghost btn-full" to="/settings">
          Settings
        </NavLink>
        <NavLink className="btn btn-link btn-full" to="/privacy">
          Privacy Policy
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
