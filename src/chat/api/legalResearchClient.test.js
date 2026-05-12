import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildLegalResearchPayload,
  LEGAL_RESEARCH_DEEP_ENDPOINT,
  LEGAL_RESEARCH_STREAM_ENDPOINT,
  sendLegalResearchDeepRequest,
  sendLegalResearchStreamRequest
} from './legalResearchClient.js'

function envelope(type, payload = {}) {
  return `data: ${JSON.stringify({ type, payload })}\n\n`
}

function streamFromChunks(chunks) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk))
      }
      controller.close()
    }
  })
}

test('buildLegalResearchPayload enables qdrant legal research defaults', () => {
  const payload = buildLegalResearchPayload('Найди нормы Строительного кодекса РК 2026 про строительство', {
    previousAssistantContext: { last_domain: 'construction', confidence: 'high' }
  })

  assert.equal(payload.sourceMode, 'auto')
  assert.equal(payload.useQdrantRetrieval, true)
  assert.equal(payload.preferQdrantOverLocalPacks, true)
  assert.equal(payload.qdrantLimit, 12)
  assert.equal(payload.allowLiveAdilet, false)
  assert.equal(payload.includeComparativeLaw, false)
  assert.equal(payload.humanAnswerStyle, true)
  assert.equal(payload.includeEvents, true)
  assert.equal(payload.streamChunks, true)
  assert.equal(payload.previousAssistantContext.last_domain, 'construction')
})

test('sendLegalResearchStreamRequest posts to legal stream endpoint', async () => {
  let url = ''
  let body = null
  const chunks = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (requestUrl, init) => {
    url = requestUrl
    body = JSON.parse(init.body)
    return {
      ok: true,
      body: streamFromChunks([
        envelope('chunk', { delta: 'Найдено в legal_npa_kz' }),
        envelope('done', { metadata: { qdrantRetrievalUsed: true } })
      ])
    }
  }

  try {
    await sendLegalResearchStreamRequest({
      apiBaseUrl: 'http://backend',
      message: 'Строительный кодекс 2026',
      previousAssistantContext: { last_domain: 'labor', confidence: 'high' },
      onChunk: (delta) => chunks.push(delta)
    })
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(url, `http://backend${LEGAL_RESEARCH_STREAM_ENDPOINT}`)
  assert.equal(body.useQdrantRetrieval, true)
  assert.equal(body.previousAssistantContext.last_domain, 'labor')
  assert.deepEqual(chunks, ['Найдено в legal_npa_kz'])
})

test('sendLegalResearchDeepRequest posts to legal deep endpoint', async () => {
  let url = ''
  let body = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (requestUrl, init) => {
    url = requestUrl
    body = JSON.parse(init.body)
    return {
      ok: true,
      json: async () => ({
        reportMarkdown: '# Короткий вывод\n\nНайдено в legal_npa_kz',
        metadata: {
          qdrantRetrievalUsed: true,
          assistantConversationContext: { last_domain: 'construction', confidence: 'high' }
        },
        sourceTrace: [{ source_id: 'legal_npa_kz_adilet_K2600000253' }],
        followups: [{ label: 'Что дальше', query: 'Что дальше', type: 'practical' }]
      })
    }
  }

  try {
    const response = await sendLegalResearchDeepRequest({
      apiBaseUrl: 'http://backend',
      message: 'Строительный кодекс 2026',
      previousAssistantContext: { last_domain: 'construction', confidence: 'high' }
    })
    assert.equal(response.assistantText.includes('Найдено в legal_npa_kz'), true)
    assert.equal(response.followups.length, 1)
    assert.equal(response.assistantText.includes('Что дальше'), false)
    assert.equal(response.assistantConversationContext.last_domain, 'construction')
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(url, `http://backend${LEGAL_RESEARCH_DEEP_ENDPOINT}`)
  assert.equal(body.useQdrantRetrieval, true)
  assert.equal(body.previousAssistantContext.last_domain, 'construction')
})
