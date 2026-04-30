# Document Preview Safety QA

## Should Not Render DocumentPreview

### Test 1 — Deep Research / Developer Risk

Prompt:

```text
Проведи глубокое исследование: как проверить надежность застройщика в Казахстане перед покупкой квартиры в строящемся ЖК. Нужны официальные источники, признаки риска, что проверить по БИН и когда лучше не подписывать договор.
```

Expected:

- normal markdown answer;
- may include table, checklist-style bullets, callout, sources, and research activity;
- no whole white A4 DocumentPreview;
- no raw JSON or hidden reasoning.

### Test 2 — Contract Explanation

Prompt:

```text
Объясни, когда нельзя подписывать договор с застройщиком.
```

Expected:

- normal explanatory answer;
- no A4 DocumentPreview.

### Test 3 — Contract Risks

Prompt:

```text
Какие риски бывают в договоре долевого участия?
```

Expected:

- normal answer/checklist;
- no A4 DocumentPreview.

## Should Render DocumentPreview

### Test 4 — ChSI Application

Prompt:

```text
Составь заявление ЧСИ о снятии ареста с зарплатной карты.
```

Expected:

- short normal intro/outro;
- A4 DocumentPreview only for the actual заявление body;
- sources/activity remain separate when metadata exists.

### Test 5 — eOtinish Complaint

Prompt:

```text
Напиши жалобу в eOtinish на бездействие ЧСИ.
```

Expected:

- A4 DocumentPreview only for the complaint body;
- explanation outside the document stays normal markdown.

### Test 6 — Developer Claim Template

Prompt:

```text
Сделай шаблон претензии застройщику.
```

Expected:

- A4 DocumentPreview for the pretension/template body;
- no whole-answer A4 wrapper.

## Regression Checks

- `legal` fenced code blocks do not automatically become DocumentPreview.
- Explicit `document` fenced blocks render only when metadata artifact intent allows document preview.
- Sources Drawer still works.
- ResearchActivity still works.
- TableBlock still works.
