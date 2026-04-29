import assert from 'node:assert/strict'
import test from 'node:test'

import { getDomainFromUrl, isOfficialKzSource, normalizeSources } from './sources.js'

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
