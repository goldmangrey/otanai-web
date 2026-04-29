# SSE Research UX QA

## Setup

Frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_ENABLE_SSE_CHAT=true
```

Backend for Auto-RAG checks:

```env
ENABLE_AUTO_RAG=true
```

SSE currently requires signed-in mode because `/v1/stream-chat` requires a Firebase ID token. Guest mode should continue through `/chat`.

## Test 1 — Normal Chat

Prompt:

```text
Привет, что ты умеешь?
```

Expected:

- answer text streams progressively;
- no `Активность · 2`;
- no `Ход проверки`;
- no sources unless backend sends source metadata;
- copy/regenerate still work after completion.

## Test 2 — Auto-RAG With Sources

Prompt:

```text
Как найти своего ЧСИ, если арестовали карту Kaspi?
```

Expected:

- live activity can appear as `Ход проверки · N`;
- `Источники · N` appears when `source_found` events arrive;
- answer chunks stream;
- final metadata keeps sources/activity/quality;
- Sources Drawer opens and shows compact cards;
- no raw JSON, raw evidence, prompts, or hidden reasoning are visible.

## Test 3 — Table With Auto-RAG

Prompt:

```text
Сделай таблицу по теме ареста карты в Казахстане: причина блокировки, кто накладывает, где проверить, что делать.
```

Expected:

- streamed text appears progressively;
- final `metadata.blocks` table renders;
- sources still work;
- `Ход проверки` works if Auto-RAG is triggered.

## Test 4 — Abort / Stop

Start a longer request and press stop.

Expected:

- stream aborts;
- assistant message becomes cancelled/stopped;
- UI does not crash;
- no duplicate fallback answer is appended after abort.

## Test 5 — Guest Fallback

Use guest mode with `VITE_ENABLE_SSE_CHAT=true`.

Expected:

- request still succeeds through `/chat`;
- local-first chat storage still works;
- no auth-required stream error is shown to the user.
