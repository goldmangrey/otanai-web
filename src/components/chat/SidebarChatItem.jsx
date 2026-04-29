function SidebarChatItem({ chat, isActive, onDelete, onRename, onSelect }) {
  return (
    <div className={`chat-sidebar__item ${isActive ? 'is-active' : ''}`}>
      <button className="chat-sidebar__item-main" type="button" onClick={onSelect}>
        <span className="chat-sidebar__item-title">{chat.title}</span>
      </button>
      <span className="chat-sidebar__item-actions">
        <button
          aria-label={`Rename ${chat.title}`}
          className="chat-sidebar__item-action"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRename()
          }}
        >
          ✎
        </button>
        <button
          aria-label={`Delete ${chat.title}`}
          className="chat-sidebar__item-action"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          ×
        </button>
      </span>
    </div>
  )
}

export default SidebarChatItem
