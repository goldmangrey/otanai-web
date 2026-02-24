// Path: src/components/MessageList.jsx
import MessageBubble from './MessageBubble.jsx'

function MessageList({ messages, bottomRef }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          time={message.time}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
