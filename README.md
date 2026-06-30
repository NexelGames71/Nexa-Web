# Nexa AI Platform (Web)

Public marketing site + Nexa Chat workspace, wired to the same APIs and Appwrite backend as `C:\Nexa\frontend`.

## Quick start

```bash
cd "C:\Nexa Web"
npm install
npm run dev
```

Copy env from the main project if needed:

```bash
copy C:\Nexa\frontend\.env.local.example .env.local
```

Required:

- `NEXT_PUBLIC_API_URL` — Nexa Python API (default `http://127.0.0.1:8000`)
- `NEXT_PUBLIC_APPWRITE_*` and server `APPWRITE_*` keys for chat, memory, and admin

Start the backend from `C:\Nexa`:

```bash
uvicorn api:app --reload --port 8000
```

## Routes

| Area | Paths |
|------|--------|
| Marketing | `/`, `/features`, `/pricing`, `/models`, `/enterprise`, `/api`, `/developers`, `/research`, `/blog`, `/careers`, `/about`, `/contact`, `/security`, `/privacy`, `/terms`, `/browser` |
| Auth | `/login`, `/signup`, `/forgot-password`, `/verify-email` |
| App | `/chat` (main workspace), `/explore`, `/create`, `/settings/*`, `/memory`, `/library`, `/voice`, `/workspace`, `/tasks` |
| Admin | `/admin`, `/admin/users`, `/admin/models`, `/admin/analytics`, `/admin/billing`, `/admin/support`, `/admin/training` |

Legacy `/auth` redirects to `/login`.

## APIs (Next.js → backend)

All route handlers under `app/api/` proxy or implement:

- Chat streaming — `/api/chat`
- Conversations — `/api/conversations`
- Memory — `/api/memory`
- Data controls — `/api/data-controls`
- UI config — `/api/ui-config` → `NEXT_PUBLIC_API_URL/ui-config`

Assets are linked from `C:\Nexa\assets` via junction at `assets/`.
