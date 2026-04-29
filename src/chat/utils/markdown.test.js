import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalizeAssistantMarkdown } from './markdown.js'

test('normalizes heading and numbered list from one-line assistant answer', () => {
  const input = 'Простыми словами это работает так. #### Как это работает 1. У вас есть накопления 2. Банк выдает заем 3. Сделка закрывается'
  const output = normalizeAssistantMarkdown(input)

  assert.match(output, /\n\n#### Как это работает\n\n1\. У вас есть накопления\n2\. Банк выдает заем\n3\. Сделка закрывается/)
})

test('separates glued h2 sections', () => {
  const input = 'Конечно. ## 1) Что такое Конституция РК ## 2) Действующая Конституция ## 3) Что проверить'
  const output = normalizeAssistantMarkdown(input)

  assert.match(output, /Конечно\.\n\n### 1\. Что такое Конституция РК\n\n### 2\. Действующая Конституция\n\n### 3\. Что проверить/)
})

test('normalizes one-line bullet lists into vertical markdown list', () => {
  const input = '- краткий конспект - таблица по кодексам - реферат - презентация - анализ закона'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, '- краткий конспект\n- таблица по кодексам\n- реферат\n- презентация\n- анализ закона')
})

test('adds missing GFM separator to pseudo tables with pipe rows', () => {
  const input = [
    'Причина блокировки | Кто накладывает | Где проверить | Что делать | Документы | Риски',
    'Арест карты | ЧСИ или суд | eGov и банк | Проверить постановление | ИИН, заявление | Просрочка сроков',
    'Подозрение банка | Банк | Приложение банка | Уточнить причину | Удостоверение | Ограничение операций'
  ].join('\n')
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, [
    '| Причина блокировки | Кто накладывает | Где проверить | Что делать | Документы | Риски |',
    '| --- | --- | --- | --- | --- | --- |',
    '| Арест карты | ЧСИ или суд | eGov и банк | Проверить постановление | ИИН, заявление | Просрочка сроков |',
    '| Подозрение банка | Банк | Приложение банка | Уточнить причину | Удостоверение | Ограничение операций |'
  ].join('\n'))
})

test('keeps existing GFM table separator intact', () => {
  const input = [
    '| Инструмент | Что это | Для чего нужен |',
    '|---|---|---|',
    '| ЭЦП | Электронная подпись | Подписывать документы |',
    '| eGov Mobile | Приложение | Получать госуслуги |'
  ].join('\n')
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, input)
})

test('normalizes real one-line table output after heading', () => {
  const input = '## Таблица по аресту карты в Казахстане | Причина блокировки | Кто накладывает ограничение | Где проверить | Что делать | Какие документы нужны | Риски | | --- | --- | --- | --- | --- | --- | | Долг по кредиту | ЧСИ по исполнительному производству | eGov, банк, уведомление от ЧСИ | Уточнить сумму долга, связаться с ЧСИ | ИИН, удостоверение личности | Списание денег, арест счетов |'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, [
    '## Таблица по аресту карты в Казахстане',
    '',
    '| Причина блокировки | Кто накладывает ограничение | Где проверить | Что делать | Какие документы нужны | Риски |',
    '| --- | --- | --- | --- | --- | --- |',
    '| Долг по кредиту | ЧСИ по исполнительному производству | eGov, банк, уведомление от ЧСИ | Уточнить сумму долга, связаться с ЧСИ | ИИН, удостоверение личности | Списание денег, арест счетов |'
  ].join('\n'))
})

test('normalizes safe one-line table without heading', () => {
  const input = 'Причина | Кто | Где | | --- | --- | --- | | Долг | ЧСИ | eGov | | Налог | КГД | kgd.gov.kz |'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, [
    '| Причина | Кто | Где |',
    '| --- | --- | --- |',
    '| Долг | ЧСИ | eGov |',
    '| Налог | КГД | kgd.gov.kz |'
  ].join('\n'))
})

test('does not break repaired table cells that contain numbered steps', () => {
  const input = '## Таблица | Причина | Что делать | Риски | | --- | --- | --- | | Долг | 1. Проверить eGov 2. Связаться с ЧСИ | 1. Списание денег 2. Арест счетов |'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, [
    '## Таблица',
    '',
    '| Причина | Что делать | Риски |',
    '| --- | --- | --- |',
    '| Долг | 1. Проверить eGov 2. Связаться с ЧСИ | 1. Списание денег 2. Арест счетов |'
  ].join('\n'))
})

test('does not break repaired table cells that contain bullet-like text', () => {
  const input = '## Таблица | Причина | Что подготовить | | --- | --- | | Арест карты | - ИИН - удостоверение - заявление |'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, [
    '## Таблица',
    '',
    '| Причина | Что подготовить |',
    '| --- | --- |',
    '| Арест карты | - ИИН - удостоверение - заявление |'
  ].join('\n'))
})

test('normalizes eGov pseudo table without separator', () => {
  const input = [
    'Инструмент | Что это | Для чего нужен',
    'ЭЦП | Электронная подпись | Подписывать документы',
    'eGov Mobile | Приложение | Получать госуслуги'
  ].join('\n')
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, [
    '| Инструмент | Что это | Для чего нужен |',
    '| --- | --- | --- |',
    '| ЭЦП | Электронная подпись | Подписывать документы |',
    '| eGov Mobile | Приложение | Получать госуслуги |'
  ].join('\n'))
})

test('does not normalize pipe rows inside fenced code blocks', () => {
  const input = [
    '```text',
    'Причина | Действие',
    'Арест | Проверить',
    '```'
  ].join('\n')
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, input)
})

test('normalizes wide table with long url cell without changing cell text', () => {
  const longUrl = 'https://egov.kz/cms/ru/services/pass_onlineecp'
  const input = [
    'Причина | Кто накладывает | Где проверить | Что делать | Документы | Риски',
    `Арест карты | ЧСИ или суд | ${longUrl} | Проверить постановление | ИИН, заявление | Просрочка сроков`
  ].join('\n')
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, [
    '| Причина | Кто накладывает | Где проверить | Что делать | Документы | Риски |',
    '| --- | --- | --- | --- | --- | --- |',
    `| Арест карты | ЧСИ или суд | ${longUrl} | Проверить постановление | ИИН, заявление | Просрочка сроков |`
  ].join('\n'))
})

test('does not convert ordinary sentence with a single pipe into table', () => {
  const input = 'Можно выбрать вариант A | B только если это часть текста.'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, input)
})

test('does not convert unsafe one-line pipe text without data row', () => {
  const input = 'Сравнение выглядит так: A | B | | --- | --- | но данных ещё нет.'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, input)
})

test('does not split ordinary numbers without list sequence', () => {
  const input = 'Сумма 10 млн тенге, срок 1-2 рабочих дня и 2026 год остаются обычным текстом.'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, input)
})

test('does not split ordinary hyphenated phrases as bullet lists', () => {
  const input = 'Срок 1-2 рабочих дня, сумма 10 млн тенге, закон - это источник правил.'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, input)
})

test('keeps plain text readable', () => {
  const input = 'Обычный ответ без markdown.'
  const output = normalizeAssistantMarkdown(input)

  assert.equal(output, input)
})
