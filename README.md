# Nexa AI Platform (Web)

Public marketing site plus the Nexa Chat workspace, wired to the same Nexa API runtime as `C:\Nexa`.

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

- `NEXT_PUBLIC_API_URL` - Nexa Python API. Use `https://api.trynexa-ai.com` in production and `http://127.0.0.1:8000` for local-only development.
- `NEXA_IMAGE_API_URL` - unified Nexa API for image routes. Keep this the same as `NEXT_PUBLIC_API_URL`.
- `NEXT_PUBLIC_NEXA_IDENTITY_URL` and `NEXA_IDENTITY_URL` - central Nexa Identity service for login, sessions, admin checks, and token verification.
- `NEXT_PUBLIC_APPWRITE_*` and server `APPWRITE_*` keys only for legacy collections that have not been moved yet.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, and server-only `SUPABASE_SERVICE_ROLE_KEY` for billing subscriptions, payments, and plan usage.
- Admin accounts are identified by email local-part prefix: `admin.name@example.com`.
- `trynexa-ai.com/admin` is allowed to load the admin route, but only `admin.*@...` accounts can stay there.
- Set `NEXA_ADMIN_HOSTS` only when you want to override the allowed admin hosts.

Start the backend from `C:\Nexa`:

```bash
.\start_backend.ps1
```

## Stable model API tunnel

Do not use a temporary `trycloudflare.com` URL in Vercel. Create a Cloudflare named tunnel route for the API and keep Vercel pointed at the stable hostname:

- Frontend site: `trynexa-ai.com` / `www.trynexa-ai.com`
- Model API: `api.trynexa-ai.com`
- Cloudflare tunnel service for `api.trynexa-ai.com`: `http://127.0.0.1:8000`
- Vercel env:
  - `NEXT_PUBLIC_API_URL=https://api.trynexa-ai.com`
  - `NEXA_IMAGE_API_URL=https://api.trynexa-ai.com`

If you use Cloudflare's local config file instead of the dashboard, the ingress should look like:

```yaml
tunnel: nexa-api
credentials-file: C:\Users\sdami\.cloudflared\nexa-api.json

ingress:
  - hostname: api.trynexa-ai.com
    service: http://127.0.0.1:8000
  - service: http_status:404
```

## Routes

| Area | Paths |
|------|-------|
| Marketing | `/`, `/features`, `/pricing`, `/models`, `/enterprise`, `/api`, `/developers`, `/research`, `/blog`, `/careers`, `/about`, `/contact`, `/security`, `/privacy`, `/terms`, `/browser` |
| Auth | `/login`, `/signup`, `/forgot-password`, `/verify-email` |
| App | `/chat` (main workspace), `/explore`, `/create`, `/settings/*`, `/memory`, `/library`, `/voice`, `/workspace`, `/tasks` |
| Admin | `/admin`, `/admin/users`, `/admin/models`, `/admin/analytics`, `/admin/billing`, `/admin/support`, `/admin/training` only when the deployment enables admin routes and the signed-in account email starts with `admin.` |

Legacy `/auth` redirects to `/login`.

## Supabase billing data

Nexa is moving quota-sensitive billing data off Appwrite so billing pages do not fail when Appwrite read limits are reached. Nexa Identity is the auth source for products, backed by Supabase Postgres through Prisma. Apply the SQL migration in `supabase/migrations/202607160001_nexa_billing_usage.sql`, then set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
NEXT_PUBLIC_NEXA_IDENTITY_URL=https://identity.trynexa-ai.com
NEXA_IDENTITY_URL=https://identity.trynexa-ai.com
```

When these values are present, billing subscriptions, payments, and plan usage are read from Supabase. Authentication and token verification go through Nexa Identity. Chat history, memory, images, promotions, and some admin datasets remain on legacy collections until those modules are migrated.

## APIs (Next.js to backend)

All route handlers under `app/api/` proxy or implement:

- Chat streaming - `/api/chat`
- Conversations - `/api/conversations`
- Memory - `/api/memory`
- Data controls - `/api/data-controls`
- UI config - `/api/ui-config` to `NEXT_PUBLIC_API_URL/ui-config`

Assets are linked from `C:\Nexa\assets` via junction at `assets/`.


 npm.cmd run dev:clean
