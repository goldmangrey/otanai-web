import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  getCodeLanguage,
  hasStrongDocumentStructure,
  isDocumentLanguage,
  isDocumentLike,
  isDocumentPlaceholder,
  isStandaloneDocument,
  shouldRenderDocumentPreview,
  splitDocumentPlaceholders
} from './documentPreview.js'

test('detects document fence language aliases', () => {
  assert.equal(getCodeLanguage('language-document'), 'document')
  assert.equal(isDocumentLanguage('document'), true)
  assert.equal(isDocumentLanguage('doc'), true)
  assert.equal(isDocumentLanguage('template'), true)
  assert.equal(isDocumentLanguage('legal'), false)
})

test('does not classify normal code languages as documents', () => {
  assert.equal(isDocumentLanguage('python'), false)
  assert.equal(isDocumentLanguage('js'), false)
  assert.equal(isDocumentLanguage('bash'), false)
  assert.equal(isDocumentLanguage('json'), false)
})

test('does not detect standalone document-like answer without artifact intent', () => {
  const input = [
    'Кому: [название госоргана]',
    'От: [ФИО]',
    '',
    'ЖАЛОБА',
    '',
    'Прошу рассмотреть обращение.',
    '',
    'Дата: [дата]'
  ].join('\n')

  assert.equal(isStandaloneDocument(input), false)
})

test('detects standalone document-like answer only when artifact intent allows it', () => {
  const input = [
    'Кому: [название госоргана]',
    'От: [ФИО]',
    '',
    'ЖАЛОБА',
    '',
    'Прошу рассмотреть обращение.',
    '',
    'Дата: [дата]'
  ].join('\n')

  assert.equal(isStandaloneDocument(input, {
    artifactIntent: { document_preview_allowed: true },
    answerPlan: { answer_type: 'document_template' },
    responseStylePolicy: { markdown_policy: { use_document_block: true } }
  }), true)
})

test('does not convert normal chat answer mentioning application into document', () => {
  const input = 'Чтобы подать заявление, зайдите на eOtinish и заполните форму.'

  assert.equal(isStandaloneDocument(input), false)
  assert.equal(isDocumentLike(input), false)
})

test('document code fence renders when artifact intent allows it', () => {
  const input = 'ЗАЯВЛЕНИЕ\nОт: [ФИО]\nДата: [дата]'
  const metadata = {
    artifactIntent: { document_preview_allowed: true },
    answerPlan: { answer_type: 'document_template' },
    responseStylePolicy: { markdown_policy: { use_document_block: true } }
  }

  assert.equal(isDocumentLike(input, 'document', metadata), true)
  assert.equal(shouldRenderDocumentPreview(input, 'document', metadata), true)
})

test('document code fence does not render when artifact intent blocks it', () => {
  const input = 'ЗАЯВЛЕНИЕ\nОт: [ФИО]\nДата: [дата]'

  assert.equal(isDocumentLike(input, 'document', { document_preview_allowed: false }), false)
  assert.equal(shouldRenderDocumentPreview(input, 'document', { document_preview_allowed: false }), false)
})

test('old explicit document block fallback requires strong document structure', () => {
  const strong = 'ЗАЯВЛЕНИЕ\nКому: [орган]\nОт: [ФИО]\nИИН: [ИИН]\nДата: [дата]\nПодпись: [подпись]'
  const weak = 'Объяснение правовых рисков договора.'

  assert.equal(hasStrongDocumentStructure(strong), true)
  assert.equal(shouldRenderDocumentPreview(strong, 'document'), false)
  assert.equal(shouldRenderDocumentPreview(weak, 'document'), false)
})

test('document preview is blocked when document_forbidden is true', () => {
  const input = 'ЗАЯВЛЕНИЕ\nОт: [ФИО]\nДата: [дата]'
  const metadata = {
    artifactIntent: { document_preview_allowed: true, document_forbidden: true },
    answerPlan: { answer_type: 'document_template' },
    responseStylePolicy: { markdown_policy: { use_document_block: true } }
  }

  assert.equal(isDocumentLike(input, 'document', metadata), false)
  assert.equal(shouldRenderDocumentPreview(input, 'document', metadata), false)
})

test('document preview requires answer plan and style permission', () => {
  const input = 'ЗАЯВЛЕНИЕ\nОт: [ФИО]\nДата: [дата]'

  assert.equal(shouldRenderDocumentPreview(input, 'document', {
    artifactIntent: { document_preview_allowed: true },
    answerPlan: { answer_type: 'risk_analysis' },
    responseStylePolicy: { markdown_policy: { use_document_block: true } }
  }), false)
  assert.equal(shouldRenderDocumentPreview(input, 'document', {
    artifactIntent: { document_preview_allowed: true },
    answerPlan: { answer_type: 'document_template' },
    responseStylePolicy: { markdown_policy: { use_document_block: false } }
  }), false)
})

test('legal language does not auto-render as document preview', () => {
  const input = 'Объяснение правовых рисков договора.'

  assert.equal(isDocumentLike(input, 'legal', { document_preview_allowed: true }), false)
  assert.equal(shouldRenderDocumentPreview(input, 'legal', { document_preview_allowed: true }), false)
})

test('research answer mentioning договор is not standalone document', () => {
  const input = [
    '## Короткий ответ',
    'Проверьте надежность застройщика перед подписанием договора.',
    '',
    '## Признаки риска',
    '- Не подписывать договор без проверки БИН.',
    '- Проверить судебные дела и разрешения.',
    '',
    '## Источники',
    '- gov.kz'
  ].join('\n')

  assert.equal(isStandaloneDocument(input, { document_preview_allowed: false }), false)
})

test('splits and detects placeholders', () => {
  const parts = splitDocumentPlaceholders('Договор № [номер договора], ИИН: [ИИН]')

  assert.deepEqual(parts.filter(isDocumentPlaceholder), ['[номер договора]', '[ИИН]'])
})
