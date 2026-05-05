import { useState } from 'react'

import { FEEDBACK_REASONS, submitAnswerFeedback } from '../../chat/api/feedbackClient.js'

const MAX_COMMENT_LENGTH = 500

function AnswerFeedbackControls({ chatId, currentUser, message, onRequireSignIn }) {
  const [rating, setRating] = useState(null)
  const [isReasonPickerOpen, setIsReasonPickerOpen] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState([])
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async ({ nextRating, reasons = [], nextComment = null }) => {
    if (!message?.id || !chatId || isSubmitting) return
    if (!currentUser) {
      setStatus('Войдите, чтобы оставить отзыв')
      onRequireSignIn?.()
      return
    }

    setIsSubmitting(true)
    setStatus('')
    try {
      const token = await currentUser.getIdToken()
      await submitAnswerFeedback({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        token,
        chatId,
        message,
        rating: nextRating,
        reasons,
        comment: nextComment
      })
      setRating(nextRating)
      setStatus('Спасибо за отзыв')
      setIsReasonPickerOpen(false)
    } catch {
      setStatus('Не удалось отправить отзыв')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleReason = (code) => {
    setSelectedReasons((current) => {
      if (current.includes(code)) {
        return current.filter((item) => item !== code)
      }
      return [...current, code].slice(0, 5)
    })
  }

  return (
    <div className="answer-feedback">
      <button
        aria-label="Оценить ответ положительно"
        className={`chat-message__action answer-feedback__button ${rating === 'up' ? 'is-selected' : ''}`}
        disabled={isSubmitting}
        title="Полезно"
        type="button"
        onClick={() => submit({ nextRating: 'up' })}
      >
        <span aria-hidden="true">👍</span>
      </button>
      <button
        aria-label="Оценить ответ отрицательно"
        className={`chat-message__action answer-feedback__button ${rating === 'down' ? 'is-selected' : ''}`}
        disabled={isSubmitting}
        title="Не полезно"
        type="button"
        onClick={() => {
          if (!currentUser) {
            setStatus('Войдите, чтобы оставить отзыв')
            onRequireSignIn?.()
            return
          }
          setIsReasonPickerOpen((open) => !open)
        }}
      >
        <span aria-hidden="true">👎</span>
      </button>

      {status ? <span className="answer-feedback__status">{status}</span> : null}

      {isReasonPickerOpen ? (
        <div className="answer-feedback__panel">
          <div className="answer-feedback__reasons" aria-label="Причины отзыва">
            {FEEDBACK_REASONS.map((reason) => (
              <label key={reason.code} className="answer-feedback__reason">
                <input
                  checked={selectedReasons.includes(reason.code)}
                  type="checkbox"
                  onChange={() => toggleReason(reason.code)}
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </div>
          <textarea
            className="answer-feedback__comment"
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="Что можно улучшить?"
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
          />
          <div className="answer-feedback__panel-actions">
            <button
              className="answer-feedback__submit"
              disabled={isSubmitting}
              type="button"
              onClick={() => submit({ nextRating: 'down', reasons: selectedReasons, nextComment: comment })}
            >
              Отправить
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AnswerFeedbackControls
