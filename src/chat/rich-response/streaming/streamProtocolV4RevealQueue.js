const DEFAULT_DELAY_MS = 28
const STRUCTURED_DELAY_MS = 90

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function cloneEvent(event) {
  const source = asObject(event)
  return {
    type: String(source.type || ''),
    payload: { ...asObject(source.payload) }
  }
}

export function splitMarkdownDeltaEvent(event, chunkSize = 48) {
  const source = cloneEvent(event)
  if (source.type !== 'markdown_delta') return [source]
  const text = String(source.payload.text ?? '')
  if (text.length <= chunkSize) return [source]

  const chunks = []
  let index = 0
  while (index < text.length) {
    const nextIndex = Math.min(index + chunkSize, text.length)
    chunks.push({
      type: 'markdown_delta',
      payload: {
        ...source.payload,
        text: text.slice(index, nextIndex)
      }
    })
    index = nextIndex
  }
  return chunks
}

export function eventDelayMs(event, options = {}) {
  const type = String(asObject(event).type || '')
  if (type === 'markdown_delta') return Number(options.markdownDelayMs ?? DEFAULT_DELAY_MS)
  if (type === 'done' || type === 'error') return 0
  if (type === 'message_start' || type === 'block_start' || type === 'block_end') return 0
  return Number(options.structuredDelayMs ?? STRUCTURED_DELAY_MS)
}

export function planV4RevealEvents(events, options = {}) {
  return (Array.isArray(events) ? events : [])
    .flatMap((event) => splitMarkdownDeltaEvent(event, options.chunkSize || 48))
    .map((event) => ({
      event,
      delayMs: eventDelayMs(event, options)
    }))
}

export function createV4RevealQueue({ applyEvent, onError, options = {} } = {}) {
  let queue = []
  let timer = null
  let drainingResolvers = []
  let stopped = false

  function resolveDrain() {
    if (queue.length || timer) return
    const resolvers = drainingResolvers
    drainingResolvers = []
    resolvers.forEach((resolve) => resolve())
  }

  function schedule() {
    if (timer || stopped) return
    if (!queue.length) {
      resolveDrain()
      return
    }
    const item = queue.shift()
    timer = window.setTimeout(() => {
      timer = null
      try {
        applyEvent?.(item.event)
      } catch (error) {
        onError?.(error, item.event)
      }
      schedule()
    }, item.delayMs)
  }

  return {
    enqueue(event) {
      if (stopped) return
      queue.push(...planV4RevealEvents([event], options))
      schedule()
    },
    flush() {
      if (timer) {
        window.clearTimeout(timer)
        timer = null
      }
      const pending = queue
      queue = []
      pending.forEach((item) => applyEvent?.(item.event))
      resolveDrain()
    },
    clear() {
      stopped = true
      if (timer) window.clearTimeout(timer)
      timer = null
      queue = []
      resolveDrain()
    },
    drain() {
      if (!queue.length && !timer) return Promise.resolve()
      return new Promise((resolve) => {
        drainingResolvers.push(resolve)
      })
    },
    size() {
      return queue.length + (timer ? 1 : 0)
    }
  }
}
