import test from 'node:test'
import assert from 'node:assert/strict'

import {
  activityToText,
  getQualitySummary,
  getSourceCount,
  getStreamingHeadline,
  normalizeActivityItems,
  normalizeStreamingActivity,
  shouldShowStreamingActivity
} from './streamingActivityUtils.js'

test('fallback headline is safe', () => {
  assert.equal(getStreamingHeadline({ metadata: {} }), 'OtanAI формирует ответ...')
})

test('activityToText supports strings and objects', () => {
  assert.equal(activityToText('Ищу источники'), 'Ищу источники')
  assert.equal(activityToText({ label: 'Проверяю норму' }), 'Проверяю норму')
  assert.equal(activityToText({ action: 'Формирую ответ' }), 'Формирую ответ')
})

test('normalizeActivityItems supports metadata activity shapes', () => {
  const items = normalizeActivityItems({
    activity: ['Ищу источники', { label: 'Формирую ответ', status: 'running' }],
    currentActivity: { label: 'Финальная проверка' }
  })

  assert.deepEqual(items.map((item) => item.text), ['Ищу источники', 'Формирую ответ', 'Финальная проверка'])
})

test('source count is read from explicit value or sources array', () => {
  assert.equal(getSourceCount({ sourceCount: 3 }), 3)
  assert.equal(getSourceCount({ sources: [{ title: 'A' }, { title: 'B' }] }), 2)
})

test('quality summary supports strings and objects', () => {
  assert.equal(getQualitySummary({ quality: 'Достаточно источников' }), 'Достаточно источников')
  assert.equal(getQualitySummary({ quality_update: { evidence_status: 'sufficient' } }), 'sufficient')
})

test('shouldShowStreamingActivity only shows in draft phase', () => {
  assert.equal(shouldShowStreamingActivity({ status: 'loading' }), true)
  assert.equal(shouldShowStreamingActivity({ status: 'sent' }), false)
})

test('normalizeStreamingActivity combines headline items sources and quality', () => {
  const activity = normalizeStreamingActivity({
    status: 'loading',
    metadata: {
      statusText: 'Анализирую вопрос',
      activity: [{ label: 'Ищу НПА' }],
      sources: [{ title: 'A' }],
      quality: { status: 'checking' }
    }
  })

  assert.equal(activity.headline, 'Анализирую вопрос')
  assert.equal(activity.items[0].text, 'Ищу НПА')
  assert.equal(activity.sourceCount, 1)
  assert.equal(activity.quality, 'checking')
})
