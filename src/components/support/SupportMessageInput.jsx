// Path: src/components/support/SupportMessageInput.jsx
import { useState } from 'react'

function SupportMessageInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
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
    <div className="support-input">
      <textarea
        className="support-textarea"
        rows={2}
        placeholder="Write to support..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button className="btn btn-primary" type="button" onClick={handleSend} disabled={disabled}
      >
        Send
      </button>
    </div>
  )
}

export default SupportMessageInput
