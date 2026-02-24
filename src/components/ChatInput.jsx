// Path: src/components/ChatInput.jsx
import { useState } from 'react'

function ChatInput({ onSend }) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input">
      <textarea
        className="chat-textarea"
        placeholder="Message otan ai..."
        rows={2}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="btn btn-primary" type="button" onClick={handleSend}>
        Send
      </button>
    </div>
  )
}

export default ChatInput
