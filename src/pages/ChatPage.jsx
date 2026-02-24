// Path: src/pages/ChatPage.jsx
import { useEffect, useRef, useState } from 'react'
import MessageList from '../components/MessageList.jsx'
import ChatInput from '../components/ChatInput.jsx'

const initialMessages = [
  {
    id: 'm1',
    role: 'ai',
    content: 'Hello! I am otan ai. How can I help you today?',
    time: '09:41'
  },
  {
    id: 'm2',
    role: 'user',
    content: 'Draft a short welcome message for new users.',
    time: '09:42'
  },
  {
    id: 'm3',
    role: 'ai',
    content: 'Sure. Welcome to otan ai — your space for clear answers and steady progress.',
    time: '09:42'
  }
]

const mockResponses = [
  'This is a mock response from otan ai.',
  'Thanks for the message. I can help with that.',
  'Understood. Here is a simple answer to get started.',
  'Noted. Let me know if you want more detail.'
]

function ChatPage() {
  const [messages, setMessages] = useState(initialMessages)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text) => {
    const newMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, newMessage])

    const responseText =
      mockResponses[Math.floor(Math.random() * mockResponses.length)]
    const delay = 800 + Math.floor(Math.random() * 400)

    setTimeout(() => {
      const aiMessage = {
        id: `m${Date.now()}-ai`,
        role: 'ai',
        content: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, aiMessage])
    }, delay)
  }

  return (
    <section className="chat-page">
      <header className="top-bar">
        <div className="top-bar-title">otan ai</div>
        <div className="top-bar-badge">beta</div>
      </header>

      <div className="chat-content">
        <MessageList messages={messages} bottomRef={bottomRef} />
      </div>

      <div className="chat-input-wrapper">
        <ChatInput onSend={handleSend} />
      </div>
    </section>
  )
}

export default ChatPage
