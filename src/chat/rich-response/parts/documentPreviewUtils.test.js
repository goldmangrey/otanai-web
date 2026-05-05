import test from 'node:test'
import assert from 'node:assert/strict'

import {
  documentToPlainText,
  inferDocumentKind,
  normalizeDocumentFields,
  normalizeDocumentPreviewPart,
  normalizeDocumentRisks,
  parseDocumentFences,
  shouldCollapseDocumentContent,
  splitMarkdownByDocumentFences
} from './documentPreviewUtils.js'

test('parseDocumentFences parses closed document fence', () => {
  const fences = parseDocumentFences('Before\n```document\nПретензия\nТекст\n```\nAfter')
  assert.equal(fences.length, 1)
  assert.equal(fences[0].language, 'document')
  assert.equal(fences[0].content, 'Претензия\nТекст')
})

test('parseDocumentFences parses doc and template fences', () => {
  assert.equal(parseDocumentFences('```doc\nЗаявление\n```').length, 1)
  assert.equal(parseDocumentFences('```template\nШаблон\n```').length, 1)
})

test('parseDocumentFences does not parse normal code fences', () => {
  assert.equal(parseDocumentFences('```js\nconst a = 1\n```').length, 0)
  assert.equal(parseDocumentFences('```python\nprint(1)\n```').length, 0)
})

test('parseDocumentFences does not parse unclosed fence', () => {
  assert.equal(parseDocumentFences('```document\nПретензия\nТекст').length, 0)
})

test('splitMarkdownByDocumentFences preserves markdown before and after document', () => {
  const parts = splitMarkdownByDocumentFences('Вот документ:\n```document\nПретензия\nТекст\n```\nПроверьте дату.')

  assert.equal(parts.length, 3)
  assert.deepEqual(parts[0], { type: 'markdown', text: 'Вот документ:' })
  assert.equal(parts[1].type, 'document_preview')
  assert.equal(parts[1].document.content, 'Претензия\nТекст')
  assert.deepEqual(parts[2], { type: 'markdown', text: 'Проверьте дату.' })
})

test('splitMarkdownByDocumentFences preserves order of multiple documents', () => {
  const parts = splitMarkdownByDocumentFences([
    'A',
    '```document',
    'Претензия',
    '```',
    'B',
    '```template',
    'Заявление',
    '```',
    'C'
  ].join('\n'))

  assert.deepEqual(parts.map((part) => part.type), [
    'markdown',
    'document_preview',
    'markdown',
    'document_preview',
    'markdown'
  ])
})

test('splitMarkdownByDocumentFences does not create empty markdown parts', () => {
  const parts = splitMarkdownByDocumentFences('```document\nПретензия\n```')
  assert.equal(parts.length, 1)
  assert.equal(parts[0].type, 'document_preview')
})

test('normalizeDocumentPreviewPart normalizes typed part', () => {
  const part = normalizeDocumentPreviewPart({
    type: 'document_preview',
    document: {
      title: 'Претензия о возврате',
      kind: 'claim',
      language: 'ru',
      status: 'draft',
      content: 'Полный текст',
      fields: { Адресат: 'Продавец' },
      risks: ['Средний риск']
    }
  })

  assert.equal(part.type, 'document_preview')
  assert.equal(part.document.title, 'Претензия о возврате')
  assert.equal(part.document.kind, 'claim')
  assert.deepEqual(part.document.fields, [{ label: 'Адресат', value: 'Продавец' }])
  assert.deepEqual(part.document.risks, [{ level: 'medium', text: 'Средний риск' }])
})

test('normalizeDocumentPreviewPart handles empty part safely', () => {
  const part = normalizeDocumentPreviewPart(null)
  assert.equal(part.type, 'document_preview')
  assert.equal(part.document.title, 'Документ')
  assert.equal(part.document.content, '')
})

test('normalizeDocumentFields supports array and object fields', () => {
  assert.deepEqual(normalizeDocumentFields([{ label: 'Адресат', value: 'Продавец' }]), [
    { label: 'Адресат', value: 'Продавец' }
  ])
  assert.deepEqual(normalizeDocumentFields({ 'Срок ответа': '10 дней' }), [
    { label: 'Срок ответа', value: '10 дней' }
  ])
  assert.deepEqual(normalizeDocumentFields(null), [])
})

test('normalizeDocumentRisks supports string and object risks with level detection', () => {
  assert.deepEqual(normalizeDocumentRisks(['Высокий риск']), [
    { level: 'high', text: 'Высокий риск' }
  ])
  assert.deepEqual(normalizeDocumentRisks([{ level: 'danger', text: 'Нужно срочно проверить срок' }]), [
    { level: 'danger', text: 'Нужно срочно проверить срок' }
  ])
})

test('documentToPlainText returns content and falls back to summary/title', () => {
  assert.equal(documentToPlainText({ content: 'Full', summary: 'Summary', title: 'Title' }), 'Full')
  assert.equal(documentToPlainText({ summary: 'Summary', title: 'Title' }), 'Summary')
  assert.equal(documentToPlainText({ title: 'Title' }), 'Title')
})

test('shouldCollapseDocumentContent detects long content', () => {
  assert.equal(shouldCollapseDocumentContent('short'), false)
  assert.equal(shouldCollapseDocumentContent('x'.repeat(1001)), true)
})

test('inferDocumentKind detects common legal document kinds', () => {
  assert.equal(inferDocumentKind('Претензия\nТекст'), 'claim')
  assert.equal(inferDocumentKind('Исковое заявление\nТекст'), 'lawsuit')
  assert.equal(inferDocumentKind('Договор\nТекст'), 'contract')
})
