// Path: src/pages/ChatPage.jsx
import { useEffect, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase.js'
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
  const [usingFallback, setUsingFallback] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const messagesRef = collection(db, 'messages')
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setUsingFallback(true)
          setMessages(initialMessages)
          return
        }

        const remoteMessages = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            role: data.role,
            content: data.content,
            time: data.time || ''
          }
        })
        setUsingFallback(false)
        setMessages(remoteMessages)
      },
      (error) => {
        console.error('Failed to load messages:', error)
        setUsingFallback(true)
        setMessages(initialMessages)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleSend = (text) => {
    const timeLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

    const newMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      content: text,
      time: timeLabel
    }

    setMessages((prev) => [...prev, newMessage])
    if (usingFallback) {
      setUsingFallback(false)
    }

    const responseText =
      mockResponses[Math.floor(Math.random() * mockResponses.length)]
    const delay = 800 + Math.floor(Math.random() * 400)

    addDoc(collection(db, 'messages'), {
      role: 'user',
      content: text,
      time: timeLabel,
      createdAt: serverTimestamp()
    }).catch((error) => {
      console.error('Failed to send user message:', error)
    })

    setTimeout(() => {
      const aiMessage = {
        id: `m${Date.now()}-ai`,
        role: 'ai',
        content: responseText,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      setMessages((prev) => [...prev, aiMessage])

      addDoc(collection(db, 'messages'), {
        role: 'ai',
        content: responseText,
        time: aiMessage.time,
        createdAt: serverTimestamp()
      }).catch((error) => {
        console.error('Failed to send AI message:', error)
      })
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
