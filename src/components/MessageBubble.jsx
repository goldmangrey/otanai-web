// Path: src/components/MessageBubble.jsx
function MessageBubble({ role, content, time }) {
  const isUser = role === 'user'
  return (
    <div className={`message-row ${isUser ? 'message-row-user' : 'message-row-ai'}`}>
      <div className={`message-bubble ${isUser ? 'message-user' : 'message-ai'}`}>
        <p className="message-text">{content}</p>
        {time ? <span className="message-time">{time}</span> : null}
      </div>
    </div>
  )
}

export default MessageBubble
