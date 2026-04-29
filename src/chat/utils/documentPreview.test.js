import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  getCodeLanguage,
  isDocumentLanguage,
  isDocumentLike,
  isDocumentPlaceholder,
  isStandaloneDocument,
  splitDocumentPlaceholders
} from './documentPreview.js'

test('detects document fence language aliases', () => {
  assert.equal(getCodeLanguage('language-document'), 'document')
  assert.equal(isDocumentLanguage('document'), true)
  assert.equal(isDocumentLanguage('doc'), true)
  assert.equal(isDocumentLanguage('template'), true)
  assert.equal(isDocumentLanguage('legal'), true)
})

test('does not classify normal code languages as documents', () => {
  assert.equal(isDocumentLanguage('python'), false)
  assert.equal(isDocumentLanguage('js'), false)
  assert.equal(isDocumentLanguage('bash'), false)
  assert.equal(isDocumentLanguage('json'), false)
})

test('detects standalone document-like answer conservatively', () => {
  const input = [
    'Кому: [название госоргана]',
    'От: [ФИО]',
    '',
    'ЖАЛОБА',
    '',
    'Прошу рассмотреть обращение.',
    '',
    'Дата: [дата]'
  ].join('\n')

  assert.equal(isStandaloneDocument(input), true)
})

test('does not convert normal chat answer mentioning application into document', () => {
  const input = 'Чтобы подать заявление, зайдите на eOtinish и заполните форму.'

  assert.equal(isStandaloneDocument(input), false)
  assert.equal(isDocumentLike(input), false)
})

test('splits and detects placeholders', () => {
  const parts = splitDocumentPlaceholders('Договор № [номер договора], ИИН: [ИИН]')

  assert.deepEqual(parts.filter(isDocumentPlaceholder), ['[номер договора]', '[ИИН]'])
})
