import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_LEGAL_DISCLAIMER,
  canonicalLegalPartType,
  normalizeChecklistPart,
  normalizeLegalCitationPart,
  normalizeLegalDisclaimerPart,
  normalizeLegalPart,
  normalizeMissingInfoPart,
  normalizeRiskLevel,
  normalizeRiskPart,
  normalizeSuggestedActionsPart,
  normalizeTimelinePart,
  normalizeWarningPart,
  valueToText
} from './legalBlockUtils.js'

test('canonicalLegalPartType maps aliases', () => {
  assert.equal(canonicalLegalPartType('legal_basis'), 'legal_citation')
  assert.equal(canonicalLegalPartType('citation'), 'legal_citation')
  assert.equal(canonicalLegalPartType('callout'), 'warning')
  assert.equal(canonicalLegalPartType('alert'), 'warning')
  assert.equal(canonicalLegalPartType('risk_warning'), 'risk')
  assert.equal(canonicalLegalPartType('next_steps'), 'checklist')
  assert.equal(canonicalLegalPartType('required_info'), 'missing_info')
  assert.equal(canonicalLegalPartType('actions'), 'suggested_actions')
  assert.equal(canonicalLegalPartType('disclaimer'), 'legal_disclaimer')
})

test('valueToText handles primitives and objects', () => {
  assert.equal(valueToText('text'), 'text')
  assert.equal(valueToText(12), '12')
  assert.equal(valueToText(false), 'false')
  assert.equal(valueToText(null), '')
  assert.equal(valueToText(undefined), '')
  assert.equal(valueToText({ text: 'from text' }), 'from text')
  assert.equal(valueToText({ value: 'from value' }), 'from value')
  assert.equal(valueToText({ label: 'from label' }), 'from label')
  assert.equal(valueToText({ code: 'A1' }), '{"code":"A1"}')
})

test('normalizeLegalCitationPart supports flat and nested citation and safe url', () => {
  const flat = normalizeLegalCitationPart({
    type: 'legal_citation',
    title: 'ГК РК',
    article: 'Статья 9',
    status: 'active',
    url: 'https://adilet.zan.kz'
  })
  assert.equal(flat.type, 'legal_citation')
  assert.equal(flat.title, 'ГК РК')
  assert.equal(flat.status, 'active')
  assert.equal(flat.url, 'https://adilet.zan.kz')

  const nested = normalizeLegalCitationPart({
    type: 'citation',
    citation: {
      title: 'Источник',
      url: 'javascript:alert(1)'
    }
  })
  assert.equal(nested.title, 'Источник')
  assert.equal(nested.url, null)
})

test('normalizeLegalCitationPart uses fallback title and status', () => {
  const citation = normalizeLegalCitationPart({})
  assert.equal(citation.title, 'Правовой источник')
  assert.equal(citation.status, 'unknown')
})

test('normalizeWarningPart normalizes text variants and items', () => {
  assert.equal(normalizeWarningPart({ message: 'Критично проверить срок', severity: 'critical' }).variant, 'danger')
  assert.equal(normalizeWarningPart({ text: 'Готово', variant: 'success' }).variant, 'success')
  assert.equal(normalizeWarningPart({ text: 'Info', variant: 'info', items: ['A'] }).items[0].text, 'A')
})

test('normalizeRiskPart detects risk levels and mitigation', () => {
  assert.equal(normalizeRiskLevel('низкий'), 'low')
  assert.equal(normalizeRiskLevel('medium'), 'medium')
  assert.equal(normalizeRiskLevel('высокий'), 'high')
  assert.equal(normalizeRiskLevel('срочно'), 'danger')
  assert.equal(normalizeRiskLevel('other'), 'neutral')

  const risk = normalizeRiskPart({
    text: 'Есть риск',
    level: 'medium',
    items: [{ title: 'Срок', text: 'Проверить дату', mitigation: 'Сохранить доказательства' }]
  })
  assert.equal(risk.level, 'medium')
  assert.equal(risk.items[0].mitigation, 'Сохранить доказательства')
})

test('normalizeChecklistPart supports string and object items', () => {
  const checklist = normalizeChecklistPart({
    type: 'next_steps',
    items: ['Собрать договор', { text: 'Отправить претензию', checked: true, hint: 'Почтой' }]
  })
  assert.equal(checklist.type, 'checklist')
  assert.equal(checklist.items[0].text, 'Собрать договор')
  assert.equal(checklist.items[1].checked, true)
  assert.equal(checklist.items[1].hint, 'Почтой')
})

test('normalizeTimelinePart supports statuses and preserves order', () => {
  const timeline = normalizeTimelinePart({
    items: [
      { label: 'Шаг 1', title: 'Подготовить', status: 'done' },
      { label: 'Шаг 2', title: 'Подать', status: 'blocked' }
    ]
  })
  assert.deepEqual(timeline.items.map((item) => item.status), ['done', 'blocked'])
  assert.equal(timeline.items[0].label, 'Шаг 1')
})

test('normalizeMissingInfoPart normalizes items and question chips', () => {
  const missing = normalizeMissingInfoPart({
    type: 'required_info',
    items: ['Дата события'],
    questions: [{ label: 'Когда?', value: 'date' }]
  })
  assert.equal(missing.type, 'missing_info')
  assert.equal(missing.items[0].text, 'Дата события')
  assert.deepEqual(missing.questions[0], { label: 'Когда?', value: 'date', kind: 'secondary', disabled: false })
})

test('normalizeSuggestedActionsPart supports strings and objects', () => {
  const suggested = normalizeSuggestedActionsPart({
    type: 'actions',
    actions: ['Сделать претензию', { label: 'Загрузить договор', value: 'upload', kind: 'primary' }]
  })
  assert.equal(suggested.type, 'suggested_actions')
  assert.equal(suggested.actions[0].value, 'Сделать претензию')
  assert.equal(suggested.actions[1].kind, 'primary')
})

test('normalizeLegalDisclaimerPart uses fallback and custom text', () => {
  assert.equal(normalizeLegalDisclaimerPart({}).text, DEFAULT_LEGAL_DISCLAIMER)
  assert.equal(normalizeLegalDisclaimerPart({ text: 'Custom', collapsed: false }).collapsed, false)
})

test('normalizeLegalPart canonicalizes aliases', () => {
  assert.equal(normalizeLegalPart({ type: 'legal_basis', title: 'Кодекс' }).type, 'legal_citation')
  assert.equal(normalizeLegalPart({ type: 'risk_warning', text: 'Риск' }).type, 'risk')
})
