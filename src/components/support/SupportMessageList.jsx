// Path: src/components/support/SupportMessageList.jsx
function SupportMessageList({ messages, bottomRef }) {
  return (
    <div className="support-messages">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`support-message-row ${
            message.sender === 'user' ? 'is-user' : 'is-admin'
          }`}
        >
          <div className="support-message-bubble">
            <p>{message.text}</p>
            {message.time ? <span className="support-message-time">{message.time}</span> : null}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

export default SupportMessageList
