import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n.js'

function ChatComposer({ isBusy, onSend, onStop }) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = '0px'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`
  }, [value])

  const handleSend = () => {
    const nextValue = value.trim()
    if (!nextValue || isBusy) return
    onSend(nextValue)
    setValue('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={[
        'chat-composer',
        isBusy ? 'is-busy' : '',
        isFocused ? 'is-focused' : '',
        value.trim() ? 'has-value' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="chat-composer__main">
        <textarea
          ref={textareaRef}
          className="chat-composer__input"
          placeholder={isBusy ? t('respondingPlaceholder') : t('messagePlaceholder')}
          rows={1}
          disabled={isBusy}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="chat-composer__footer">
        <div className="chat-composer__tools">
          <button
            aria-label={t('attachUnavailable')}
            className="chat-composer__attach"
            type="button"
            disabled
          >
            ＋
          </button>
          {isBusy ? (
            <button className="chat-composer__chip chat-composer__chip--active" type="button" onClick={onStop}>
              {t('stop')}
            </button>
          ) : null}
        </div>

        <button
          aria-label={t('sendMessage')}
          className="chat-composer__send"
          type="button"
          onClick={handleSend}
          disabled={isBusy || !value.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  )
}

export default ChatComposer
