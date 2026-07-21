# syntax=docker/dockerfile:1

FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

RUN addgroup -S dungeon && adduser -S dungeon -G dungeon

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server ./server
COPY sql ./sql
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=3000

USER dungeon
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1

CMD ["node", "server/index.js"]
