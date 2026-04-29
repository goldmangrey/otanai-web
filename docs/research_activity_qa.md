# Research Activity Timeline QA

Phase 5 adds a safe user-facing activity timeline for assistant answers. It must show visible action summaries only, never hidden chain-of-thought, private reasoning, raw prompts, or raw evidence.

## Manual Checks

### 1. ChSI / Card Arrest

Prompt:

```text
Как найти своего ЧСИ, если арестовали карту Kaspi?
```

Expected:

- Loading state can show a compact activity status.
- Final assistant answer can show `Активность · N`.
- Timeline items are short visible statuses, for example routing, retrieval, verification, synthesis.
- No hidden thoughts, raw debug evidence, prompt text, or private reasoning is visible.
- Sources remain separate from activity if source metadata exists.

### 2. Research-Like Question

Prompt:

```text
Проведи глубокое исследование: как проверить застройщика в Казахстане?
```

Expected:

- Activity appears if metadata is available.
- If Deep Research-style `researchLog` is present in metadata, it is converted into safe labels/details.
- The UI does not display raw JSON.
- Tables, document preview, and source rendering remain intact.

### 3. Simple Chat

Prompt:

```text
Привет, что ты умеешь?
```

Expected:

- Either no activity or minimal harmless activity.
- Timeline is not noisy.
- No research evidence or debug data is shown.

### 4. Mobile Layout

Viewport:

- 390px width or similar mobile size.

Expected:

- Activity accordion stays inside assistant bubble.
- Domain badges wrap.
- No horizontal page scroll.
- Markdown tables/code/document previews still contain their own overflow.

## Safety Checklist

- Activity labels are short.
- Activity details are summarized and truncated.
- Hidden fields such as `chain_of_thought`, `chainOfThought`, and `hidden_reasoning` are ignored by the frontend normalizer.
- Activity is separate from Sources.
- No raw evidence is displayed in normal chat.
