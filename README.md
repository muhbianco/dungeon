# Dungeon Descent

RPG Roguelite (Node + React + MariaDB) com login Discord / Google.

## Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **DB:** MariaDB (host via `host.docker.internal`)
- **Auth:** Discord OAuth2 + Google OAuth2 + cookie de sessão HMAC
- **Arquitetura:** View → Controller → Service → Finder → Model

## Local

```bash
cp .env.example .env
# preencher DB_* + DISCORD_* e/ou GOOGLE_* + SESSION_SECRET
npm run install:all
npm run dev
```

Redirects locais:
- Discord: `http://localhost:5173/auth/discord/callback`
- Google: `http://localhost:5173/auth/google/callback`

No boot o servidor cria/atualiza o database + tabelas (`sql/schema.sql`).

## Deploy

```bash
./build.sh prod
```

Redirects produção:
- Discord: `https://dungeon.muhbianco.com.br/auth/discord/callback`
- Google: `https://dungeon.muhbianco.com.br/auth/google/callback`

No Portainer: preencher `DB_*`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_SERVER_ID`, `SESSION_SECRET`.

Redirect prod:
`https://dungeon.muhbianco.com.br/auth/discord/callback`
