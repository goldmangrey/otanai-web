import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'

function getAuthErrorMessage(error) {
  if (!error?.code) {
    return 'Unable to sign in right now. Please try again.'
  }

  if (error.code === 'auth/popup-closed-by-user') {
    return 'The sign-in popup was closed before completion.'
  }

  if (error.code === 'auth/popup-blocked') {
    return 'Your browser blocked the sign-in popup. Please allow popups and try again.'
  }

  if (error.code === 'auth/cancelled-popup-request') {
    return 'A sign-in request is already in progress.'
  }

  return 'Unable to sign in with Google right now. Please try again.'
}

function AuthModal({ isOpen, onClose }) {
  const { authLoading, isAuthenticated, signInWithGoogle } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return
    onClose()
  }, [isAuthenticated, isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isBusy = authLoading || isSubmitting

  const handleGoogleSignIn = async () => {
    if (isBusy) return

    try {
      setErrorMessage('')
      setIsSubmitting(true)
      await signInWithGoogle()
      onClose()
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-modal" role="presentation" onClick={onClose}>
      <div
        aria-describedby="auth-modal-description"
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="auth-modal__card"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close sign in modal"
          className="auth-modal__close"
          type="button"
          onClick={onClose}
        >
          ×
        </button>

        <div className="auth-modal__eyebrow">Sign in</div>
        <h2 id="auth-modal-title">Continue with your account</h2>
        <p id="auth-modal-description">
          Keep using OtanAI in guest mode or sign in with Google to prepare for
          future synced chat history.
        </p>

        <div className="auth-modal__actions">
          <button
            className="auth-modal__provider auth-modal__provider--google"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isBusy}
          >
            {isBusy ? 'Connecting to Google…' : 'Continue with Google'}
          </button>
          <button className="auth-modal__provider auth-modal__provider--apple" type="button" disabled>
            Continue with Apple
          </button>
        </div>

        {errorMessage ? <div className="auth-modal__error">{errorMessage}</div> : null}

        <div className="auth-modal__coming-soon">
          <label className="auth-modal__label" htmlFor="auth-email-placeholder">
            Email
          </label>
          <input
            id="auth-email-placeholder"
            className="auth-modal__input"
            placeholder="Email sign-in coming soon"
            type="email"
            disabled
          />
        </div>
      </div>
    </div>
  )
}

export default AuthModal
