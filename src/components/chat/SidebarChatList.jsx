import SidebarChatItem from './SidebarChatItem.jsx'

const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 days']

function SidebarChatList({ activeChatId, chatsByGroup, onDeleteChat, onRenameChat, onSelectChat }) {
  return (
    <div className="chat-sidebar__history">
      {GROUP_ORDER.filter((group) => chatsByGroup[group]?.length).map((group) => (
        <section key={group} className="chat-sidebar__group">
          <div className="chat-sidebar__group-label">{group}</div>
          <div className="chat-sidebar__group-items">
            {chatsByGroup[group].map((chat) => (
              <SidebarChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onDelete={() => onDeleteChat(chat.id)}
                onRename={() => onRenameChat(chat.id)}
                onSelect={() => onSelectChat(chat.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default SidebarChatList
