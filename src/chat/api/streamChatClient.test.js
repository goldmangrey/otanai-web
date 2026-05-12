import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseSseBuffer, readSseStream, sendStreamingChatRequest } from './streamChatClient.js'

function envelope(type, payload = {}) {
  return `data: ${JSON.stringify({ requestId: 'req_1', seq: 1, type, ts: 1, payload })}\n\n`
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

test('parseSseBuffer parses a single SSE event', () => {
  const events = []
  const remainder = parseSseBuffer(envelope('chunk', { delta: 'hello' }), (event) => events.push(event))

  assert.equal(remainder, '')
  assert.equal(events.length, 1)
  assert.equal(events[0].type, 'chunk')
  assert.equal(events[0].payload.delta, 'hello')
})

test('parseSseBuffer parses multiple events and ignores comments', () => {
  const events = []
  parseSseBuffer(`: keepalive\n\n${envelope('activity', { id: 'a1' })}${envelope('done', {})}`, (event) =>
    events.push(event)
  )

  assert.deepEqual(events.map((event) => event.type), ['activity', 'done'])
})

test('readSseStream handles split chunks', async () => {
  const events = []
  const response = { body: streamFromChunks(['data: {"type":"chunk","payload"', ':{"delta":"he"}}\n', '\n']) }

  await readSseStream(response, (event) => events.push(event))

  assert.equal(events.length, 1)
  assert.equal(events[0].payload.delta, 'he')
})

test('sendStreamingChatRequest dispatches known event callbacks and ignores unknown events', async () => {
  const calls = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    body: streamFromChunks([
      envelope('unknown', { value: 1 }),
      envelope('meta', { chatId: 'chat_1' }),
      envelope('activity', { id: 'act_1' }),
      envelope('source_found', { source_id: 'src_1' }),
      envelope('quality_update', { evidence_status: 'sufficient' }),
      envelope('assistant_activity', {
        type: 'assistant_activity',
        stage: 'compose_answer',
        message: 'Формирую ответ простым языком.',
        status: 'done',
        safe_to_show: true,
        order: 80
      }),
      envelope('chunk', { delta: 'hello ' }),
      envelope('done', { metadata: { sources: [] } })
    ])
  })

  try {
    await sendStreamingChatRequest({
      apiBaseUrl: 'http://backend',
      token: 'token',
      payload: { message: 'hi' },
      onMeta: () => calls.push('meta'),
      onActivity: () => calls.push('activity'),
      onSourceFound: () => calls.push('source_found'),
      onQualityUpdate: () => calls.push('quality_update'),
      onAssistantActivity: (payload) => calls.push(`assistant_activity:${payload.stage}`),
      onChunk: (delta) => calls.push(`chunk:${delta}`),
      onDone: () => calls.push('done')
    })
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.deepEqual(calls, [
    'meta',
    'activity',
    'source_found',
    'quality_update',
    'assistant_activity:compose_answer',
    'chunk:hello ',
    'done'
  ])
})

test('sendStreamingChatRequest dispatches v4 events and preserves requested protocol version', async () => {
  const calls = []
  let requestBody = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body)
    return {
      ok: true,
      body: streamFromChunks([
        envelope('message_start', { protocolVersion: 4 }),
        envelope('markdown_delta', { blockId: 'm1', text: 'hello' }),
        envelope('table_start', { blockId: 't1', columns: ['A'] }),
        envelope('table_row', { blockId: 't1', row: ['B'] }),
        envelope('source_add', { source: { title: 'Source' } }),
        envelope('warning_add', { part: { text: 'Важно' } }),
        envelope('document_preview', { document: { title: 'Doc' } }),
        envelope('done', { assistantText: 'hello', metadata: { parts: [] }, protocolVersion: 4 })
      ])
    }
  }

  try {
    await sendStreamingChatRequest({
      apiBaseUrl: 'http://backend',
      payload: { message: 'hi', protocolVersion: 4 },
      onV4Event: (_payload, envelope) => calls.push(envelope.type),
      onDone: () => calls.push('done')
    })
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(requestBody.protocolVersion, 4)
  assert.deepEqual(calls, [
    'message_start',
    'markdown_delta',
    'table_start',
    'table_row',
    'source_add',
    'warning_add',
    'document_preview',
    'done'
  ])
})

test('malformed JSON is ignored safely', () => {
  const events = []
  parseSseBuffer('data: {"bad"\n\n' + envelope('done', {}), (event) => events.push(event))

  assert.deepEqual(events.map((event) => event.type), ['done'])
})

test('abort does not call unsafe error callback', async () => {
  const controller = new AbortController()
  controller.abort()

  await assert.rejects(
    () =>
      readSseStream(
        {
          body: streamFromChunks([envelope('chunk', { delta: 'x' })])
        },
        () => {},
        controller.signal
      ),
    /Aborted/
  )
})

test('network failure calls onError with safe message', async () => {
  const originalFetch = globalThis.fetch
  const errors = []
  globalThis.fetch = async () => {
    throw new Error('network failed')
  }

  try {
    await assert.rejects(
      () =>
        sendStreamingChatRequest({
          apiBaseUrl: 'http://backend',
          payload: { message: 'hi' },
          onError: (error) => errors.push(error.message)
        }),
      /network failed/
    )
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.deepEqual(errors, ['network failed'])
})
