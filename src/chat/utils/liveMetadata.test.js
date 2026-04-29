import assert from 'node:assert/strict'
import test from 'node:test'

import { mergeLiveActivity, mergeLiveMetadata, mergeLiveSources } from './liveMetadata.js'
import { shouldShowResearchActivity } from './activity.js'

test('mergeLiveSources deduplicates by url before ids', () => {
  const sources = mergeLiveSources(
    [{ source_id: 'src_1', title: 'One', url: 'https://egov.kz/a' }],
    [
      { source_id: 'src_2', title: 'Duplicate URL', url: 'https://egov.kz/a' },
      { source_id: 'src_3', title: 'Three', url: 'https://adilet.zan.kz/b' }
    ]
  )

  assert.equal(sources.length, 2)
  assert.equal(sources[0].source_id, 'src_1')
  assert.equal(sources[1].source_id, 'src_3')
})

test('mergeLiveActivity deduplicates and remains visible for verification flow', () => {
  const activity = mergeLiveActivity(
    [{ id: 'routing', phase: 'routing', mode: 'auto_rag', label: 'Определяю', status: 'done' }],
    [
      { id: 'routing', phase: 'routing', mode: 'auto_rag', label: 'Определяю', status: 'done' },
      { id: 'retrieval', phase: 'retrieval', mode: 'auto_rag', label: 'Ищу', status: 'done' },
      { id: 'verification', phase: 'verification', mode: 'auto_rag', label: 'Проверяю', status: 'done' }
    ]
  )

  assert.equal(activity.length, 3)
  assert.equal(shouldShowResearchActivity(activity, { autoRag: { enabled: true } }), true)
})

test('mergeLiveMetadata stores compact quality and preserves table blocks', () => {
  const metadata = mergeLiveMetadata(
    {
      quality: { evidence_status: 'limited' },
      blocks: [{ type: 'table', columns: ['A'], rows: [['B']] }]
    },
    {
      quality: { confidence_label: 'limited' },
      blocks: []
    }
  )

  assert.equal(metadata.quality.evidence_status, 'limited')
  assert.equal(metadata.quality.confidence_label, 'limited')
  assert.equal(metadata.blocks.length, 1)
  assert.equal(metadata.blocks[0].type, 'table')
})
