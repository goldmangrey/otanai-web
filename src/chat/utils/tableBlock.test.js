import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isTableBlockLanguage,
  normalizeCalloutBlock,
  normalizeStructuredBlocks,
  normalizeTableBlock,
  parseTableBlock,
  recoverMalformedTableBlocks,
  stripRecoveredTableArtifacts,
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

test('moves source-only table column to source ids', () => {
  const block = normalizeTableBlock({
    type: 'table',
    title: 'Таблица рисков',
    columns: ['Риск', 'Что это значит', 'Источник'],
    rows: [
      ['Налоговая задолженность', 'Блокирует закрытие ИП', '[source: business_tax_ip_closing_041]'],
      ['Отчётность', 'Нужно сдать форму 910.00', '[source: business_tax_form_910_017]']
    ]
  })

  assert.deepEqual(block.columns, ['Риск', 'Что это значит'])
  assert.deepEqual(block.rows, [
    ['Налоговая задолженность', 'Блокирует закрытие ИП'],
    ['Отчётность', 'Нужно сдать форму 910.00']
  ])
  assert.deepEqual(block.source_ids, ['business_tax_ip_closing_041', 'business_tax_form_910_017'])
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

test('metadata table block does not duplicate markdown table text', () => {
  const metadata = {
    blocks: [
      { type: 'table', columns: ['Риск', 'Что это значит'], rows: [['Долг', 'Блокирует карту']] }
    ]
  }
  const text = [
    'Вот таблица:',
    '| Риск | Что это значит |',
    '| --- | --- |',
    '| Долг | Блокирует карту |',
    'После таблицы.'
  ].join('\n')

  assert.equal(normalizeStructuredBlocks(metadata).length, 1)
  assert.equal(stripTableArtifacts(text), 'Вот таблица:\nПосле таблицы.')
})

test('recovers malformed one-line risk pipe table', () => {
  const text = [
    '## Таблица рисков Колонка 1 | Колонка 2 | Колонка 3 --- | --- | ---',
    'Неполная проверка застройщика |',
    'В базе нет подтверждённых сведений о БИН, земле, судах и разрешениях |',
    'Вывод о надёжности ЖК будет неполным [source: business_tax_portals_034] [source: business_tax_ip_closing_041]',
    'Налоговая задолженность |',
    'Закрытие ИП не допускается при наличии задолженности |',
    'Риск отказа в ликвидации [source: business_tax_ip_closing_041]'
  ].join(' ')

  const blocks = recoverMalformedTableBlocks(text)

  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].title, 'Таблица рисков')
  assert.deepEqual(blocks[0].columns, ['Риск', 'Что это значит', 'Комментарий'])
  assert.deepEqual(blocks[0].rows, [
    [
      'Неполная проверка застройщика',
      'В базе нет подтверждённых сведений о БИН, земле, судах и разрешениях',
      'Вывод о надёжности ЖК будет неполным'
    ],
    [
      'Налоговая задолженность',
      'Закрытие ИП не допускается при наличии задолженности',
      'Риск отказа в ликвидации'
    ]
  ])
  assert.deepEqual(blocks[0].source_ids, ['business_tax_portals_034', 'business_tax_ip_closing_041'])
  assert.equal(stripRecoveredTableArtifacts(text), '')
})

test('keeps follow-up text outside recovered malformed table', () => {
  const text = [
    '## Таблица рисков Колонка 1 | Колонка 2 | Колонка 3',
    'Риск | Что это значит | Источник',
    'Налоговая задолженность | Блокирует закрытие ИП | [source: business_tax_ip_closing_041]',
    'Отчётность | Нужно сдать форму 910.00 | [source: business_tax_form_910_017]',
    '> Риск-заметка: перепроверьте актуальные требования на eGov.'
  ].join(' ')

  const blocks = recoverMalformedTableBlocks(text)

  assert.deepEqual(blocks[0].columns, ['Риск', 'Что это значит'])
  assert.deepEqual(blocks[0].rows, [
    ['Налоговая задолженность', 'Блокирует закрытие ИП'],
    ['Отчётность', 'Нужно сдать форму 910.00']
  ])
  assert.deepEqual(blocks[0].source_ids, ['business_tax_ip_closing_041', 'business_tax_form_910_017'])
  assert.equal(stripRecoveredTableArtifacts(text), '> Риск-заметка: перепроверьте актуальные требования на eGov.')
})

test('section heading is not parsed as recovered table row', () => {
  const text = [
    '## Таблица рисков Колонка 1 | Колонка 2 | Колонка 3',
    'Риск | Что это значит | Источник',
    'Налоговая задолженность | Блокирует закрытие ИП | [source: business_tax_ip_closing_041]',
    'Отчётность | Нужно сдать форму 910.00 | [source: business_tax_form_910_017]',
    '## Ограничения',
    'Проверьте актуальные требования.'
  ].join(' ')

  const blocks = recoverMalformedTableBlocks(text)

  assert.deepEqual(blocks[0].columns, ['Риск', 'Что это значит'])
  assert.equal(stripRecoveredTableArtifacts(text), '## Ограничения Проверьте актуальные требования.')
  assert.equal(JSON.stringify(blocks[0].rows).includes('Ограничения'), false)
})

test('normal paragraph after recovered table remains outside table', () => {
  const text = [
    '## Таблица рисков Колонка 1 | Колонка 2 | Колонка 3',
    'Риск | Что это значит | Источник',
    'Налоговая задолженность | Блокирует закрытие ИП | [source: business_tax_ip_closing_041]',
    'Отчётность | Нужно сдать форму 910.00 | [source: business_tax_form_910_017]',
    'Короткий вывод: сначала проверьте долги и отчётность.'
  ].join(' ')

  const blocks = recoverMalformedTableBlocks(text)

  assert.deepEqual(blocks[0].columns, ['Риск', 'Что это значит'])
  assert.equal(stripRecoveredTableArtifacts(text), 'Короткий вывод: сначала проверьте долги и отчётность.')
  assert.equal(JSON.stringify(blocks[0].rows).includes('Короткий вывод'), false)
})
