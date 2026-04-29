# Structured Table Block QA

## Goal

Model-generated tables should render as real HTML tables through fenced `table` blocks, not as plain pipe-text paragraphs.

## Test 1: Card Arrest Table

Prompt:

```text
Сделай таблицу по теме ареста карты в Казахстане: причина блокировки, кто накладывает ограничение, где проверить, что делать, какие документы нужны, риски.
```

Expected:

- The answer contains a rendered table block.
- Raw `columns:` / `row:` text is not visible.
- No plain paragraph with pipe characters is visible.
- Wide content scrolls inside the table block, not the page.

## Test 2: Digital Identity Comparison

Prompt:

```text
Сделай таблицу: чем отличается ЭЦП, eGov Mobile и Digital ID в Казахстане?
```

Expected:

- The answer renders a table block.
- Header cells and body cells are visible as an actual table.
- Long text wraps safely inside cells.

## Test 3: Risk Routing Table

Prompt:

```text
Сделай таблицу: проблема, куда обращаться, что подготовить, какой риск. Тема: арест карты, ЧСИ, налоговая блокировка, коллекторы.
```

Expected:

- The answer renders a table block.
- No raw table syntax is visible.
- Existing Sources button/drawer behavior remains unchanged when citations exist.

## Mobile Width

Set viewport to mobile width.

Expected:

- Table block stays inside the assistant bubble.
- Horizontal scroll is contained inside the table block.
- No page-level horizontal overflow.

## Long Cell Text

Ask for a table with detailed explanations in cells.

Expected:

- Long cell text wraps.
- The table remains readable.
- The page layout does not break.

## Copy Answer

Copy the assistant answer.

Expected:

- Copy action still works.
- Table block content remains part of the copied response text.
