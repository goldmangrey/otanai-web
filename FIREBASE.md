# FIREBASE.md

## Purpose

This document is the hard safety contract for the website codebase when using the same Firebase project as the live OtanAI mobile production app.

This file is non-negotiable.

If a task conflicts with this file, this file wins.

---

## Production Safety Principle

The website is connected to the same Firebase project as the live mobile app and an existing admin web app.

Therefore:

- do not break mobile production behavior
- do not break admin behavior
- do not rename existing Firebase paths
- do not modify Firestore rules
- do not modify Storage rules
- do not introduce schema changes into shared prod collections
- do not assume checked-in rules exactly match deployed production rules
- do not write to sensitive existing collections unless explicitly approved

---

## Hard Rule: Stage 2 Scope

Stage 2 is AUTH ONLY.

Allowed in Stage 2:
- Firebase app initialization
- Firebase Auth initialization
- `onAuthStateChanged`
- Google sign-in for web
- logout
- auth loading state
- guest vs signed-in UI switching
- using Firebase Auth user object in UI

Not allowed in Stage 2:
- creating Firestore user documents
- updating Firestore profile documents
- writing chat history to Firestore
- reading existing mobile chat data
- writing message data
- writing usage data
- writing subscription/tier data
- writing any storage files
- changing Cloud Functions behavior
- changing Firestore rules
- changing Storage rules
- changing existing production collection structure

If a Stage 2 implementation needs persistence, use local component state or localStorage only.
Do not add Firestore persistence in Stage 2.

---

## Existing Production Firebase Areas: DO NOT TOUCH

The following existing Firebase namespaces are considered production-critical and must not be read/write-coupled by the website unless explicitly approved after separate review:

### High risk Firestore paths
- `users/{uid}`
- `users/{uid}/chats/{chatId}`
- `users/{uid}/chats/{chatId}/messages/{msgId}`
- `users/{uid}/memories/{memoryId}`
- `users/{uid}/usage/{date}`
- `users/{uid}/usage_daily/{dateKey}`
- `users/{uid}/usage_monthly/{monthKey}`
- `users/{uid}/dedupe/{clientMessageId}`
- `users/{uid}/entitlements`
- `prompts/{promptId}`
- `learn_courses/{courseId}`
- `ai_message_reports/{reportId}`
- `image_edit_sessions_v1/{docId}`
- `image_edit_events_v1/{docId}`
- `plan_cache_v1/{docId}`
- `jobs_v1/{jobId}`
- `cost_ledger/{docId}`
- `system_configs/cost_rules`
- `documents/{docId}`
- `document_chunks/{chunkId}`
- `document_indexes/{docId}`
- `image_gen_cache_v1/{docId}`
- `web_cache_v1/{docId}`
- `web_search_cache_v1/{docId}`
- `evidence_pack_cache_v1/{docId}`
- `visual_rag_cache_v1/{docId}`
- `rate_limits/{key}`

### Medium risk Firestore paths
- `categories/{categoryId}`
- `learn_categories/{categoryId}`
- `learn_banners/{bannerId}`

### High / medium risk Storage paths
- `users/{uid}/uploads/**`
- `avatars/{uid}.jpg`
- `prompts/**`
- `learn_banners/**`
- `learn_course_modules/**`
- `learn_course_reels/**`
- `learn_course_covers/**`

The website must not start using any of the above paths unless there is a specific approved task for that exact path.

---

## Website Firebase Safety Policy

The website must treat Firebase in this order of safety:

### Safe now
- Firebase Auth for sign-in/sign-out/auth state
- isolated website-only local state
- localStorage for guest/session UX

### Potentially safe later, but only after review
- isolated web-only Firestore namespaces created specifically for the website
- isolated web-only storage prefixes created specifically for the website

### Unsafe unless explicitly approved
- any reuse of existing mobile chat/message paths
- any reuse of billing/usage/tier/entitlement paths
- any reuse of memory/RAG/backend cache paths
- any change to rules
- any schema mutation in production collections

---

## Stage 2 Auth Rules

When implementing Stage 2 auth:

- do not create `users/{uid}` automatically on web sign-in
- do not patch `users/{uid}` automatically
- do not sync profile data into Firestore
- do not assume mobile app user document schema should be reused by web
- use Firebase Auth user object directly for:
  - display name
  - email
  - photo URL
  - UID in memory only if needed
- if profile persistence is needed later, defer it to a reviewed Stage 3+ task

---

## Existing Website Collections

The website codebase may already contain isolated website-specific collections such as:
- `webSupportRequests`
- `supportTickets`

These are not part of the mobile production schema audit.

Rules:
- do not rename them automatically
- do not migrate them automatically
- do not expand them without explicit approval
- do not use them for auth/profile/chat persistence
- leave support/admin logic untouched unless the task is specifically about support flows

---

## Forbidden Actions For Codex

Codex must NEVER do any of the following without explicit approval:

- change `firestore.rules`
- change `storage.rules`
- change Firebase project config intentionally
- rename collections
- introduce writes to `users/{uid}/chats/**`
- introduce writes to `users/{uid}/messages/**`
- introduce writes to usage/tier/entitlement paths
- create or update production prompt/course/content collections
- add storage uploads to shared prefixes
- silently “clean up” or “standardize” Firebase schema
- remove existing web support collections
- infer permissions from code usage alone

---

## Required Audit Behavior Before Any Firebase Change

Before making Firebase-related code changes, Codex must inspect the current website code and classify each Firebase touchpoint as one of:

- SAFE
- NEEDS REVIEW
- FORBIDDEN

If everything is already safe for the current stage, Codex must say so and avoid unnecessary edits.

If a fix is needed, Codex must make only the smallest safe change.

No speculative refactors.

---

## Stage 2 Acceptance Criteria

Stage 2 is considered correct only if:

- Firebase Auth works on web
- guest mode still works
- Google sign-in works
- logout works
- auth state is globally available
- sidebar/auth modal UI reacts correctly
- no Firestore rules were changed
- no Storage rules were changed
- no production mobile/admin collections were modified
- no new writes were added to existing production-critical paths

---

## If Unsure

If there is uncertainty about whether a Firebase path is safe:
- do not use it
- do not write to it
- do not modify related rules
- report the uncertainty explicitly
