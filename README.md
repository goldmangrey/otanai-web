Этап 1 — Product shell

Готово.

новый sidebar
new chat
chat list
empty state
top bar
input area
login button внизу sidebar
auth modal shell без логики
Этап 2 — Firebase Auth

Готово.

AuthProvider
Google sign in
logout
auth state
guest vs signed-in mode
Этап 3 — Safe local chat model

Это теперь новый правильный этап вместо старого “Firestore chats/messages для auth users”.

Что делаем:

local guest chats
local signed-in chats тоже пока локально
разделение хранилища по режимам:
guest → local storage namespace guest
signed-in → local storage namespace по uid
chat switching
create/delete/rename chat
active chat state
draft state
last message preview
timestamps
подготовка storage adapter interface под будущее

Что не делаем:

не пишем в users/{uid}/chats/**
не пишем в users/{uid}/messages/**
не создаем profile docs
не трогаем shared prod collections

Смысл этапа:
сделать нормальную модель чатов, но полностью local-first, чтобы не сломать prod Firebase.

Этап 4 — Python backend integration

Теперь это становится главным серверным этапом.

Что делаем:

убрать моковые ответы
POST /chat
потом SSE/streaming
loading state
error state
retry
cancel / stop generation
отправка Firebase ID token на backend только для identity/auth context, если нужно
backend становится source of truth для AI-ответа
фронт не пишет chat history в shared Firebase paths

## Local dev integration

Для локального backend bridge сайт ожидает:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Chat transport contract сайта сейчас такой:

- `POST ${VITE_API_BASE_URL}/chat`
- signed-in mode: отправляет `Authorization: Bearer <firebase-id-token>`
- guest mode: может идти без Bearer token
- ожидает JSON-ответ минимум вида:

```json
{
  "assistantText": "..."
}
```

Сайт сохраняет chat UX локально и не пишет историю в shared Firebase chat paths.

Firebase роли сейчас разделены так:

- Firebase Auth user: создается самим Firebase Authentication при логине
- Firestore user/profile document: автоматически не создается
- website chat persistence: хранится локально в `localStorage`, scoped как `guest` или `user:${uid}`

Это значит, что пользователь может существовать в Authentication и одновременно не иметь документа в Firestore. Для текущего safe contract это ожидаемое поведение, а не баг.

Правильная идея тут такая:
Firebase на сайте сейчас нужен для auth, а чатовая логика и AI transport должны уходить в твой Python backend, а не в продовые mobile Firestore collections. Это намного безопаснее при текущих ограничениях. Аудит как раз показывает, что mobile chat flow и backend paths уже tightly coupled и лезть в них сайтом опасно.

Этап 5 — Safe web persistence layer

Вот этого этапа раньше не было в правильном виде, но теперь он нужен.

Цель:
если тебе потом понадобится облачная история для сайта, делать ее не в mobile prod paths, а только одним из двух безопасных путей:

Вариант A:

отдельная БД/таблицы на Python backend

Вариант B:

отдельный reviewed web-only Firebase namespace, например что-то уровня:
web_users/{uid}/...
website_chats/{uid}/...
или другой полностью изолированный namespace

Что входит:

cloud sync для сайта
web chat history
account-based restore
multi-device sync для веба
safe migration from local signed-in chats to web-only cloud storage
отдельный review перед любыми Firebase writes

Что не входит:

использование users/{uid}/chats/** из мобильного приложения
использование usage*, entitlements, memories и других mobile/backend путей

Это прямо соответствует аудиту: reuse существующих production paths опасен, а новые изолированные web-specific namespaces безопаснее.

Сейчас этот этап intentionally not implemented:

- нет approved website-only Firestore namespace для chat persistence
- нет backend endpoints для website cloud chat sync
- нет записи в `users/{uid}` или `users/{uid}/chats/**`

Этап 6 — Product polish

Старый этап 5 просто сдвигается сюда.

Что добавляем:

auto-title для чатов
streaming cursor
copy message
regenerate
stop generating
markdown rendering
code blocks
mobile adaptive sidebar
skeleton loaders
empty/error/loading polish
better composer states
scroll-to-bottom behavior
attach UI shell
nicer history UX
Итого: новый roadmap
Product shell — done
Firebase Auth — done
Safe local chat model
Python backend integration
Safe web persistence layer
Product polish
Главная логика после обновления

Теперь правило очень простое:

Firebase Auth — да
shared mobile Firestore chat paths — нет
local-first chat state — да
Python backend as chat engine — да
cloud history later only through isolated web storage — да

Это самый безопасный маршрут, потому что аудит показал, что мобильный проект уже глубоко завязан на uid-scoped prod data и backend-owned collections, и сайт туда сейчас лучше не подключать напрямую.
