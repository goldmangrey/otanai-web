# Chat Table Rendering QA

Use this checklist to manually verify Phase 2 table rendering in `otanai-web`.

## Prompts

1. `Сделай таблицу: чем отличается ЭЦП, eGov Mobile и Digital ID в Казахстане?`

2. `Сделай таблицу по теме ареста карты в Казахстане: причина блокировки, кто накладывает ограничение, где проверить, что делать, какие документы нужны, риски.`

3. `Сделай таблицу: проблема, куда обращаться, что подготовить, какой риск. Тема: арест карты, ЧСИ, налоговая блокировка, коллекторы.`

4. Stress prompt for long cells:

```text
Сделай таблицу: сервис, ссылка, что проверить, риск. Используй длинную ссылку https://egov.kz/cms/ru/services/pass_onlineecp в одной ячейке.
```

## Expected Result

- The answer shows a visible real table, not pipe-delimited plain text.
- The table header is readable.
- Rows and cells have borders/padding.
- Wide tables scroll horizontally inside the table block.
- The message bubble does not expand beyond the chat container.
- The page does not get horizontal scroll.
- Long text and URLs inside cells wrap safely or remain contained inside the table wrapper.
- Mobile width around 375px remains usable.
- Code blocks containing pipe text are not converted into tables.

## Browser Checks

- Desktop: verify no horizontal page scrollbar appears.
- Mobile/narrow viewport: verify table scroll is inside `.ai-markdown__table-wrap`.
- Copy/paste a response with a valid GFM table and verify it stays a table after local history reload.
