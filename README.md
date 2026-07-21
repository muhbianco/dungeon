# Dungeon Descent

RPG Roguelite (Node + React + MariaDB).

## Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **DB:** MariaDB (host da VPS via `host.docker.internal`)
- **Arquitetura:** View → Controller → Service → Finder → Model

## Local

```bash
cp .env.example .env
# preencher DB_*
npm run install:all
npm run dev
```

No boot o servidor cria o database + tabelas automaticamente (`sql/schema.sql`).

## Deploy

```bash
./build.sh prod
```

No Portainer: colar `docker-stack.yml`, preencher `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
O usuário do MariaDB precisa de permissão para `CREATE DATABASE`.
