import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isLegalResearchQuery, shouldUseNpaAssistant } from './legalIntent.js'

test('construction code query is legal research', () => {
  assert.equal(isLegalResearchQuery('Найди нормы Строительного кодекса РК 2026 про строительство'), true)
})

test('Adilet capability question is legal research', () => {
  assert.equal(isLegalResearchQuery('Ты можешь искать по Адилету?'), true)
})

test('normal greeting is not legal research', () => {
  assert.equal(isLegalResearchQuery('Привет, как дела?'), false)
})

test('tax business practical prompt without legal terms stays on old chat', () => {
  assert.equal(isLegalResearchQuery('Как открыть кофейню и посчитать расходы для бизнеса?'), false)
})

test('simple Kazakh and English legal terms are detected', () => {
  assert.equal(isLegalResearchQuery('еңбек құқығы бойынша бап тап'), true)
  assert.equal(isLegalResearchQuery('find a law article about construction permits'), true)
})

test('NPA assistant detects practical Kazakhstan legal domains', () => {
  assert.equal(shouldUseNpaAssistant('Школа не принимает жалобу по ребенку. Что делать?'), true)
  assert.equal(shouldUseNpaAssistant('Коллекторы звонят родственникам и угрожают'), true)
  assert.equal(shouldUseNpaAssistant('Застройщик задерживает сдачу квартиры по долевому участию'), true)
  assert.equal(shouldUseNpaAssistant('Судебный исполнитель арестовал банковский счет'), true)
  assert.equal(shouldUseNpaAssistant('Мне отказали в социальной выплате через госуслугу'), true)
  assert.equal(shouldUseNpaAssistant('Акимат не отвечает на обращение'), true)
  assert.equal(shouldUseNpaAssistant('ИП на упрощенке пропустил срок формы 910'), true)
  assert.equal(shouldUseNpaAssistant('работодатель не выдает приказ'), true)
  assert.equal(shouldUseNpaAssistant('куда жаловаться на госорган'), true)
})

test('NPA assistant keeps non-legal creative prompts out of legal routing', () => {
  assert.equal(shouldUseNpaAssistant('напиши короткое поздравление другу'), false)
  assert.equal(shouldUseNpaAssistant('дай рецепт простого пирога'), false)
})
