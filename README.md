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
mysql -u root -p < sql/schema.sql   # após CREATE DATABASE dungeon_descent
npm run install:all
npm run dev
```

## Deploy

```bash
./build.sh prod
```

No Portainer: colar `docker-stack.yml`, preencher `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
