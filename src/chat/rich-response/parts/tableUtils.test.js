import test from 'node:test'
import assert from 'node:assert/strict'

import {
  cellToText,
  detectCellBadge,
  escapeCsvCell,
  normalizeColumns,
  normalizeRows,
  normalizeSmartTablePart,
  shouldClampCell,
  tableToCsv,
  tableToMarkdown
} from './tableUtils.js'

test('normalizeColumns keeps string columns', () => {
  assert.deepEqual(normalizeColumns(['Вариант', 'Риск']), [
    { key: 'Вариант', label: 'Вариант' },
    { key: 'Риск', label: 'Риск' }
  ])
})

test('normalizeRows supports array rows', () => {
  const columns = normalizeColumns(['A', 'B'])
  assert.deepEqual(normalizeRows([['one', 'two']], columns), [['one', 'two']])
})

test('normalizeRows supports object rows', () => {
  const columns = normalizeColumns([
    { key: 'name', label: 'Название' },
    { key: 'risk', label: 'Риск' }
  ])

  assert.deepEqual(normalizeRows([{ name: 'Претензия', risk: 'Низкий' }], columns), [
    ['Претензия', 'Низкий']
  ])
})

test('missing columns with array rows creates generated columns', () => {
  assert.deepEqual(normalizeColumns([], [['a', 'b']]), [
    { key: 'column_1', label: 'Колонка 1' },
    { key: 'column_2', label: 'Колонка 2' }
  ])
})

test('missing columns with object rows uses object keys', () => {
  assert.deepEqual(normalizeColumns([], [{ name: 'A', risk: 'Low' }]), [
    { key: 'name', label: 'name' },
    { key: 'risk', label: 'risk' }
  ])
})

test('cellToText converts null and undefined to empty strings', () => {
  assert.equal(cellToText(null), '')
  assert.equal(cellToText(undefined), '')
})

test('cellToText uses object display fields', () => {
  assert.equal(cellToText({ label: 'Готово' }), 'Готово')
  assert.equal(cellToText({ value: 42 }), '42')
  assert.equal(cellToText({ text: 'Текст' }), 'Текст')
  assert.equal(cellToText({ title: 'Заголовок' }), 'Заголовок')
})

test('cellToText falls back to JSON for object cells', () => {
  assert.equal(cellToText({ code: 'A1' }), '{"code":"A1"}')
})

test('normalizeSmartTablePart supports sourceIds aliases', () => {
  const table = normalizeSmartTablePart({
    title: 'Сравнение',
    columns: ['A'],
    rows: [['B']],
    source_ids: [' law-1 ']
  })

  assert.equal(table.type, 'table')
  assert.equal(table.title, 'Сравнение')
  assert.deepEqual(table.sourceIds, ['law-1'])
})

test('tableToMarkdown exports a markdown table', () => {
  const markdown = tableToMarkdown({
    columns: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
    rows: [['one', 'two']]
  })

  assert.equal(markdown, '| A | B |\n| --- | --- |\n| one | two |')
})

test('tableToMarkdown escapes pipes and newlines', () => {
  const markdown = tableToMarkdown({
    columns: ['A'],
    rows: [['one | two\nthree']]
  })

  assert.equal(markdown, '| A |\n| --- |\n| one \\| two three |')
})

test('escapeCsvCell escapes comma, quotes and newlines', () => {
  assert.equal(escapeCsvCell('one,two'), '"one,two"')
  assert.equal(escapeCsvCell('one "two"'), '"one ""two"""')
  assert.equal(escapeCsvCell('one\ntwo'), '"one\ntwo"')
})

test('tableToCsv exports escaped CSV', () => {
  const csv = tableToCsv({
    columns: ['A', 'B'],
    rows: [['one,two', 'three "four"']]
  })

  assert.equal(csv, 'A,B\n"one,two","three ""four"""')
})

test('detectCellBadge detects risk values', () => {
  assert.deepEqual(detectCellBadge('низкий', 'Риск'), { label: 'низкий', variant: 'risk-low' })
  assert.deepEqual(detectCellBadge('Medium', 'risk'), { label: 'Medium', variant: 'risk-medium' })
  assert.deepEqual(detectCellBadge('высокая', 'уровень'), { label: 'высокая', variant: 'risk-high' })
})

test('detectCellBadge detects positive and negative values', () => {
  assert.deepEqual(detectCellBadge('да', 'Статус'), { label: 'да', variant: 'positive' })
  assert.deepEqual(detectCellBadge('no', 'status'), { label: 'no', variant: 'negative' })
})

test('detectCellBadge does not badge long sentences', () => {
  assert.equal(
    detectCellBadge('низкий риск, если предварительно направить претензию и собрать документы', 'Риск'),
    null
  )
})

test('shouldClampCell detects long text', () => {
  assert.equal(shouldClampCell('short'), false)
  assert.equal(shouldClampCell('x'.repeat(221)), true)
})
