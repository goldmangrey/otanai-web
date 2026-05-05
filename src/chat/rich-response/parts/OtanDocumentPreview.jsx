import { useMemo, useState } from 'react'

import { copyText } from '../../utils/clipboard.js'
import {
  documentToPlainText,
  normalizeDocumentPreviewPart,
  shouldCollapseDocumentContent
} from './documentPreviewUtils.js'

const PREVIEW_LENGTH = 1000

const KIND_LABELS = {
  claim: 'Претензия',
  application: 'Заявление',
  lawsuit: 'Иск',
  complaint: 'Жалоба',
  contract: 'Договор',
  notice: 'Уведомление',
  document: 'Документ'
}

const STATUS_LABELS = {
  draft: 'Черновик',
  ready: 'Готово',
  final: 'Финальный',
  analysis: 'Анализ',
  uploaded: 'Загружен'
}

const LANGUAGE_LABELS = {
  ru: 'Русский',
  kk: 'Қазақша',
  kz: 'Қазақша',
  en: 'English'
}

function labelFromMap(value, map) {
  const key = String(value || '').trim().toLowerCase()
  return map[key] || value || ''
}

function DocumentBadge({ children, variant }) {
  if (!children) return null
  return (
    <span className={`otan-document-preview__badge otan-document-preview__badge--${variant}`}>
      {children}
    </span>
  )
}

function FieldsList({ fields }) {
  if (!fields.length) return null

  return (
    <section className="otan-document-preview__section">
      <h4 className="otan-document-preview__section-title">Основные поля</h4>
      <dl className="otan-document-preview__fields">
        {fields.map((field, index) => (
          <div className="otan-document-preview__field" key={`${field.label}-${index}`}>
            <dt className="otan-document-preview__field-label">{field.label}</dt>
            <dd className="otan-document-preview__field-value">{field.value || 'Не указано'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function RisksList({ risks }) {
  if (!risks.length) return null

  return (
    <section className="otan-document-preview__section">
      <h4 className="otan-document-preview__section-title">Риски</h4>
      <ul className="otan-document-preview__risks">
        {risks.map((risk, index) => (
          <li
            className={`otan-document-preview__risk otan-document-preview__risk--${risk.level}`}
            key={`${risk.level}-${index}`}
          >
            {risk.text}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ActionsList({ actions }) {
  if (!actions.length) return null

  return (
    <section className="otan-document-preview__section">
      <h4 className="otan-document-preview__section-title">Действия</h4>
      <ul className="otan-document-preview__action-list">
        {actions.map((action, index) => (
          <li key={`${action.label}-${index}`}>{action.label}</li>
        ))}
      </ul>
    </section>
  )
}

function ContentPreview({ content }) {
  const [expanded, setExpanded] = useState(false)
  const shouldCollapse = shouldCollapseDocumentContent(content)
  const visibleText = shouldCollapse && !expanded
    ? `${String(content).slice(0, PREVIEW_LENGTH).trimEnd()}...`
    : content

  if (!content) return null

  return (
    <section className="otan-document-preview__section">
      <h4 className="otan-document-preview__section-title">Предпросмотр текста</h4>
      <div className="otan-document-preview__content">
        <pre className="otan-document-preview__content-text">{visibleText}</pre>
      </div>
      {shouldCollapse ? (
        <button
          className="otan-document-preview__button otan-document-preview__button--ghost"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Свернуть' : 'Показать полностью'}
        </button>
      ) : null}
    </section>
  )
}

function OtanDocumentPreview({ part = null, isStreaming = false }) {
  const normalizedPart = useMemo(() => normalizeDocumentPreviewPart(part), [part])
  const document = normalizedPart.document
  const [isCopied, setIsCopied] = useState(false)
  const plainText = documentToPlainText(document)
  const hasContent = Boolean(plainText)

  async function handleCopy() {
    if (!plainText) return
    const copied = await copyText(plainText)
    if (!copied) return

    setIsCopied(true)
    window.setTimeout(() => setIsCopied(false), 1500)
  }

  return (
    <section
      className="otan-document-preview"
      aria-busy={isStreaming || undefined}
      aria-label={document.title || 'Document preview'}
    >
      <header className="otan-document-preview__header">
        <div className="otan-document-preview__heading">
          <span className="otan-document-preview__eyebrow">Документ</span>
          <h3 className="otan-document-preview__title">{document.title || 'Документ'}</h3>
          <div className="otan-document-preview__meta" aria-label="Document metadata">
            <DocumentBadge variant="kind">{labelFromMap(document.kind, KIND_LABELS)}</DocumentBadge>
            <DocumentBadge variant="status">{labelFromMap(document.status, STATUS_LABELS)}</DocumentBadge>
            <DocumentBadge variant="language">{labelFromMap(document.language, LANGUAGE_LABELS)}</DocumentBadge>
          </div>
        </div>
        <div className="otan-document-preview__actions">
          <button
            className="otan-document-preview__button"
            type="button"
            disabled={!hasContent}
            onClick={handleCopy}
          >
            {isCopied ? 'Скопировано' : 'Скопировать'}
          </button>
        </div>
      </header>

      {document.fileName ? (
        <p className="otan-document-preview__file">
          Файл: <span>{document.fileName}</span>
        </p>
      ) : null}

      {document.summary ? (
        <section className="otan-document-preview__section">
          <h4 className="otan-document-preview__section-title">Кратко</h4>
          <p className="otan-document-preview__summary">{document.summary}</p>
        </section>
      ) : null}

      <FieldsList fields={document.fields} />
      <RisksList risks={document.risks} />
      <ContentPreview content={document.content} />
      <ActionsList actions={document.actions} />

      {!document.summary && !document.fields.length && !document.risks.length && !document.content ? (
        <p className="otan-document-preview__empty">Документ без данных для предпросмотра</p>
      ) : null}
    </section>
  )
}

export default OtanDocumentPreview
