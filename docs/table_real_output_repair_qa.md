# Real Table Output Repair QA

## Goal

Tables in OtanAI chat answers should render as real Markdown/HTML tables, not as plain text with pipe characters.

## Test 1: Card Arrest Table

Prompt:

```text
Сделай таблицу по теме ареста карты в Казахстане: причина блокировки, кто накладывает ограничение, где проверить, что делать, какие документы нужны, риски.
```

Expected:

- The answer contains a real rendered table.
- The table is not shown as a plain paragraph with `|` characters.
- If the table is wide, it scrolls inside the answer bubble.
- The page itself does not get horizontal overflow.

## Test 2: Digital Identity Table

Prompt:

```text
Сделай таблицу: чем отличается ЭЦП, eGov Mobile и Digital ID в Казахстане?
```

Expected:

- The table renders correctly.
- Header, separator, and rows are visually parsed as a table.
- Long cell text wraps safely.

## Test 3: Risk Routing Table

Prompt:

```text
Сделай таблицу: проблема, куда обращаться, что подготовить, какой риск. Тема: арест карты, ЧСИ, налоговая блокировка, коллекторы.
```

Expected:

- The table renders correctly.
- No pipe-text paragraph appears.
- Mobile viewport keeps the table inside an internal horizontal scroll area.
