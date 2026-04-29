# Metadata Blocks Table QA

## Goal

Tables should render from `metadata.blocks`, not from raw Markdown pipe text or code-looking table drafts.

## Test 1: Card Arrest Table

Prompt:

```text
Сделай таблицу по теме ареста карты в Казахстане: причина блокировки, кто накладывает ограничение, где проверить, что делать, какие документы нужны, риски.
```

Expected:

- Assistant text is a short clean intro.
- A real rendered table appears below the intro.
- No raw pipes are visible as a paragraph.
- No `table columns:` / `columns:` / `row:` text is visible.
- No CODE block is shown for table data.

## Test 2: Digital Identity Comparison

Prompt:

```text
Сделай таблицу: чем отличается ЭЦП, eGov Mobile и Digital ID в Казахстане?
```

Expected:

- `metadata.blocks` contains a table block.
- Frontend renders the block as a real table.
- Long text wraps inside cells.

## Test 3: Business Type Comparison

Prompt:

```text
Сравни в таблице: ИП, ТОО, самозанятость. Колонки: кому подходит, налоги, риски.
```

Expected:

- Table renders as a structured block.
- No raw table syntax is visible.
- Horizontal scroll is contained inside the table block if needed.

## Test 4: Casual Chat

Prompt:

```text
Привет, что ты умеешь?
```

Expected:

- No metadata table block.
- Normal markdown answer renders unchanged.

## Compatibility Checks

- Valid Markdown tables still render as fallback.
- DocumentPreview still works for `document` blocks.
- Sources button/drawer still works when `metadata.sources` exists.
- Activity timeline remains unchanged.
- Copy answer still works.
