// Path: src/pages/SupportPage.jsx
import { useEffect, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { getOrCreateClientId } from '../utils/support.js'
import SupportMessageList from '../components/support/SupportMessageList.jsx'
import SupportMessageInput from '../components/support/SupportMessageInput.jsx'

const SUPPORT_COLLECTION = 'supportTickets'

function SupportPage() {
  const [clientId, setClientId] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    const id = getOrCreateClientId()
    setClientId(id)
  }, [])

  useEffect(() => {
    if (!clientId) return

    const loadTicket = async () => {
      try {
        setLoading(true)
        const ticketsRef = collection(db, SUPPORT_COLLECTION)
        const ticketsQuery = query(
          ticketsRef,
          where('clientId', '==', clientId),
          where('status', '==', 'open'),
          orderBy('updatedAt', 'desc'),
          limit(1)
        )
        const snapshot = await getDocs(ticketsQuery)
        if (snapshot.empty) {
          setLoading(false)
          return
        }

        const ticketDoc = snapshot.docs[0]
        setTicketId(ticketDoc.id)
      } catch (err) {
        console.error(err)
        setError('Failed to load support ticket.')
        setLoading(false)
      }
    }

    loadTicket()
  }, [clientId])

  useEffect(() => {
    if (!ticketId) return

    const messagesRef = collection(db, SUPPORT_COLLECTION, ticketId, 'messages')
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'))

    unsubscribeRef.current?.()
    unsubscribeRef.current = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            sender: data.sender,
            text: data.text,
            time: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : ''
          }
        })
        setMessages(nextMessages)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load messages.')
        setLoading(false)
      }
    )

    return () => unsubscribeRef.current?.()
  }, [ticketId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const createTicketIfNeeded = async () => {
    if (ticketId) return ticketId

    const ticketRef = await addDoc(collection(db, SUPPORT_COLLECTION), {
      clientId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'open',
      lastMessagePreview: '',
      lastMessageFrom: 'user',
      lastMessageReadByAdmin: false,
      lastMessageReadByUser: true
    })

    setTicketId(ticketRef.id)
    return ticketRef.id
  }

  const handleSend = async (text) => {
    try {
      setError('')
      if (!clientId) {
        setError('Client ID not ready. Please try again.')
        return
      }
      const currentTicketId = await createTicketIfNeeded()
      const messagesRef = collection(db, SUPPORT_COLLECTION, currentTicketId, 'messages')

      await addDoc(messagesRef, {
        sender: 'user',
        text,
        createdAt: serverTimestamp(),
        readByAdmin: false,
        readByUser: true
      })

      await updateDoc(doc(db, SUPPORT_COLLECTION, currentTicketId), {
        updatedAt: serverTimestamp(),
        lastMessagePreview: text.slice(0, 120),
        lastMessageFrom: 'user',
        lastMessageReadByAdmin: false,
        lastMessageReadByUser: true
      })
    } catch (err) {
      console.error(err)
      setError('Failed to send message.')
    }
  }

  return (
    <section className="page support-page">
      <header className="page-header">
        <div>
          <h1>Support</h1>
          <p className="page-subtitle">
            If you have any issues or questions, write to our support team.
          </p>
        </div>
      </header>

      <div className="support-panel">
        <div className="support-thread">
          {loading ? <div className="support-empty">Loading messages...</div> : null}
          {error ? <div className="support-error">{error}</div> : null}
          {!loading && !error ? (
            <SupportMessageList messages={messages} bottomRef={bottomRef} />
          ) : null}
        </div>
        <SupportMessageInput onSend={handleSend} disabled={!!error} />
      </div>
    </section>
  )
}

export default SupportPage
