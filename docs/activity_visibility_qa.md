# Activity Visibility QA

Phase C makes research activity visible only when real retrieval or research events exist.

## Test 1 — Normal Chat

Prompt:

```text
Привет, что ты умеешь?
```

Expected:

- no `Активность · 2`;
- no `Ход проверки`;
- no `Ход исследования`;
- answer renders normally;
- Copy/Regenerate actions still appear normally.

## Test 2 — Auto-RAG / Verification

Setup:

```bash
ENABLE_AUTO_RAG=true
```

Prompt:

```text
Как найти своего ЧСИ, если арестовали карту Kaspi?
```

Expected:

- Sources button appears if backend returns sources;
- `Ход проверки · N` appears only if retrieval/verification activity exists;
- button text is not `Активность · 2`;
- activity items describe safe operational steps such as retrieval, source compilation, and verification;
- no hidden reasoning or raw evidence is visible.

## Test 3 — Table Request With Auto-RAG

Prompt:

```text
Сделай таблицу по теме ареста карты в Казахстане: причина блокировки, кто накладывает, где проверить, что делать.
```

Expected:

- TableBlock still renders as a real table;
- Sources button still works if sources exist;
- `Ход проверки · N` appears only if RAG/verification triggered;
- no generic activity appears for model-only table responses.

## Test 4 — Deep Research Metadata

Prompt, if Deep Research is accessible from the UI:

```text
Проведи глубокое исследование: как проверить застройщика в Казахстане.
```

Expected:

- `Ход исследования · N` appears when deep research activity metadata reaches the UI;
- activity includes safe steps such as planning, retrieval, follow-up, gap or conflict checks;
- no hidden reasoning, raw prompts, raw evidence, or raw JSON are visible.

## Regression Checks

- Sources Drawer still opens below assistant answers when sources exist.
- Structured table blocks still render.
- Loading state still shows a simple status while the answer is pending.
- Old localStorage messages with only routing/synthesis activity are hidden.
