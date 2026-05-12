import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeChat } from './chatModel.js'

test('keeps legal followups separate from assistant markdown content', () => {
  const markdown = '## Коротко\nОтвет.\n\n## Что можно сделать дальше\nМогу составить жалобу.'
  const chat = normalizeChat({
    id: 'chat-1',
    messages: [
      {
        id: 'assistant-1',
        role: 'assistant',
        content: markdown,
        followups: [
          {
            label: 'Составить жалобу в управление образования',
            query: 'Составь жалобу в управление образования',
            type: 'draft'
          }
        ],
        metadata: {
          assistantFollowups: [
            {
              label: 'Как подать обращение через eOtinish',
              query: 'Как подать обращение через eOtinish',
              type: 'practical'
            }
          ]
        }
      }
    ]
  })

  const message = chat.messages[0]
  assert.equal(message.content, markdown)
  assert.equal(message.followups.length, 1)
  assert.equal(message.followups[0].label, 'Составить жалобу в управление образования')
  assert.equal(message.content.includes('Составить жалобу в управление образования'), false)
})

test('falls back to metadata followups without appending them to content', () => {
  const chat = normalizeChat({
    id: 'chat-1',
    messages: [
      {
        id: 'assistant-1',
        role: 'assistant',
        content: '## Источники\n- О правах ребенка',
        metadata: {
          assistantFollowups: [
            {
              label: 'Какие доказательства приложить',
              query: 'Какие доказательства приложить',
              type: 'practical'
            }
          ]
        }
      }
    ]
  })

  const message = chat.messages[0]
  assert.equal(message.followups.length, 1)
  assert.equal(message.followups[0].label, 'Какие доказательства приложить')
  assert.equal(message.content.includes('Какие доказательства приложить'), false)
})
