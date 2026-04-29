# Sources Drawer Repair QA

## Setup

Backend local env for Sources Drawer testing:

```bash
ENABLE_AUTO_RAG=true
```

Keep `ENABLE_AUTO_RAG=false` as the safe default outside local/product validation.

Run backend and frontend locally.

## Test 1: ChSI / Kaspi Sources

Prompt:

```text
Как найти своего ЧСИ, если арестовали карту Kaspi? Ответь с источниками.
```

Expected:

- Answer appears.
- Button appears under assistant answer: `Источники · N`.
- Clicking the button opens the sources drawer.
- Cards show title, domain, trust level, source type, version date, snippet when available.
- Official badge appears for `gov.kz`, `adilet.zan.kz`, `egov.kz`, `kgd.gov.kz`, and other official KZ domains.
- No raw evidence dump or hidden reasoning is shown.

## Test 2: Business / Tax Sources

Prompt:

```text
Как закрыть ИП в Казахстане?
```

Expected:

- If Auto-RAG triggers and citations exist, `Источники · N` appears.
- Drawer cards open without horizontal overflow.

## Test 3: Casual Chat

Prompt:

```text
Привет, что ты умеешь?
```

Expected:

- No Sources button appears.
- Normal answer flow remains unchanged.

## Test 4: Mobile Width

Set viewport to mobile width.

Expected:

- Drawer opens as a bottom sheet/modal.
- Close button remains visible.
- Source cards and links wrap.
- No page-level horizontal overflow.
