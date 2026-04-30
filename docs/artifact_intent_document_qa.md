# Artifact Intent Document QA

Manual QA for document-intent routing and A4 DocumentPreview safety.

## Should Render A4 DocumentPreview

Prompt:

```text
скинь мне пример заявление на рассторжение договора аренды
```

Expected:

- response has a short normal intro;
- document body renders as A4 DocumentPreview, not a code block;
- copy document action copies only the document body;
- `metadata.artifactIntent.document_preview_allowed` is `true`.

Prompt:

```text
дай образец заявления на расторжение договора аренды
```

Expected:

- A4 DocumentPreview renders for the statement body;
- normal explanation stays outside the preview.

Prompt:

```text
как написать заявление ЧСИ о снятии ареста
```

Expected:

- A4 DocumentPreview renders for the statement body;
- placeholders such as `[ФИО]`, `[ИИН]`, and `[дата] are highlighted.

Prompt:

```text
мне нужен шаблон претензии застройщику
```

Expected:

- A4 DocumentPreview renders for the pretension/template body;
- no sources or citations appear inside the document block.

## Should Not Render A4 DocumentPreview

Prompt:

```text
Проведи глубокое исследование: как проверить надежность застройщика в Казахстане перед покупкой квартиры в строящемся ЖК. Нужны официальные источники, признаки риска, что проверить по БИН и когда лучше не подписывать договор.
```

Expected:

- normal markdown/research answer;
- sources and activity render when available;
- no whole white A4 block;
- `metadata.artifactIntent.document_preview_allowed` is `false`.

Prompt:

```text
какие риски в договоре аренды
```

Expected:

- normal explanation;
- no A4 DocumentPreview.

Prompt:

```text
как проверить договор перед подписанием
```

Expected:

- normal checklist/explanation;
- no A4 DocumentPreview.

## DevTools Check

For `/chat`, inspect the JSON response:

```text
metadata.artifactIntent.document_preview_allowed
metadata.artifactIntent.primary_intent
metadata.artifactIntent.document_kind
metadata.artifactIntent.matched_signals
```

For `/v1/stream-chat`, inspect the `meta` and `done` SSE events. The final rendered message should follow `done.payload.metadata.artifactIntent`.
