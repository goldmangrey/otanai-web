// Path: src/pages/AdminSupportPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase.js'
import { hasAdminAccess } from '../utils/support.js'
import SupportTicketList from '../components/support/SupportTicketList.jsx'
import SupportMessageList from '../components/support/SupportMessageList.jsx'
import SupportMessageInput from '../components/support/SupportMessageInput.jsx'

const SUPPORT_COLLECTION = 'supportTickets'

function AdminSupportPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const messagesUnsubRef = useRef(null)

  useEffect(() => {
    if (!hasAdminAccess()) {
      alert('Admin access required.')
      navigate('/settings')
    }
  }, [navigate])

  useEffect(() => {
    const ticketsRef = collection(db, SUPPORT_COLLECTION)
    const ticketsQuery = query(ticketsRef, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        const nextTickets = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          const updatedAt = data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : null
          return {
            id: docSnap.id,
            clientId: data.clientId,
            shortId: data.clientId ? data.clientId.slice(0, 8) : 'unknown',
            status: data.status || 'open',
            lastMessagePreview: data.lastMessagePreview,
            lastMessageFrom: data.lastMessageFrom,
            lastMessageReadByAdmin: data.lastMessageReadByAdmin,
            updatedAtLabel: updatedAt
              ? updatedAt.toLocaleString([], {
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '',
            unread: data.lastMessageFrom === 'user' && data.lastMessageReadByAdmin === false
          }
        })
        setTickets(nextTickets)
        setLoadingTickets(false)

        if (!selectedTicket && nextTickets.length > 0) {
          setSelectedTicket(nextTickets[0])
        }
      },
      (err) => {
        console.error(err)
        setError('Failed to load tickets.')
        setLoadingTickets(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!selectedTicket) {
      setMessages([])
      return
    }

    setLoadingMessages(true)
    messagesUnsubRef.current?.()

    const messagesRef = collection(db, SUPPORT_COLLECTION, selectedTicket.id, 'messages')
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'))

    messagesUnsubRef.current = onSnapshot(
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
        setLoadingMessages(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load messages.')
        setLoadingMessages(false)
      }
    )

    return () => messagesUnsubRef.current?.()
  }, [selectedTicket])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedTicket) return

    const markRead = async () => {
      try {
        const messagesRef = collection(db, SUPPORT_COLLECTION, selectedTicket.id, 'messages')
        const unreadQuery = query(
          messagesRef,
          where('sender', '==', 'user'),
          where('readByAdmin', '==', false)
        )
        const snapshot = await getDocs(unreadQuery)
        if (snapshot.empty) return

        const batch = writeBatch(db)
        snapshot.docs.forEach((docSnap) => {
          batch.update(docSnap.ref, { readByAdmin: true })
        })
        batch.update(doc(db, SUPPORT_COLLECTION, selectedTicket.id), {
          lastMessageReadByAdmin: true
        })
        await batch.commit()
      } catch (err) {
        console.error(err)
      }
    }

    markRead()
  }, [selectedTicket])

  const handleSend = async (text) => {
    if (!selectedTicket || selectedTicket.status === 'closed') return

    try {
      setError('')
      const messagesRef = collection(db, SUPPORT_COLLECTION, selectedTicket.id, 'messages')
      await addDoc(messagesRef, {
        sender: 'admin',
        text,
        createdAt: serverTimestamp(),
        readByAdmin: true,
        readByUser: false
      })

      await updateDoc(doc(db, SUPPORT_COLLECTION, selectedTicket.id), {
        updatedAt: serverTimestamp(),
        lastMessagePreview: text.slice(0, 120),
        lastMessageFrom: 'admin',
        lastMessageReadByAdmin: true,
        lastMessageReadByUser: false
      })
    } catch (err) {
      console.error(err)
      setError('Failed to send admin message.')
    }
  }

  const handleCloseTicket = async () => {
    if (!selectedTicket) return

    try {
      await updateDoc(doc(db, SUPPORT_COLLECTION, selectedTicket.id), {
        status: 'closed',
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error(err)
      setError('Failed to close ticket.')
    }
  }

  const headerTitle = useMemo(() => {
    if (!selectedTicket) return 'Support Admin Panel'
    return `Support Admin Panel · ${selectedTicket.shortId}`
  }, [selectedTicket])

  return (
    <section className="page admin-page">
      <header className="page-header">
        <div>
          <h1>{headerTitle}</h1>
          <p className="page-subtitle">Monitor and respond to support requests.</p>
        </div>
      </header>

      {error ? <div className="support-error">{error}</div> : null}

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title">Open tickets</div>
          {loadingTickets ? (
            <div className="support-empty">Loading tickets...</div>
          ) : (
            <SupportTicketList
              tickets={tickets}
              selectedId={selectedTicket?.id}
              onSelect={setSelectedTicket}
            />
          )}
        </aside>

        <div className="admin-thread">
          <div className="admin-thread-header">
            <div>
              <div className="admin-thread-title">Conversation</div>
              <div className="admin-thread-subtitle">
                {selectedTicket ? `Client ${selectedTicket.shortId}` : 'Select a ticket'}
              </div>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={handleCloseTicket}
              disabled={!selectedTicket || selectedTicket.status === 'closed'}
            >
              Close ticket
            </button>
          </div>

          <div className="admin-thread-body">
            {loadingMessages ? <div className="support-empty">Loading messages...</div> : null}
            {!loadingMessages && selectedTicket ? (
              <SupportMessageList messages={messages} bottomRef={bottomRef} />
            ) : null}
            {!loadingMessages && !selectedTicket ? (
              <div className="support-empty">Select a ticket to view messages.</div>
            ) : null}
          </div>

          <SupportMessageInput
            onSend={handleSend}
            disabled={!selectedTicket || selectedTicket.status === 'closed'}
          />
        </div>
      </div>
    </section>
  )
}

export default AdminSupportPage
