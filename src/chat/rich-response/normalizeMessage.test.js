import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeMessage, oldMessageToParts } from './normalizeMessage.js'

test('oldMessageToParts converts content string to markdown part', () => {
  assert.deepEqual(oldMessageToParts({ content: 'Hello **world**' }), [
    { type: 'markdown', text: 'Hello **world**' }
  ])
})

test('normalizeMessage preserves and normalizes existing parts', () => {
  const message = normalizeMessage({
    content: 'ignored',
    parts: [
      { type: 'markdown', content: 'Part text' },
      { type: 'not_real', value: 1 }
    ]
  })

  assert.deepEqual(message.parts, [
    { type: 'markdown', content: 'Part text', text: 'Part text' },
    { type: 'unknown', raw: { type: 'not_real', value: 1 } }
  ])
})

test('normalizeMessage normalizes typed document preview parts', () => {
  const message = normalizeMessage({
    parts: [
      {
        type: 'document_preview',
        document: {
          title: 'Претензия',
          content: 'Текст претензии',
          fields: { Адресат: 'Продавец' }
        }
      }
    ]
  })

  assert.equal(message.parts[0].type, 'document_preview')
  assert.equal(message.parts[0].document.title, 'Претензия')
  assert.equal(message.parts[0].document.content, 'Текст претензии')
  assert.deepEqual(message.parts[0].document.fields, [{ label: 'Адресат', value: 'Продавец' }])
})

test('normalizeMessage preserves and normalizes legal message parts', () => {
  const message = normalizeMessage({
    parts: [
      { type: 'legal_basis', title: 'ГК РК', article: 'Статья 9' },
      { type: 'risk_warning', text: 'Средний риск' }
    ]
  })

  assert.equal(message.parts[0].type, 'legal_citation')
  assert.equal(message.parts[0].title, 'ГК РК')
  assert.equal(message.parts[1].type, 'risk')
  assert.equal(message.parts[1].level, 'medium')
})

test('normalizeMessage supports legal parts from metadata parts', () => {
  const message = normalizeMessage({
    content: 'Intro',
    metadata: {
      parts: [
        { type: 'next_steps', items: ['Собрать документы'] },
        { type: 'disclaimer' }
      ]
    }
  })

  assert.deepEqual(message.parts.map((part) => part.type), ['markdown', 'checklist', 'legal_disclaimer'])
})

test('normalizeMessage prefers backend metadata parts over duplicate metadata blocks', () => {
  const message = normalizeMessage({
    content: 'Answer',
    metadata: {
      parts: [
        { type: 'table', title: 'Backend table', columns: ['A'], rows: [['B']] },
        { type: 'legal_basis', title: 'Backend citation' },
        { type: 'document_preview', document: { title: 'Backend document', content: 'Text' } },
        { type: 'source_panel', sources: [{ title: 'Backend source' }] }
      ],
      blocks: [
        { type: 'table', title: 'Block table', columns: ['A'], rows: [['C']] },
        { type: 'legal_basis', title: 'Block citation' },
        { type: 'document_preview', document: { title: 'Block document', content: 'Other' } },
        { type: 'source_panel', sources: [{ title: 'Block source' }] }
      ],
      sources: [{ title: 'Metadata source' }]
    }
  })

  assert.deepEqual(message.parts.map((part) => part.type), [
    'markdown',
    'table',
    'legal_citation',
    'document_preview',
    'source_panel'
  ])
  assert.equal(message.parts.filter((part) => part.type === 'table').length, 1)
  assert.equal(message.parts.find((part) => part.type === 'table').title, 'Backend table')
  assert.equal(message.parts.find((part) => part.type === 'source_panel').sources[0].title, 'Backend source')
})

test('normalizeMessage supports legal block shapes from metadata blocks', () => {
  const message = normalizeMessage({
    metadata: {
      blocks: [
        { type: 'callout', message: 'Важно проверить срок' },
        { type: 'legal_citation', title: 'Закон РК', status: 'active' }
      ]
    }
  })

  assert.deepEqual(message.parts.map((part) => part.type), ['warning', 'legal_citation'])
})

test('oldMessageToParts extracts document fences without markdown duplication', () => {
  const parts = oldMessageToParts({
    content: 'Вот документ:\n```document\nПретензия\nТекст\n```\nПроверьте реквизиты.'
  })

  assert.deepEqual(parts.map((part) => part.type), ['markdown', 'document_preview', 'markdown'])
  assert.equal(parts[0].text, 'Вот документ:')
  assert.equal(parts[1].document.content, 'Претензия\nТекст')
  assert.equal(parts[2].text, 'Проверьте реквизиты.')
})

test('normalizeMessage keeps closed document fence as markdown during draft', () => {
  const message = normalizeMessage(
    {
      status: 'loading',
      content: 'Doc:\n```document\nПретензия\nТекст\n```'
    },
    { renderPhase: 'draft' }
  )

  assert.deepEqual(message.parts, [
    {
      type: 'markdown',
      text: 'Doc:\n```document\nПретензия\nТекст\n```'
    }
  ])
})

test('normalizeMessage extracts closed document fence during final', () => {
  const message = normalizeMessage(
    {
      status: 'sent',
      content: 'Doc:\n```document\nПретензия\nТекст\n```'
    },
    { renderPhase: 'final' }
  )

  assert.deepEqual(message.parts.map((part) => part.type), ['markdown', 'document_preview'])
})

test('normalizeMessage keeps unclosed document fence as markdown', () => {
  const message = normalizeMessage(
    {
      status: 'loading',
      content: '```document\nПретензия'
    },
    { renderPhase: 'draft' }
  )

  assert.equal(message.parts[0].type, 'markdown')
})

