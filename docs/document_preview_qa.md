# Document Preview QA

Use this checklist to manually verify Phase 3 A4-like document rendering.

## Prompts

1. `Покажи пример заявления в банк на реструктуризацию кредита в виде шаблона с полями в квадратных скобках.`

2. `Составь жалобу в eOtinish на задержку зарплаты работодателем.`

3. `Составь заявление ЧСИ о снятии ареста с зарплатной карты.`

4. Normal-code regression prompt:

```text
Покажи пример Python-кода print("hello").
```

5. Conservative detection regression prompt:

```text
Объясни, как подать заявление через eOtinish.
```

## Expected Result

- Templates/statements/complaints render as an A4-like light document preview.
- `document`, `doc`, `template`, and `legal` fenced code blocks render as document previews.
- Normal code blocks such as `python`, `js`, `bash`, and `json` remain normal code blocks.
- Placeholders such as `[ФИО]`, `[ИИН]`, `[дата]`, `[номер договора]` are highlighted.
- `Скопировать документ` copies only the document text, without markdown fences, explanation text, or button labels.
- Document preview stays inside the assistant bubble.
- Long lines, many placeholders, and long organization names wrap safely.
- Mobile width around 375px has no horizontal page scroll.
- Sources/citations, if present, are outside the document block.
