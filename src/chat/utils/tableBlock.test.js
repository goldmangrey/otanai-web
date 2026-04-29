import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isTableBlockLanguage,
  normalizeCalloutBlock,
  normalizeStructuredBlocks,
  normalizeTableBlock,
  parseTableBlock,
  stripTableArtifacts
} from './tableBlock.js'

test('parses valid table block', () => {
  const table = parseTableBlock([
    'columns: Причина | Кто | Где',
    'row: Долг | ЧСИ | eGov',
    'row: Налог | КГД | kgd.gov.kz'
  ].join('\n'))

  assert.deepEqual(table.columns, ['Причина', 'Кто', 'Где'])
  assert.deepEqual(table.rows, [
    ['Долг', 'ЧСИ', 'eGov'],
    ['Налог', 'КГД', 'kgd.gov.kz']
  ])
  assert.equal(table.error, null)
})

test('trims cells', () => {
  const table = parseTableBlock('columns:  A  |  B  \nrow:  one  |  two  ')

  assert.deepEqual(table.columns, ['A', 'B'])
  assert.deepEqual(table.rows, [['one', 'two']])
})

test('pads rows with fewer cells', () => {
  const table = parseTableBlock('columns: A | B | C\nrow: one | two')

  assert.deepEqual(table.rows[0], ['one', 'two', ''])
})

test('merges extra row cells into the last cell', () => {
  const table = parseTableBlock('columns: A | B | C\nrow: one | two | three | extra | tail')

  assert.deepEqual(table.rows[0], ['one', 'two', 'three | extra | tail'])
})

test('empty input is safe', () => {
  assert.deepEqual(parseTableBlock(''), {
    columns: [],
    rows: [],
    error: 'missing_columns'
  })
})

test('missing columns line is safe failure', () => {
  assert.deepEqual(parseTableBlock('row: one | two'), {
    columns: [],
    rows: [],
    error: 'missing_columns'
  })
})

test('long cell text is preserved', () => {
  const longText = 'long '.repeat(80).trim()
  const table = parseTableBlock(`columns: A | B\nrow: ${longText} | value`)

  assert.equal(table.rows[0][0], longText)
})

test('HTML-like text stays plain text data', () => {
  const table = parseTableBlock('columns: A | B\nrow: <script>alert(1)</script> | <b>bold</b>')

  assert.equal(table.rows[0][0], '<script>alert(1)</script>')
  assert.equal(table.rows[0][1], '<b>bold</b>')
})

test('table block languages are recognized', () => {
  assert.equal(isTableBlockLanguage('table'), true)
  assert.equal(isTableBlockLanguage('datatable'), true)
  assert.equal(isTableBlockLanguage('grid'), true)
  assert.equal(isTableBlockLanguage('python'), false)
})

test('normalizes metadata table block', () => {
  const block = normalizeTableBlock({
    type: 'table',
    title: 'Арест карты',
    columns: [' Причина ', ' Кто '],
    rows: [['Долг', 'ЧСИ', 'лишнее']],
    caption: 'caption'
  })

  assert.deepEqual(block, {
    id: '',
    type: 'table',
    title: 'Арест карты',
    columns: ['Причина', 'Кто'],
    rows: [['Долг', 'ЧСИ | лишнее']],
    caption: 'caption',
    source_ids: []
  })
})

test('normalizes structured blocks from metadata', () => {
  const blocks = normalizeStructuredBlocks({
    blocks: [
      { type: 'table', columns: ['A'], rows: [['B']] },
      { type: 'callout', variant: 'warning', title: 'Важно', content: 'Check official source.' },
      { type: 'unknown' },
      null
    ]
  })

  assert.equal(blocks.length, 2)
  assert.deepEqual(blocks[0].columns, ['A'])
  assert.equal(blocks[1].type, 'callout')
  assert.equal(blocks[1].variant, 'warning')
})

test('normalizes callout block and ignores empty content', () => {
  assert.deepEqual(normalizeCalloutBlock({
    type: 'callout',
    variant: 'WARNING',
    title: ' Важно ',
    content: ' Текст '
  }), {
    id: '',
    type: 'callout',
    variant: 'warning',
    title: 'Важно',
    content: 'Текст'
  })
  assert.equal(normalizeCalloutBlock({ type: 'callout', content: '' }), null)
})

test('strips table artifacts when structured block exists', () => {
  const text = [
    'Вот таблица:',
    '```table',
    'columns: A | B',
    'row: one | two',
    '```',
    'После таблицы.'
  ].join('\n')

  assert.equal(stripTableArtifacts(text), 'Вот таблица:\nПосле таблицы.')
  assert.equal(stripTableArtifacts('Intro table columns: A | B row: one | two'), 'Intro')
})
