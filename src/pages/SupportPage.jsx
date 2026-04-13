// Path: src/pages/SupportPage.jsx
import { useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'

const SUPPORT_REQUESTS_COLLECTION = 'webSupportRequests'
const PRIVACY_POLICY_URL = 'https://otanai.kz/privacy'
const TERMS_OF_USE_URL = 'https://otanai.kz/terms'

const CONTACT_ITEMS = [
  {
    label: 'Phone',
    value: '87083180696',
    href: 'tel:87083180696'
  },
  {
    label: 'Email',
    value: 'yeskendiriskakov@gmail.com',
    href: 'mailto:yeskendiriskakov@gmail.com'
  },
  {
    label: 'Legal name',
    value: 'ИП GOLDMAN'
  },
  {
    label: 'Address',
    value: 'Офис г.Астана Айтматов 40/2'
  },
  {
    label: 'Response time',
    value: 'We respond within 24 hours'
  }
]

const FAQ_ITEMS = [
  {
    question: 'How to cancel subscription?',
    answer: 'Manage it via iPhone Settings > Apple ID > Subscriptions.'
  },
  {
    question: 'Why is my limit reached?',
    answer: 'Daily limits reset at 00:00 (Astana time). Upgrade to Pro for unlimited access.'
  },
  {
    question: 'Is my data private?',
    answer:
      "Yes, we use Google Gemini as a Data Processor. We don't use your data to train AI models."
  },
  {
    question: 'How to Restore Purchases?',
    answer: 'Use the "Restore Purchases" button in the App Settings.'
  },
  {
    question: 'Tez vs Pro modes?',
    answer: 'Tez is for speed; Pro is for complex tasks and high-quality image generation.'
  }
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const overlayStyles = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(5, 5, 9, 0.78)',
  display: 'grid',
  placeItems: 'center',
  padding: '24px',
  zIndex: 1000
}

const modalStyles = {
  width: 'min(100%, 480px)',
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)'
}

const formGridStyles = {
  display: 'grid',
  gap: '16px'
}

const fieldStyles = {
  display: 'grid',
  gap: '8px'
}

const labelStyles = {
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--muted)'
}

const helperStyles = {
  fontSize: '13px',
  color: 'var(--muted)',
  lineHeight: 1.5
}

const contentGridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '20px',
  alignItems: 'start'
}

const stackStyles = {
  display: 'grid',
  gap: '20px'
}

const contactListStyles = {
  display: 'grid',
  gap: '12px'
}

const contactRowStyles = {
  display: 'grid',
  gridTemplateColumns: '140px minmax(0, 1fr)',
  gap: '12px',
  alignItems: 'start',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border)'
}

const contactValueStyles = {
  color: 'var(--text)',
  fontSize: '14px',
  lineHeight: 1.6,
  wordBreak: 'break-word'
}

const legalActionsStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
}

const accordionStyles = {
  display: 'grid',
  gap: '12px'
}

const faqItemStyles = {
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  overflow: 'hidden'
}

const faqQuestionStyles = {
  cursor: 'pointer',
  listStyle: 'none',
  padding: '16px 18px',
  fontWeight: 500
}

const faqAnswerStyles = {
  padding: '0 18px 18px',
  color: 'var(--muted)',
  fontSize: '14px',
  lineHeight: 1.6
}

function SupportPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const trimmedEmail = email.trim()
  const trimmedMessage = message.trim()

  const emailError = useMemo(() => {
    if (!trimmedEmail) return 'Email is required.'
    if (!EMAIL_REGEX.test(trimmedEmail)) return 'Please enter a valid email address.'
    return ''
  }, [trimmedEmail])

  const messageError = useMemo(() => {
    if (!trimmedMessage) return 'Message is required.'
    if (trimmedMessage.length < 10) return 'Message must be at least 10 characters.'
    return ''
  }, [trimmedMessage])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (emailError || messageError) {
      setError(emailError || messageError)
      return
    }

    try {
      setSubmitting(true)
      setError('')

      await addDoc(collection(db, SUPPORT_REQUESTS_COLLECTION), {
        email: trimmedEmail,
        message: trimmedMessage,
        createdAt: serverTimestamp(),
        status: 'new'
      })

      setShowSuccessModal(true)
    } catch (err) {
      console.error(err)
      setError('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    setEmail('')
    setMessage('')
    setError('')
  }

  return (
    <>
      <section className="page support-page">
        <header className="page-header">
          <div>
            <h1>Support</h1>
            <p className="page-subtitle">
              Contact us for app support, billing questions, subscription help, and feature
              requests.
            </p>
          </div>
        </header>

        <div style={contentGridStyles}>
          <div style={stackStyles}>
            <div className="support-panel">
              <div style={{ marginBottom: '4px' }}>
                <h2>Send a Message</h2>
                <p className="page-subtitle">
                  Use the form below for support requests, billing issues, subscription questions,
                  or general feedback.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={formGridStyles} noValidate>
                <div style={fieldStyles}>
                  <label htmlFor="support-email" style={labelStyles}>
                    Email
                  </label>
                  <input
                    id="support-email"
                    className="text-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    aria-invalid={Boolean(email && emailError)}
                  />
                  {email && emailError ? <div className="support-error">{emailError}</div> : null}
                </div>

                <div style={fieldStyles}>
                  <label htmlFor="support-message" style={labelStyles}>
                    Message
                  </label>
                  <textarea
                    id="support-message"
                    className="support-textarea"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Describe your issue, account question, or request in detail."
                    minLength={10}
                    rows={8}
                    required
                    aria-invalid={Boolean(message && messageError)}
                  />
                  <div style={helperStyles}>Minimum 10 characters.</div>
                  {message && messageError ? (
                    <div className="support-error">{messageError}</div>
                  ) : null}
                </div>

                {error ? <div className="support-error">{error}</div> : null}

                <div>
                  <button className="btn btn-primary" type="submit" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>

            <div className="support-panel">
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <h2>Contact Information</h2>
                  <p className="page-subtitle">
                    Official support contact details for OtanAI app users and App Store review.
                  </p>
                </div>

                <div style={contactListStyles}>
                  {CONTACT_ITEMS.map((item) => (
                    <div
                      key={item.label}
                      style={{
                        ...contactRowStyles,
                        borderBottom:
                          item.label === CONTACT_ITEMS[CONTACT_ITEMS.length - 1].label
                            ? 'none'
                            : contactRowStyles.borderBottom,
                        paddingBottom:
                          item.label === CONTACT_ITEMS[CONTACT_ITEMS.length - 1].label ? 0 : '12px'
                      }}
                    >
                      <div style={labelStyles}>{item.label}</div>
                      {item.href ? (
                        <a href={item.href} style={contactValueStyles}>
                          {item.value}
                        </a>
                      ) : (
                        <div style={contactValueStyles}>{item.value}</div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={legalActionsStyles}>
                  <a
                    className="btn btn-ghost"
                    href={PRIVACY_POLICY_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Privacy Policy
                  </a>
                  <a
                    className="btn btn-ghost"
                    href={TERMS_OF_USE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Terms of Use
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="support-panel">
            <div>
              <h2>Frequently Asked Questions</h2>
              <p className="page-subtitle">
                Review these answers for the most common account, subscription, privacy, and
                product usage questions.
              </p>
            </div>

            <div style={accordionStyles}>
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} style={faqItemStyles}>
                  <summary style={faqQuestionStyles}>{item.question}</summary>
                  <div style={faqAnswerStyles}>{item.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showSuccessModal ? (
        <div
          style={overlayStyles}
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-success-title"
        >
          <div style={modalStyles}>
            <h2 id="support-success-title">Message sent successfully!</h2>
            <p style={{ ...helperStyles, color: 'var(--text)', marginBottom: '20px' }}>
              Our team will get back to you within 24 hours.
            </p>
            <button className="btn btn-primary" type="button" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default SupportPage
