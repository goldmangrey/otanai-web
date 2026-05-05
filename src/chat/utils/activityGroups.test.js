import assert from 'node:assert/strict'
import test from 'node:test'

import { groupResearchActivity } from './activityGroups.js'

function groupIds(groups) {
  return groups.map((group) => group.id)
}

test('empty activity returns empty groups', () => {
  assert.deepEqual(groupResearchActivity({ activity: [] }), [])
})

test('budgeting and planning are grouped into planning', () => {
  const groups = groupResearchActivity({
    activity: [
      { phase: 'budgeting', label: 'Оцениваю глубину проверки', status: 'done' },
      { phase: 'planning', label: 'Разбиваю запрос', status: 'done' }
    ]
  })

  assert.deepEqual(groupIds(groups), ['planning'])
  assert.equal(groups[0].label, 'Планирование')
  assert.equal(groups[0].count, 2)
})

test('retrieval and source compilation are grouped into retrieval', () => {
  const groups = groupResearchActivity({
    activity: [
      { phase: 'retrieval', label: 'Проверяю БИН', status: 'running' },
      { phase: 'source_compilation', label: 'Отбираю источники', status: 'done' }
    ],
    sourceSelection: {
      reviewed_count: 14,
      used_count: 9,
      cited_count: 7,
      official_count: 5
    }
  })

  assert.deepEqual(groupIds(groups), ['retrieval'])
  assert.equal(groups[0].label, 'Поиск источников')
  assert.equal(groups[0].status, 'running')
  assert.deepEqual(groups[0].summary, { reviewed: 14, used: 9, cited: 7, official: 5 })
})

test('coverage and verification are grouped into coverage', () => {
  const groups = groupResearchActivity({
    activity: [
      { phase: 'coverage', label: 'Покрыто направление', status: 'done' },
      { phase: 'verification', label: 'Проверяю источники', status: 'done' }
    ]
  })

  assert.deepEqual(groupIds(groups), ['coverage'])
  assert.equal(groups[0].label, 'Проверка покрытия')
})

test('gaps conflicts and warnings are grouped into risks', () => {
  const groups = groupResearchActivity({
    activity: [
      { phase: 'gap_analysis', label: 'Есть пробел', status: 'warning' },
      { phase: 'conflict_check', label: 'Есть расхождение', status: 'warning' },
      { phase: 'warning', label: 'Ограничение данных', status: 'warning' }
    ]
  })

  assert.deepEqual(groupIds(groups), ['risks'])
  assert.equal(groups[0].label, 'Пробелы и риски')
  assert.equal(groups[0].status, 'warning')
})

test('quality and synthesis groups are created', () => {
  const groups = groupResearchActivity({
    activity: [
      { phase: 'quality', label: 'Проверяю качество', status: 'done' },
      { phase: 'synthesis', label: 'Формирую вывод', status: 'done' }
    ]
  })

  assert.deepEqual(groupIds(groups), ['quality', 'synthesis'])
  assert.equal(groups[0].label, 'Качество ответа')
  assert.equal(groups[1].label, 'Формирование ответа')
})

test('preserves item order and hides empty groups', () => {
  const groups = groupResearchActivity({
    activity: [
      { phase: 'retrieval', label: 'Первый поиск', status: 'done', ts: 2 },
      { phase: 'planning', label: 'План', status: 'done', ts: 1 },
      { phase: 'retrieval', label: 'Второй поиск', status: 'done', ts: 3 }
    ]
  })

  assert.deepEqual(groupIds(groups), ['planning', 'retrieval'])
  assert.deepEqual(groups[1].items.map((item) => item.label), ['Первый поиск', 'Второй поиск'])
})

test('does not expose raw json or hidden reasoning markers', () => {
  const groups = groupResearchActivity({
    activity: [
      { phase: 'retrieval', label: '{"raw":true}', status: 'done' },
      { phase: 'retrieval', label: 'raw_evidence chain_of_thought', status: 'done' },
      { phase: 'retrieval', label: 'Безопасный поиск', detail: 'system_prompt secret', status: 'done' }
    ]
  })

  assert.equal(groups.length, 1)
  assert.equal(groups[0].count, 1)
  assert.equal(groups[0].items[0].label, 'Безопасный поиск')
  assert.equal(groups[0].items[0].detail, '')
})

test('many events are grouped without losing count', () => {
  const activity = Array.from({ length: 18 }, (_, index) => ({
    phase: index % 2 === 0 ? 'retrieval' : 'coverage',
    label: `event ${index}`,
    status: 'done'
  }))
  const groups = groupResearchActivity({ activity })

  assert.equal(groups.find((group) => group.id === 'retrieval').count, 9)
  assert.equal(groups.find((group) => group.id === 'coverage').count, 9)
})
