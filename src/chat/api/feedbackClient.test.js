import assert from 'node:assert/strict'
import test from 'node:test'

import { buildFeedbackMetadataSnapshot, submitAnswerFeedback } from './feedbackClient.js'

test('buildFeedbackMetadataSnapshot keeps compact metadata only', () => {
  const snapshot = buildFeedbackMetadataSnapshot({
    intentUnderstanding: { domain: 'business_tax', intent: 'close_ip' },
    answerPlan: { answer_type: 'actionable_guide' },
    responseStylePolicy: { style_name: 'practical_legal_assistant' },
    quality: { evidence_status: 'sufficient' },
    sources: [
      { domain: 'kgd.gov.kz', is_official: true, snippet: 'should not be copied' },
      { domain: 'blog.kz', is_official: false }
    ],
    activity: [{ id: 'a1' }],
    answerCritique: { passed: true }
  })

  assert.deepEqual(snapshot, {
    domain: 'business_tax',
    intent: 'close_ip',
    answerType: 'actionable_guide',
    styleName: 'practical_legal_assistant',
    qualityStatus: 'sufficient',
    sourceCount: 2,
    officialCount: 1,
    activityCount: 1,
    answerCritiquePassed: true
  })
})

test('submitAnswerFeedback posts compact request with bearer token', async () => {
  const originalFetch = globalThis.fetch
  let captured = null
  globalThis.fetch = async (url, options) => {
    captured = { url, options }
    return {
      ok: true,
      async json() {
        return { ok: true, feedbackId: 'fb_1', status: 'created' }
      }
    }
  }

  try {
    const result = await submitAnswerFeedback({
      apiBaseUrl: 'https://api.example.com/',
      token: 'token_1',
      chatId: 'chat_1',
      message: {
        id: 'msg_1',
        requestId: 'req_1',
        content: 'answer text',
        metadata: {
          intentUnderstanding: { domain: 'debt_crisis', intent: 'card_arrest' },
          sources: [{ is_official: true }],
          activity: []
        }
      },
      rating: 'down',
      reasons: ['missing_steps'],
      comment: 'More steps'
    })

    assert.equal(result.feedbackId, 'fb_1')
    assert.equal(captured.url, 'https://api.example.com/v1/feedback/answer')
    assert.equal(captured.options.headers.Authorization, 'Bearer token_1')
    const body = JSON.parse(captured.options.body)
    assert.equal(body.chatId, 'chat_1')
    assert.equal(body.messageId, 'msg_1')
    assert.equal(body.rating, 'down')
    assert.deepEqual(body.reasons, ['missing_steps'])
    assert.equal(body.metadataSnapshot.sourceCount, 1)
    assert.equal(body.metadataSnapshot.officialCount, 1)
    assert.equal(body.metadataSnapshot.domain, 'debt_crisis')
    assert.equal(body.metadataSnapshot.sources, undefined)
  } finally {
    globalThis.fetch = originalFetch
  }
})
