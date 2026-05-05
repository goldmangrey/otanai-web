import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getDomainFromUrl,
  getSourceSelectionSummary,
  groupSourcesForDrawer,
  isOfficialKzSource,
  normalizeSources
} from './sources.js'

test('normalizeSources handles empty input', () => {
  assert.deepEqual(normalizeSources(undefined), [])
  assert.deepEqual(normalizeSources(null), [])
})

test('normalizeSources accepts citations and sources arrays', () => {
  assert.equal(
    normalizeSources({
      citations: [{ source_id: 'src_1', title: 'Citation', origin_url: 'https://egov.kz/item' }]
    })[0].domain,
    'egov.kz'
  )
  assert.equal(
    normalizeSources({
      sources: [{ id: 'src_2', title: 'Source', url: 'https://adilet.zan.kz/rus/docs' }]
    })[0].title,
    'Source'
  )
})

test('normalizeSources accepts full message metadata', () => {
  const sources = normalizeSources({
    metadata: {
      citations: [{ sourceId: 'src_3', name: 'Metadata source', href: 'https://kgd.gov.kz/page' }]
    }
  })

  assert.equal(sources.length, 1)
  assert.equal(sources[0].source_id, 'src_3')
  assert.equal(sources[0].domain, 'kgd.gov.kz')
})

test('normalizeSources deduplicates URL before source id and title', () => {
  const sources = normalizeSources([
    { source_id: 'src_1', title: 'One', url: 'https://egov.kz/a' },
    { source_id: 'src_2', title: 'Two', url: 'https://egov.kz/a' },
    { source_id: 'src_3', title: 'Three' },
    { source_id: 'src_3', title: 'Duplicate source id' }
  ])

  assert.equal(sources.length, 2)
  assert.equal(sources[0].title, 'One')
  assert.equal(sources[1].title, 'Three')
})

test('URL parsing is safe and extracts domains', () => {
  assert.equal(getDomainFromUrl('https://www.gov.kz/memleket/entities'), 'gov.kz')
  assert.equal(getDomainFromUrl('not a url'), '')
  assert.equal(normalizeSources([{ origin_url: 'not a url', title: 'Broken link' }])[0].domain, '')
})

test('official KZ sources are detected from domains and source types', () => {
  assert.equal(isOfficialKzSource('egov.kz'), true)
  assert.equal(isOfficialKzSource('service.gov.kz'), true)
  assert.equal(isOfficialKzSource('example.com', 'official_portal'), true)
  assert.equal(isOfficialKzSource('random-blog.kz', 'blog'), false)
})

test('trust level and snippets are normalized', () => {
  const text = 'a'.repeat(360)
  const source = normalizeSources([
    {
      title: 'Snippet source',
      trustLevel: 'HIGH',
      text
    }
  ])[0]

  assert.equal(source.trust_level, 'high')
  assert.equal(source.snippet.length, 303)
  assert.equal(source.snippet.endsWith('...'), true)
})

test('source without URL is still renderable', () => {
  const source = normalizeSources([{ source_id: 'manual_1', trust_level: 'unexpected' }])[0]

  assert.equal(source.url, '')
  assert.equal(source.title, 'manual_1')
  assert.equal(source.trust_level, 'unknown')
})

test('groupSourcesForDrawer groups official tier one sources', () => {
  const sources = normalizeSources([
    { source_id: 'law', title: 'Law', url: 'https://adilet.zan.kz/rus/docs', source_tier: 1 },
    { source_id: 'extra', title: 'Extra', url: 'https://example.com/page', source_type: 'article' }
  ])
  const groups = groupSourcesForDrawer(sources, { sourceSelection: { cited_count: 2 } })

  assert.equal(groups[0].id, 'official')
  assert.equal(groups[0].label, 'Официальные источники')
  assert.equal(groups[0].sources[0].source_id, 'law')
})

test('groupSourcesForDrawer groups bank and registry sources', () => {
  const sources = normalizeSources([
    { source_id: 'bank', title: 'Bank', url: 'https://halykbank.kz/page', source_type: 'bank' },
    { source_id: 'registry', title: 'Registry', url: 'https://registry.kz/page', source_type: 'registry' }
  ])
  const groups = groupSourcesForDrawer(sources, { sourceSelection: { cited_count: 2 } })

  assert.equal(groups.find((group) => group.id === 'registries').count, 2)
})

test('unknown sources go to additional group', () => {
  const groups = groupSourcesForDrawer(
    normalizeSources([{ source_id: 'blog', title: 'Blog', url: 'https://example.com/page', source_type: 'blog' }]),
    { sourceSelection: { cited_count: 1 } }
  )

  assert.equal(groups[0].id, 'additional')
})

test('sourceSelection summary counts are read safely', () => {
  const summary = getSourceSelectionSummary({
    sourceSelection: {
      retrieved_count: 24,
      reviewed_count: 14,
      used_count: 9,
      cited_count: 7,
      official_count: 5
    }
  })

  assert.deepEqual(summary, { retrieved: 24, reviewed: 14, used: 9, cited: 7, official: 5 })
  assert.equal(getSourceSelectionSummary({ sourceSelection: {} }), null)
})

test('source grouping preserves drawer-compatible shape and hides raw markers', () => {
  const sources = normalizeSources([
    {
      source_id: 'src_1',
      title: 'Official',
      url: 'https://egov.kz/page',
      text: 'raw_evidence chain_of_thought should not leak',
      trust_level: 'high'
    }
  ])

  assert.equal(sources[0].source_id, 'src_1')
  assert.equal(sources[0].domain, 'egov.kz')
  assert.equal(sources[0].snippet, '')
  assert.equal(groupSourcesForDrawer(sources, { sourceSelection: { cited_count: 1 } })[0].id, 'official')
})
