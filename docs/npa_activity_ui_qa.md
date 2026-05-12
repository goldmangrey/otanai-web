# NPA Activity UI QA

## Scope

R5 renders backend `assistant_activity` events as a compact user-facing activity pill and expandable panel in the chat UI. The UI must only show safe activity messages and must not display raw metadata, raw retrieval payloads, hidden reasoning, or technical backend events.

## Backend Setup

Start the backend with legal research and live fallback enabled:

```bash
APP_ENV=local ENABLE_LEGAL_RESEARCH_API=true ADILET_USE_SYSTEM_CA=true ENABLE_ADILET_LIVE_FALLBACK=true .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start the web app:

```bash
npm run dev
```

## Manual Checks

1. Ask: `объясни простыми словами основные права детей в Казахстане`

Expected:
- activity pill appears while the answer streams;
- pill text follows backend `assistant_activity` messages;
- clicking the pill opens a step list;
- final answer streams normally;
- no `semantic_enrichment_done`, `dry_run_ingestion_done`, raw JSON, or debug text appears.

2. Ask: `школа не принимает жалобу по ребенку что делать`

Expected:
- activity includes understanding, planning, source checking, composing, and verification;
- details may show selected official source title;
- no unsafe technical event is displayed.

3. Ask: `работодатель устно сказал что я уволен и не выдает приказ`

Expected:
- activity appears during legal retrieval;
- final pill remains above the answer;
- answer content continues streaming normally.

4. Ask: `напиши короткое поздравление другу`

Expected:
- no Adilet/Qdrant activity is shown;
- if activity appears, it is only generic safe understanding/completion text.

## R6 Follow-up Chips

R6 renders backend follow-ups below completed assistant answers.

Expected behavior:

- show up to five compact chips under legal/NPA answers;
- clicking a chip sends its `query` as a new user message;
- do not show chips with `safeToShow=false` or debug/raw metadata text;
- do not show legal follow-ups for non-legal answers.

Manual prompts:

1. `объясни права детей в Казахстане`

Expected chips include:
- `Разобрать права ребенка в школе`;
- `Что делать, если школа не принимает жалобу`;
- `Права ребенка при разводе родителей`.

2. `школа не принимает жалобу по ребенку что делать`

Expected chips include:
- `Составить жалобу в управление образования`;
- `Как подать обращение через eOtinish`;
- `Какие доказательства приложить`.

3. `работодатель устно сказал что я уволен`

Expected chips include:
- `Составить заявление работодателю`;
- `Какие документы запросить при увольнении`;
- `Куда жаловаться на незаконное увольнение`.

4. `напиши короткое поздравление другу`

Expected:
- no legal follow-up chips.

## R7 Conversation Context

R7 sends compact `previousAssistantContext` with the next legal request. The frontend uses the latest assistant message context from `metadata.assistantConversationContext`; it does not send raw answer text.

Manual two-turn checks:

1. First: `объясни права детей`
   Second: `а если школа не принимает жалобу?`

Expected:
- second request is understood as a school complaint about a child;
- backend metadata has `assistantContextUsed=true`;
- answer uses education/complaint-path framing.

2. First: `работодатель устно сказал что я уволен`
   Second: `составь заявление`

Expected:
- second request is understood as a labor employer statement;
- metadata includes an enriched query about requesting dismissal order/documents.

3. First: `как понять в какой суд обращаться`
   Second: `какие документы приложить?`

Expected:
- second request is understood as court claim attachments.

4. First: `я ИП на упрощенке форма 910`
   Second: `а сроки?`

Expected:
- second request is understood as form 910 deadline context.

Safety:
- context shown/sent is compact;
- no raw answer text, raw source text, raw Qdrant payload, or debug metadata is sent as context.

## R10 Production Readiness QA

Run the unified backend suite before frontend release QA:

```bash
PYTHONPATH=. .venv/bin/python scripts/run_npa_assistant_quality_suite.py \
  --mode mock \
  --out rag_sources/reports/npa_assistant_quality_suite.md \
  --json-out rag_sources/reports/npa_assistant_quality_suite.json
```

API mode against a running backend:

```bash
BACKEND_URL=http://127.0.0.1:8000 \
PYTHONPATH=. .venv/bin/python scripts/run_npa_assistant_quality_suite.py \
  --mode api \
  --allow-api-skip \
  --out rag_sources/reports/npa_assistant_quality_suite_api.md \
  --json-out rag_sources/reports/npa_assistant_quality_suite_api.json
