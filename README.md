# Notion Mini

Ung dung ghi chu voi Supabase Auth + Storage.

## Yeu cau moi truong

Tao file `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Database + RLS

Chay file SQL [supabase/rls.sql](supabase/rls.sql) trong Supabase SQL Editor.

Sau do tao 2 bucket Storage (Public):

- `avatars`
- `note-images`

## Chay local

```bash
npm install
npm run dev
```

## Docker

Dev:

```bash
docker compose up --build
```

Prod:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Trien khai VPS (tom tat)

- Build image (Docker) va chay `docker-compose.prod.yml`.
- Dat Nginx reverse proxy den `http://localhost:3000`.
- Dung Certbot de cap SSL cho domain.
