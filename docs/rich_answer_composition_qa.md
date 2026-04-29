# Rich Answer Composition QA

## Goal

Table answers should feel like complete assistant responses: short intro, visual table block, concise warning/note, then sources/activity/actions.

## Test 1: Card Arrest Table

Prompt:

```text
Сделай таблицу по теме ареста карты в Казахстане: причина блокировки, кто накладывает ограничение, где проверить, что делать, какие документы нужны, риски.
```

Expected:

- Short intro text appears before the table.
- Rendered table appears from `metadata.blocks`.
- Warning callout appears after the table.
- No raw pipe text is visible.
- No code block is visible for table data.
- Sources/activity/actions stay below the structured blocks.

## Test 2: Digital Identity Table

Prompt:

```text
Сделай таблицу: чем отличается ЭЦП, eGov Mobile и Digital ID в Казахстане?
```

Expected:

- Intro appears.
- Table renders cleanly.
- Optional note/callout appears if relevant.
- Layout remains calm and readable.

## Test 3: Casual Chat

Prompt:

```text
Привет, что ты умеешь?
```

Expected:

- Normal text answer.
- No random table block.
- No random callout block.

## Compatibility Checks

- Sources button remains below blocks when sources exist.
- Research Activity remains below blocks when activity exists.
- Copy/Regenerate actions remain outside message content as before.
- DocumentPreview still works for document answers.
- Valid Markdown table fallback still renders.
