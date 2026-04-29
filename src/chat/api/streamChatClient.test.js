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
      onChunk: (delta) => calls.push(`chunk:${delta}`),
      onDone: () => calls.push('done')
    })
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.deepEqual(calls, ['meta', 'activity', 'source_found', 'quality_update', 'chunk:hello ', 'done'])
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
