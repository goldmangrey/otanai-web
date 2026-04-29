import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createPendingActivity,
  getActivityDisplayLabel,
  normalizeActivity,
  shouldShowResearchActivity
} from './activity.js'

test('normalizeActivity returns empty array for missing input', () => {
  assert.deepEqual(normalizeActivity(undefined), [])
})

test('normalizes metadata activity', () => {
  const output = normalizeActivity({
    activity: [
      {
        type: 'retrieval',
        label: ' Ищу официальные источники ',
        detail: ' adilet.zan.kz, egov.kz ',
        status: 'completed',
        source_domains: ['adilet.zan.kz', 'egov.kz'],
        source_ids: ['src_1'],
        metrics: { retrieved: 2 },
        mode: 'auto_rag',
        phase: 'retrieval'
      }
    ]
  })

  assert.equal(output[0].type, 'retrieval')
  assert.equal(output[0].mode, 'auto_rag')
  assert.equal(output[0].phase, 'retrieval')
  assert.equal(output[0].label, 'Ищу официальные источники')
  assert.equal(output[0].status, 'done')
  assert.deepEqual(output[0].source_domains, ['adilet.zan.kz', 'egov.kz'])
  assert.deepEqual(output[0].source_ids, ['src_1'])
  assert.deepEqual(output[0].metrics, { retrieved: 2 })
})

test('normalizes researchLog into safe activity', () => {
  const output = normalizeActivity({
    researchLog: [
      {
        phase: 'follow_up_search',
        action: 'Выполнен follow-up поиск.',
        reason_summary: 'Проверяю пробел по срокам.',
        status: 'completed'
      }
    ]
  })

  assert.equal(output[0].type, 'retrieval')
  assert.equal(output[0].mode, 'deep_research')
  assert.equal(output[0].phase, 'follow_up_search')
  assert.equal(output[0].label, 'Выполнен follow-up поиск.')
})

test('truncates huge details and removes duplicates', () => {
  const longDetail = 'x'.repeat(400)
  const output = normalizeActivity({
    activity: [
      { type: 'reading', label: 'Извлекаю факты', detail: longDetail, status: 'done' },
      { type: 'reading', label: 'Извлекаю факты', detail: longDetail, status: 'done' }
    ]
  })

  assert.equal(output.length, 1)
  assert.ok(output[0].detail.length < 190)
})

test('ignores hidden reasoning fields', () => {
  const output = normalizeActivity({
    activity: [
      {
        type: 'verification',
        label: 'Проверяю источники',
        status: 'done',
        chain_of_thought: 'private'
      },
      {
        type: 'synthesis',
        label: 'Формирую ответ',
        status: 'done'
      }
    ]
  })

  assert.equal(output.length, 1)
  assert.equal(output[0].type, 'synthesis')
})

test('generic routing and synthesis activity is hidden', () => {
  const activity = normalizeActivity({
    activity: [
      { type: 'routing', phase: 'routing', mode: 'chat', label: 'Определяю тип запроса', status: 'done' },
      { type: 'synthesis', phase: 'synthesis', mode: 'chat', label: 'Формирую ответ', status: 'done' }
    ]
  })

  assert.equal(shouldShowResearchActivity(activity, { mode: 'chat' }), false)
})

test('activity with fewer than three items is hidden', () => {
  const activity = normalizeActivity({
    activity: [
      { phase: 'retrieval', mode: 'auto_rag', label: 'Ищу источники', status: 'done' },
      { phase: 'verification', mode: 'auto_rag', label: 'Проверяю', status: 'done' }
    ]
  })

  assert.equal(shouldShowResearchActivity(activity, { autoRag: { enabled: true } }), false)
})

test('auto-rag verification activity is visible and labeled', () => {
  const metadata = {
    activityLabel: 'Ход проверки',
    activityMode: 'verification',
    activity: [
      { phase: 'routing', mode: 'auto_rag', label: 'Определяю модуль', status: 'done' },
      { phase: 'retrieval', mode: 'auto_rag', label: 'Ищу источники', status: 'done' },
      { phase: 'source_compilation', mode: 'auto_rag', label: 'Отбираю источники', status: 'done' },
      { phase: 'verification', mode: 'auto_rag', label: 'Проверяю', status: 'done' },
      { phase: 'synthesis', mode: 'auto_rag', label: 'Формирую ответ', status: 'done' }
    ]
  }
  const activity = normalizeActivity(metadata)

  assert.equal(shouldShowResearchActivity(activity, metadata), true)
  assert.equal(getActivityDisplayLabel(activity, metadata), 'Ход проверки')
})

test('deep research activity is visible and labeled', () => {
  const metadata = {
    activity: [
      { phase: 'planning', mode: 'deep_research', label: 'Планирую', status: 'done' },
      { phase: 'retrieval', mode: 'deep_research', label: 'Ищу источники', status: 'done' },
      { phase: 'follow_up', mode: 'deep_research', label: 'Дополнительный поиск', status: 'done' }
    ]
  }
  const activity = normalizeActivity(metadata)

  assert.equal(shouldShowResearchActivity(activity, metadata), true)
  assert.equal(getActivityDisplayLabel(activity, metadata), 'Ход исследования')
})

test('createPendingActivity does not create fake normal chat activity', () => {
  const output = createPendingActivity()

  assert.deepEqual(output, [])
})
