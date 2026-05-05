// QA-only fixtures. They intentionally include unsafe values to verify renderer security.

export const playgroundFixtures = [
  {
    id: 'fixture_markdown_basic',
    title: 'Plain Markdown',
    category: 'markdown',
    notes: 'Headings, lists, links, blockquote, inline code and fenced code.',
    message: {
      id: 'fixture_markdown_basic',
      role: 'assistant',
      status: 'sent',
      content:
        '## Краткий ответ\n\nПисьменная претензия обычно помогает зафиксировать требование до суда.\n\n1. Соберите договор и чек.\n2. Направьте претензию.\n   - Укажите срок ответа.\n   - Сохраните доказательство отправки.\n\n> Ответ справочный и зависит от фактов.\n\nСсылка: [Adilet](https://adilet.zan.kz).\n\nInline `срок` и code block:\n\n```js\nconst days = 10\n```',
      metadata: {}
    }
  },
  {
    id: 'fixture_long_legal_answer',
    title: 'Long Legal Answer',
    category: 'markdown',
    notes: 'Long paragraphs, long URL and long word wrapping.',
    message: {
      id: 'fixture_long_legal_answer',
      role: 'assistant',
      status: 'sent',
      content:
        '## Разбор ситуации\n\nЕсли товар не был передан или услуга оказана ненадлежащим образом, сначала полезно письменно зафиксировать обстоятельства: дату оплаты, способ связи, обещанный срок, доказательства переписки и реквизиты продавца.\n\n### Что сделать\n\n1. Сохранить чек, договор, переписку и фото.\n2. Направить претензию с конкретным требованием.\n3. Если ответа нет, оценить обращение в уполномоченный орган или суд.\n\nОчень длинная ссылка должна переноситься: https://example.com/legal/kazakhstan/consumer-rights/very/long/path/that/must/not/break/the/message/layout\n\nОченьДлинноеСловоБезПробеловКотороеНеДолжноЛоматьШиринуСообщенияИКонтейнер',
      metadata: {}
    }
  },
  {
    id: 'fixture_smart_table',
    title: 'SmartTable',
    category: 'table',
    notes: 'Structured table part with badges, long cells and caption.',
    message: {
      id: 'fixture_smart_table',
      role: 'assistant',
      status: 'sent',
      content: 'Ниже сравнение вариантов.',
      metadata: {
        parts: [
          {
            id: 'part_table_qa',
            type: 'table',
            title: 'Сравнение вариантов',
            caption: 'Ориентировочно, зависит от документов.',
            columns: ['Вариант', 'Когда подходит', 'Риск', 'Срок'],
            rows: [
              ['Претензия', 'До суда, когда есть чек или договор', 'Низкий', '10 дней'],
              ['Жалоба', 'Если продавец игнорирует обращение', 'Средний', '15 рабочих дней'],
              [
                'Иск',
                'Если спор не решён и сумма существенная. Ячейка специально длинная, чтобы проверить clamp и expand на мобильной ширине.',
                'Высокий',
                'Зависит от суда'
              ]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'fixture_empty_table',
    title: 'Empty Table',
    category: 'table',
    notes: 'Invalid/empty table should not crash.',
    message: {
      id: 'fixture_empty_table',
      role: 'assistant',
      status: 'sent',
      content: '',
      metadata: {
        parts: [{ id: 'part_table_empty', type: 'table', title: 'Таблица без данных', columns: ['A'], rows: [] }]
      }
    }
  },
  {
    id: 'fixture_document_preview',
    title: 'Document Preview',
    category: 'document',
    notes: 'Typed document preview with fields, risks and long content.',
    message: {
      id: 'fixture_document_preview',
      role: 'assistant',
      status: 'sent',
      content: 'Готов черновик документа.',
      metadata: {
        parts: [
          {
            id: 'part_document_qa',
            type: 'document_preview',
            document: {
              title: 'Претензия о возврате денежных средств',
              kind: 'claim',
              language: 'ru',
              status: 'draft',
              summary: 'Документ для досудебного обращения к продавцу.',
              fields: { Адресат: 'Продавец', 'Срок ответа': '10 дней' },
              risks: [{ level: 'medium', text: 'Нужно проверить дату покупки и гарантийный срок.' }],
              content:
                'ПРЕТЕНЗИЯ\n\nПрошу вернуть денежные средства за товар ненадлежащего качества. Обстоятельства покупки, сумма и реквизиты должны быть проверены перед отправкой.\n\nНастоящий текст является черновиком и требует проверки фактов.'
            }
          }
        ]
      }
    }
  },
  {
    id: 'fixture_fenced_document',
    title: 'Legacy Fenced Document',
    category: 'document',
    notes: 'Closed ```document fence should become document_preview in final render.',
    message: {
      id: 'fixture_fenced_document',
      role: 'assistant',
      status: 'sent',
      content:
        'Вот документ:\n\n```document\nПретензия\n\nПрошу вернуть денежные средства в течение 10 дней.\n```\n\nПроверьте реквизиты перед отправкой.',
      metadata: {}
    }
  },
  {
    id: 'fixture_legal_blocks',
    title: 'Legal Blocks',
    category: 'legal',
    notes: 'All legal block types in one message.',
    message: {
      id: 'fixture_legal_blocks',
      role: 'assistant',
      status: 'sent',
      content: 'Юридическая структура ответа.',
      metadata: {
        parts: [
          {
            type: 'legal_citation',
            title: 'Гражданский кодекс Республики Казахстан',
            article: 'Статья 9',
            code: 'ГК РК',
            jurisdiction: 'Казахстан',
            status: 'active',
            url: 'https://adilet.zan.kz',
            excerpt: 'Право на защиту гражданских прав.',
            usedFor: 'Правовое основание требования'
          },
          { type: 'warning', title: 'Важно', text: 'Срок обращения нужно проверить по документам.', variant: 'warning' },
          { type: 'risk', title: 'Риски', level: 'medium', items: [{ title: 'Срок', text: 'Может быть пропущен.', mitigation: 'Уточнить дату события.' }] },
          { type: 'checklist', title: 'Что сделать дальше', items: ['Собрать договор', 'Направить претензию', 'Сохранить доказательства'] },
          { type: 'timeline', title: 'Порядок действий', items: [{ label: 'Шаг 1', title: 'Подготовить претензию', status: 'current' }] },
          { type: 'missing_info', title: 'Не хватает данных', items: ['Дата покупки', 'Сумма'], questions: [{ label: 'Когда была покупка?', value: 'date' }] },
          { type: 'suggested_actions', title: 'Следующий шаг', actions: [{ label: 'Сделать претензию', value: 'generate_claim', kind: 'primary' }] },
          { type: 'legal_disclaimer' }
        ]
      }
    }
  },
  {
    id: 'fixture_sources',
    title: 'Sources',
    category: 'sources',
    notes: 'Drawer-first sources, duplicate and unsafe URL cases.',
    message: {
      id: 'fixture_sources',
      role: 'assistant',
      status: 'sent',
      content: 'Ответ с источниками.',
      metadata: {
        sources: [
          { title: 'ГК РК', url: 'https://adilet.zan.kz', sourceType: 'law', status: 'active', article: 'Статья 9', jurisdiction: 'Казахстан' },
          { title: 'Unsafe source', url: 'javascript:alert(1)', sourceType: 'website', status: 'unknown' },
          { title: 'ГК РК duplicate', url: 'https://adilet.zan.kz', sourceType: 'law' }
        ]
      }
    }
  },
  {
    id: 'fixture_mixed_rich_answer',
    title: 'Mixed Rich Answer',
    category: 'mixed',
    notes: 'Realistic rich legal mini-document.',
    message: {
      id: 'fixture_mixed_rich_answer',
      role: 'assistant',
      status: 'sent',
      content: '## Короткий вывод\n\nНачните с письменной претензии и проверки доказательств.',
      metadata: {
        parts: [
          { type: 'markdown', text: '## Короткий вывод\n\nНачните с письменной претензии и проверки доказательств.' },
          { type: 'legal_citation', title: 'ГК РК', article: 'Статья 9', status: 'active', url: 'https://adilet.zan.kz' },
          { type: 'warning', text: 'Не отправляйте документ без проверки реквизитов.' },
          { type: 'table', title: 'Варианты', columns: ['Шаг', 'Риск'], rows: [['Претензия', 'Низкий'], ['Иск', 'Высокий']] },
          { type: 'checklist', title: 'Checklist', items: ['Проверить чек', 'Сохранить переписку'] },
          { type: 'document_preview', document: { title: 'Претензия', content: 'Прошу вернуть денежные средства.' } },
          { type: 'source_panel', sources: [{ title: 'Adilet', url: 'https://adilet.zan.kz', sourceType: 'law' }] },
          { type: 'suggested_actions', actions: ['Сделать претензию'] },
          { type: 'legal_disclaimer' }
        ]
      }
    }
  },
  {
    id: 'fixture_real_chat_target_design',
    title: 'Real Chat Target Design',
    category: 'mixed',
    notes: 'Target layout for owner/design mode: summary, legal basis, risks, checklist, table, document, sources and actions.',
    message: {
      id: 'fixture_real_chat_target_design',
      role: 'assistant',
      status: 'sent',
      content:
        '## Короткий вывод\n\nПо описанию сначала стоит направить письменную претензию и зафиксировать доказательства оплаты.\n\n## Правовое основание\n\nПрава можно защищать через письменное требование, жалобу или иск.\n\n## Риски\n\n1. Может не хватить доказательств оплаты.\n2. Нужно проверить срок обращения.\n\n## Что сделать дальше\n\n1. Соберите чек, договор и переписку.\n2. Направьте претензию.\n3. Если ответа нет, оцените жалобу или иск.',
      metadata: {
        parts: [
          {
            type: 'markdown',
            text: '## Короткий вывод\n\nПо описанию сначала стоит направить письменную претензию и зафиксировать доказательства оплаты.'
          },
          {
            type: 'legal_citation',
            title: 'Гражданский кодекс Республики Казахстан',
            article: 'Статья 9',
            code: 'ГК РК',
            status: 'active',
            jurisdiction: 'Казахстан',
            url: 'https://adilet.zan.kz',
            usedFor: 'Правовое основание требования'
          },
          {
            type: 'risk',
            title: 'Риски',
            level: 'medium',
            items: [
              { text: 'Может не хватить доказательств оплаты.', level: 'medium', mitigation: 'Сохранить чек, выписку и переписку.' },
              { text: 'Нужно проверить срок обращения.', level: 'medium', mitigation: 'Уточнить дату оплаты и дату отказа.' }
            ]
          },
          { type: 'checklist', title: 'Что сделать дальше', items: ['Собрать чек, договор и переписку', 'Направить претензию', 'Оценить жалобу или иск'] },
          {
            type: 'table',
            title: 'Варианты действий',
            columns: ['Вариант', 'Когда подходит', 'Риск'],
            rows: [['Претензия', 'До суда', 'Низкий'], ['Жалоба', 'Если нет ответа', 'Средний'], ['Иск', 'Если спор не решён', 'Высокий']]
          },
          {
            type: 'document_preview',
            document: {
              title: 'Претензия о возврате денежных средств',
              kind: 'claim',
              language: 'ru',
              status: 'draft',
              summary: 'Черновик для досудебного обращения.',
              content: 'ПРЕТЕНЗИЯ\n\nПрошу вернуть денежные средства за неоказанную услугу в течение 10 календарных дней.'
            }
          },
          { type: 'source_panel', sources: [{ title: 'Adilet', url: 'https://adilet.zan.kz', sourceType: 'law', status: 'active' }] },
          { type: 'suggested_actions', title: 'Следующий шаг', actions: [{ label: 'Сделать претензию', value: 'generate_claim', kind: 'primary' }] },
          { type: 'legal_disclaimer' }
        ]
      }
    }
  },
  {
    id: 'fixture_real_chat_bug_closing_ie_kz',
    title: 'Real chat bug — closing IE in Kazakhstan',
    category: 'mixed',
    notes: 'Regression fixture for Stage 11.1: should render multiple rich parts, readable dark contrast and no normal-chat debug chips.',
    message: {
      id: 'fixture_real_chat_bug_closing_ie_kz',
      role: 'assistant',
      status: 'sent',
      content:
        '## Короткий вывод\n\nЗакрытие ИП лучше начинать с проверки задолженности, ККМ, ОФД и социальных платежей.\n\n## Риск-внимание\n\n1. Если есть долги, закрытие может затянуться.\n2. ККМ и ОФД нужно снять корректно, иначе останутся технические и налоговые хвосты.\n\n## Официальные источники\n\nОфициальными источниками являются eGov, кабинет налогоплательщика КГД и официальные сервисы ОФД. Неофициальные статьи и чаты можно использовать только как подсказку.\n\n## Порядок действий\n\n1. Проверить задолженность и социальные платежи.\n2. Закрыть смены ККМ и сверить данные с ОФД.\n3. Снять ККМ с учёта.\n4. Расторгнуть договор с ОФД.\n5. Подать заявление на прекращение деятельности ИП.',
      metadata: {
        parts: [
          {
            type: 'markdown',
            text: '## Короткий вывод\n\nЗакрытие ИП лучше начинать с проверки задолженности, ККМ, ОФД и социальных платежей.'
          },
          {
            type: 'risk',
            title: 'Риск-внимание',
            level: 'medium',
            items: [
              { text: 'Если есть долги, закрытие может затянуться.', level: 'medium' },
              { text: 'ККМ и ОФД нужно снять корректно.', level: 'medium' }
            ]
          },
          {
            type: 'checklist',
            title: 'Порядок действий',
            items: ['Проверить задолженность', 'Закрыть смены ККМ', 'Снять ККМ с учёта', 'Расторгнуть договор с ОФД', 'Подать заявление']
          },
          {
            type: 'source_panel',
            sources: [
              { title: 'eGov', url: 'https://egov.kz', sourceType: 'website', status: 'unknown' },
              { title: 'Комитет государственных доходов', url: 'https://kgd.gov.kz', sourceType: 'registry', status: 'unknown' }
            ]
          },
          { type: 'legal_disclaimer' }
        ]
      }
    }
  },
  {
    id: 'fixture_streaming_draft',
    title: 'Streaming Draft',
    category: 'streaming',
    notes: 'Draft phase with unclosed code fence and unclosed document fence.',
    renderPhase: 'draft',
    message: {
      id: 'fixture_streaming_draft',
      role: 'assistant',
      status: 'loading',
      content: 'Пишу ответ:\n\n```js\nconst x = 1\n\n```document\nПретензия',
      metadata: {}
    }
  },
  {
    id: 'fixture_security_cases',
    title: 'Security Cases',
    category: 'security',
    notes: 'Unsafe links and raw HTML should remain inert.',
    message: {
      id: 'fixture_security_cases',
      role: 'assistant',
      status: 'sent',
      content:
        'Unsafe links: [javascript](javascript:alert(1)), [data](data:text/html,<script>alert(1)</script>), [obfuscated](java\nscript:alert(1)).\n\nRaw HTML should be skipped: <img src=x onerror=alert(1)> <script>alert(1)</script>',
      metadata: {
        parts: [
          { type: 'table', columns: ['Value'], rows: [[{ label: 'Object cell' }], [{ nested: { value: 'JSON fallback' } }]] },
          { type: 'source_panel', sources: [{ title: 'Unsafe source', url: 'data:text/html,<script>alert(1)</script>' }] }
        ]
      }
    }
  }
]

export const v4RichLegalAnswerEvents = [
  { type: 'message_start', payload: { messageId: 'fixture_v4', requestId: 'req_v4', protocolVersion: 4 } },
  { type: 'block_start', payload: { blockId: 'part_markdown_v4', blockType: 'markdown' } },
  { type: 'markdown_delta', payload: { blockId: 'part_markdown_v4', text: '## Короткий вывод\n\n' } },
  { type: 'markdown_delta', payload: { blockId: 'part_markdown_v4', text: 'Сначала направьте претензию и сохраните доказательства.' } },
  { type: 'block_end', payload: { blockId: 'part_markdown_v4', blockType: 'markdown' } },
  { type: 'table_start', payload: { blockId: 'part_table_v4', title: 'Варианты', columns: ['Шаг', 'Риск'] } },
  { type: 'table_row', payload: { blockId: 'part_table_v4', row: ['Претензия', 'Низкий'] } },
  { type: 'table_row', payload: { blockId: 'part_table_v4', row: ['Иск', 'Средний'] } },
  { type: 'table_end', payload: { blockId: 'part_table_v4' } },
  { type: 'source_add', payload: { source: { title: 'Adilet', url: 'https://adilet.zan.kz', sourceType: 'law' } } },
  { type: 'legal_citation_add', payload: { part: { type: 'legal_citation', title: 'ГК РК', article: 'Статья 9', url: 'https://adilet.zan.kz' } } },
  { type: 'warning_add', payload: { part: { type: 'warning', text: 'Проверьте срок обращения.' } } },
  { type: 'document_preview', payload: { document: { title: 'Претензия', content: 'Прошу вернуть денежные средства.' } } },
  {
    type: 'done',
    payload: {
      assistantText: '## Короткий вывод\n\nСначала направьте претензию и сохраните доказательства.',
      metadata: {
        parts: [
          { id: 'part_markdown_v4', type: 'markdown', text: '## Короткий вывод\n\nСначала направьте претензию и сохраните доказательства.' },
          { id: 'part_table_v4', type: 'table', title: 'Варианты', columns: ['Шаг', 'Риск'], rows: [['Претензия', 'Низкий'], ['Иск', 'Средний']] },
          { type: 'legal_citation', title: 'ГК РК', article: 'Статья 9', url: 'https://adilet.zan.kz' },
          { type: 'warning', text: 'Проверьте срок обращения.' },
          { type: 'document_preview', document: { title: 'Претензия', content: 'Прошу вернуть денежные средства.' } },
          { type: 'source_panel', sources: [{ title: 'Adilet', url: 'https://adilet.zan.kz', sourceType: 'law' }] }
        ]
      },
      protocolVersion: 4
    }
  }
]

export const fixtureCategories = ['all', 'markdown', 'table', 'document', 'legal', 'sources', 'mixed', 'streaming', 'security']
