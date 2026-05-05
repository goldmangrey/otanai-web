# Grouped Research Activity QA

## Normal Chat

Prompt:

```text
Привет, что ты умеешь?
```

Expected:

- no research activity block;
- no source drawer unless backend sends sources;
- no fake `Активность · 2`.

## Medium Auto-RAG

Prompt:

```text
Что делать если ЧСИ арестовал зарплатную карту и списал деньги?
```

Expected:

- `Ход проверки · N` is visible after backend sends activity;
- activity opens as grouped sections, not one long wall;
- sections can include `Планирование`, `Поиск источников`, `Проверка покрытия`, `Качество ответа`, `Формирование ответа`;
- Sources Drawer shows source summary if `metadata.sourceSelection` exists;
- source cards remain compact and clickable.

## High Real Estate Safety

Prompt:

```text
Проведи глубокое исследование: как проверить надежность застройщика в Казахстане перед покупкой квартиры в строящемся ЖК. Нужны официальные источники, признаки риска, что проверить по БИН и когда лучше не подписывать договор.
```

Expected:

- `Источники · N` may be more than 5 if backend selected more cited sources;
- Sources Drawer shows counts: found/reviewed/used/shown/official;
- sources are grouped into official, bank/registry, or additional groups;
- `Ход проверки` or `Ход исследования` opens grouped activity;
- warnings/gaps appear under `Пробелы и риски`;
- no raw JSON, raw evidence, stack trace, or hidden reasoning markers;
- DocumentPreview does not take over the answer;
- TableBlock still renders if a table block exists.

## Mobile

Expected:

- drawer opens as bottom sheet;
- grouped sections do not overflow horizontally;
- long domains/source IDs wrap safely;
- activity groups remain readable without a giant flat timeline.
