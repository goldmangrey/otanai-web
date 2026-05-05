function AuthBenefitModal({ isOpen, onClose, onSignIn }) {
  if (!isOpen) return null

  return (
    <div className="auth-benefit-modal" role="presentation" onClick={onClose}>
      <div
        aria-describedby="auth-benefit-modal-description"
        aria-labelledby="auth-benefit-modal-title"
        aria-modal="true"
        className="auth-benefit-modal__card"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Закрыть уведомление"
          className="auth-benefit-modal__close"
          type="button"
          onClick={onClose}
        >
          ×
        </button>

        <h2 id="auth-benefit-modal-title">
          Получайте ответы, адаптированные специально для вас
        </h2>
        <p id="auth-benefit-modal-description">
          Войдите в OtanAI, чтобы получать более точные ответы с учётом ваших
          сохранённых чатов, истории запросов и live-проверки источников.
        </p>

        <ul className="auth-benefit-modal__list">
          <li>live-ход проверки ответа;</li>
          <li>сохранение истории чатов;</li>
          <li>источники и качество ответа;</li>
          <li>возможность оставить отзыв.</li>
        </ul>

        <div className="auth-benefit-modal__actions">
          <button className="auth-benefit-modal__primary" type="button" onClick={onSignIn}>
            Войти
          </button>
          <button className="auth-benefit-modal__secondary" type="button" onClick={onClose}>
            Не сейчас
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthBenefitModal
