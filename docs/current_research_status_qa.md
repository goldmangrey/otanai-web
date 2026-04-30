# Current Research Status QA

Phase Next 1 adds a dedicated loading-only research status line. It must use only real SSE `activity` metadata and must not rotate fake frontend steps.

## Test 1 — Normal Chat

Prompt:

```text
Привет, что ты умеешь?
```

Expected:

- normal loading text appears while waiting;
- no current research status line;
- no `Ход проверки` after done;
- no sources unless backend explicitly sends source metadata.

## Test 2 — Auto-RAG

Backend:

```env
ENABLE_AUTO_RAG=true
```

Frontend:

```env
VITE_ENABLE_SSE_CHAT=true
```

Use signed-in mode because `/v1/stream-chat` requires Firebase auth.

Prompt:

```text
Как найти своего ЧСИ, если арестовали карту Kaspi?
```

Expected during loading:

- one subtle current status line appears from real activity metadata;
- no fake rotating random steps;
- no large bordered research card;
- answer chunks can stream below it.

Expected after done:

- current status line disappears;
- `Источники · N` is visible when sources exist;
- `Ход проверки · N` is visible when final activity passes visibility rules.

## Test 3 — Table With Auto-RAG

Prompt:

```text
Сделай таблицу по теме ареста карты в Казахстане: причина блокировки, кто накладывает, где проверить, что делать.
```

Expected:

- current status appears during loading only if real activity arrives;
- final table block still renders;
- sources still work;
- final `Ход проверки · N` works when Auto-RAG activity exists;
- no layout break on mobile or desktop.

## Regression Checks

- Stop/cancel during streaming does not crash.
- Guest mode still falls back to `/chat`.
- No raw SSE JSON is displayed.
- No hidden reasoning or raw evidence fields are displayed.