```

Expected readiness:
- `readiness_status=ready`;
- golden live eval failed count is `0`;
- human quality eval failed count is `0`.

## Follow-up Chips QA

After each legal answer:
- chips appear under the assistant answer;
- at most five chips are visible;
- clicking a chip sends the chip `query` as the next user message;
- the next request still includes compact `previousAssistantContext`;
- chips are hidden for non-legal answers.

Regression prompts:
- `объясни права детей в Казахстане` then click `Что делать, если школа не принимает жалобу`;
- `работодатель устно сказал что я уволен` then click `Составить заявление работодателю`;
- `как понять в какой суд обращаться` then click a court-documents follow-up if shown.

## Non-Legal QA

Prompt: `напиши короткое поздравление другу`

Expected:
- answer is a greeting, not a legal/NPA answer;
- metadata has `assistantIntent=non_legal`;
- metadata has `sourceModeUsed=non_legal_bypass`;
- no legal follow-up chips;
- no Adilet/Qdrant activity rows;
- activity panel can show only generic understand/classify/plan/compose/complete states.

## Activity Panel Expected States

Legal query:
- understand/query classification;
- answer planning;
- source decision;
- Qdrant and/or Adilet only when used or explicitly skipped by legal retrieval policy;
- compose;
- verify;
- complete.

Non-legal query:
- understand;
- classify non-legal;
- plan no legal retrieval;
- compose;
- complete.

Do not display technical events such as `semantic_enrichment_done`, `dry_run_ingestion_done`, raw metadata, raw retrieval payloads, or hidden reasoning.

## Known Limitations

- R10 is QA/readiness polish; it does not expand the corpus.
- Multi-source plans mostly guide metadata, writer wording, and source hygiene; they do not force broad live search.
- Exact tax deadlines and highly current facts still require verified current official sources.
- Domain-specific writers can be expanded in later phases.

## R10.1 Site NPA Routing QA

The site should send obvious Kazakhstan legal/NPA prompts directly to the NPA Assistant route, not to legacy `/chat`.

Expected route behavior:

- legal/NPA prompt: `/v1/legal/research/stream`;
- legal stream failure: retry `/v1/legal/research/deep` once;
- legal stream/deep failure: show a safe NPA-check error;
- legal failure must not fall back to generic `/chat`;
- non-legal prompt: general chat route.

Manual prompts:

1. `Коллекторы звонят моим родственникам и угрожают. Что они имеют право делать в Казахстане и куда жаловаться?`

Expected:
- activity pill appears;
- follow-up chips appear;
- answer mentions NPA/source grounding or sources to check;
- no `Failed to fetch` followed by a generic legal answer.

2. `Застройщик задерживает сдачу квартиры по долевому участию. Что делать?`

Expected:
- NPA activity is visible;
- answer is not a generic chat answer;
- follow-ups are shown if backend returns them.

3. `Судебный исполнитель арестовал банковский счет какие права у должника?`

Expected:
- NPA route is used;
- activity and follow-ups are shown;
- answer is grounded or clearly lists sources to check.

4. `Мне отказали в социальной выплате через госуслугу. Куда жаловаться?`

Expected:
- NPA route is used;
- weak/no-main source fallback remains practical and human;
- activity panel does not show technical debug events.

5. `ИП на упрощенке пропустил срок формы 910 что делать?`

Expected:
- NPA route is used;
- exact deadlines are not invented without verified current source.

6. `Акимат не отвечает на обращение что делать?`

Expected:
- NPA route is used;
- answer gives appeal/complaint path or sources to check.

7. `напиши короткое поздравление другу`

Expected:
- general chat route is used;
- no legal activity;
- no legal follow-up chips.

Backend audit:

```bash
PYTHONPATH=. .venv/bin/python scripts/audit_site_npa_routing.py \
  --backend-url http://127.0.0.1:8000 \
  --out rag_sources/reports/site_npa_routing_audit.md \
  --json-out rag_sources/reports/site_npa_routing_audit.json
```

If the backend is not running and you only need to verify report generation:

```bash
PYTHONPATH=. .venv/bin/python scripts/audit_site_npa_routing.py \
  --allow-api-skip \
  --out rag_sources/reports/site_npa_routing_audit.md \
  --json-out rag_sources/reports/site_npa_routing_audit.json
```

## R10.2 Answer Quality QA

R10.2 focuses on whether the NPA Assistant answer is good after the site chooses the correct route.

Manual prompts and expected outcomes:

1. `Коллекторы звонят моим родственникам и угрожают. Что они имеют право делать в Казахстане и куда жаловаться?`

Expected:
- domain is collectors;
- answer is practical;
- source section names `О коллекторской деятельности` as verified or source-to-check;
- 102/police is framed for threats or danger.

2. `Застройщик задерживает сдачу квартиры по долевому участию. Какие права есть у дольщика и что делать?`

Expected:
- domain is real estate / DDU;
- answer has practical DDU sections;
- source-to-check includes `О долевом участии в жилищном строительстве`;
- Criminal Code and Labor Code are not primary sources.

3. `Судебный исполнитель арестовал банковский счет, куда поступают социальные выплаты. Что может сделать должник?`

Expected:
- domain is enforcement;
- answer asks for the bailiff order, bank statement, and proof of social payments;
- source-to-check includes enforcement law and protected-payment context.

4. `Мне отказали в социальной выплате через госуслугу. Как понять, законный ли отказ и куда жаловаться?`

Expected:
- domain is social services;
- answer requests written refusal/legal basis;
- mentions documents, eOtinish/higher body, APПК/admin court;
- not only a generic no-relevant fallback.

5. `Я ИП на упрощенке и пропустил срок сдачи формы 910. Какие риски, что проверить и что делать дальше?`

Expected:
- domain is tax;
- strategy is tax/business guide, not court path;
- no exact deadline is invented without current source;
- stale previous context is ignored if this follows a court question.

6. `Акимат не отвечает на мое обращение. Как понять, когда идти в административный суд и какие документы нужны?`

Expected:
- answer asks for proof of submission and registration number;
- source-to-check includes APПК and eOtinish/appeals;
- documents for administrative court are listed.

Audit command:

```bash
PYTHONPATH=. .venv/bin/python scripts/audit_site_npa_answer_quality.py \
  --backend-url http://127.0.0.1:8000 \
  --out rag_sources/reports/site_npa_answer_quality_audit.md \
  --json-out rag_sources/reports/site_npa_answer_quality_audit.json
```