test('metadata table blocks become table parts', () => {
  const message = normalizeMessage({
    content: 'Intro',
    metadata: {
      blocks: [
        {
          type: 'table',
          title: 'Риски',
          columns: ['Риск', 'Что делать'],
          rows: [['Арест карты', 'Проверить ЧСИ']],
          caption: 'Важно'
        }
      ]
    }
  })

  assert.equal(message.parts.length, 2)
  assert.deepEqual(message.parts[1], {
    type: 'table',
    title: 'Риски',
    columns: ['Риск', 'Что делать'],
    rows: [['Арест карты', 'Проверить ЧСИ']],
    caption: 'Важно',
    source_ids: []
  })
})

test('normalizeMessage final still preserves table legal and source parts', () => {
  const message = normalizeMessage(
    {
      status: 'sent',
      content: 'Answer',
      metadata: {
        blocks: [
          { type: 'table', columns: ['A'], rows: [['B']] },
          { type: 'callout', text: 'Важно' }
        ],
        sources: [{ title: 'Source' }]
      }
    },
    { renderPhase: 'final' }
  )

  assert.deepEqual(message.parts.map((part) => part.type), ['markdown', 'table', 'warning', 'source_panel'])
})

test('normalizeMessage draft keeps typed parts stable', () => {
  const message = normalizeMessage(
    {
      status: 'loading',
      content: 'ignored',
      parts: [
        { type: 'table', columns: ['A'], rows: [['B']] },
        { type: 'legal_basis', title: 'Кодекс' },
        { type: 'sources', sources: [{ title: 'Source' }] }
      ]
    },
    { renderPhase: 'draft' }
  )

  assert.deepEqual(message.parts.map((part) => part.type), ['table', 'legal_citation', 'source_panel'])
})

test('metadata legal blocks do not break existing table document and source parts', () => {
  const message = normalizeMessage({
    content: 'Doc:\n```document\nПретензия\nТекст\n```',
    metadata: {
      blocks: [
        { type: 'table', columns: ['A'], rows: [['B']] },
        { type: 'alert', text: 'Проверьте данные' }
      ],
      sources: [{ title: 'Source' }]
    }
  })

  assert.deepEqual(message.parts.map((part) => part.type), [
    'markdown',
    'document_preview',
    'table',
    'warning',
    'source_panel'
  ])
})

test('metadata table blocks can infer columns from object rows', () => {
  const message = normalizeMessage({
    metadata: {
      blocks: [
        {
          type: 'table',
          rows: [
            { option: 'Претензия', risk: 'Низкий' },
            { option: 'Иск', risk: 'Средний' }
          ]
        }
      ]
    }
  })

  assert.deepEqual(message.parts, [
    {
      type: 'table',
      title: '',
      columns: ['option', 'risk'],
      rows: [
        ['Претензия', 'Низкий'],
        ['Иск', 'Средний']
      ],
      caption: '',
      source_ids: []
    }
  ])
})

test('bad metadata and malformed table rows do not throw', () => {
  assert.doesNotThrow(() => {
    normalizeMessage({
      content: '',
      metadata: {
        blocks: [
          null,
          { type: 'table', columns: ['A'], rows: ['bad row', null, ['ok']] },
          { type: 'callout', content: 'ignored for v1' }
        ]
      }
    })
  })

  const message = normalizeMessage({
    metadata: {
      blocks: [{ type: 'table', columns: ['A'], rows: ['bad row', null, ['ok']] }]
    }
  })
  assert.deepEqual(message.parts, [
    {
      type: 'table',
      title: '',
      columns: ['A'],
      rows: [['ok']],
      caption: '',
      source_ids: []
    }
  ])
})

test('metadata sources and citations add source panel part', () => {
  const withSources = normalizeMessage({
    metadata: {
      sources: [{ title: 'Source', url: 'https://example.com' }]
    }
  })
  assert.equal(withSources.parts[0].type, 'source_panel')
  assert.equal(withSources.parts[0].sources.length, 1)

  const withCitations = normalizeMessage({
    metadata: {
      citations: [{ title: 'Citation' }]
    }
  })
  assert.equal(withCitations.parts[0].type, 'source_panel')
  assert.equal(withCitations.parts[0].sources.length, 1)
})

test('normalizeMessage normalizes source panel from message parts without metadata duplication', () => {
  const message = normalizeMessage({
    parts: [{ type: 'sources', sources: [{ title: 'Part source', url: 'https://example.com' }] }],
    metadata: {
      sources: [{ title: 'Metadata source', url: 'https://example.com/metadata' }]
    }
  })

  assert.equal(message.parts.length, 1)
  assert.equal(message.parts[0].type, 'source_panel')
  assert.equal(message.parts[0].sources[0].title, 'Part source')
})

test('normalizeMessage adds one source panel from metadata sources and dedupes unsafe urls', () => {
  const message = normalizeMessage({
    content: 'Answer',
    metadata: {
      sources: [
        { title: 'A', url: 'https://example.com/a' },
        { title: 'A copy', url: 'https://example.com/a' },
        { title: 'Bad', url: 'javascript:alert(1)' }
      ]
    }
  })

  const sourcePanel = message.parts.find((part) => part.type === 'source_panel')
  assert.equal(sourcePanel.sources.length, 2)
  assert.equal(sourcePanel.sources[0].url, 'https://example.com/a')
  assert.equal(sourcePanel.sources[1].url, null)
})

test('empty message returns empty parts array', () => {
  assert.deepEqual(normalizeMessage({}).parts, [])
  assert.deepEqual(normalizeMessage(null).parts, [])
})
