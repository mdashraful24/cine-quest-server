# CineQuest API

Backend API scaffold for CineQuest, structured after the SafePath server.

## Main Technologies

- Bun and Node.js
- TypeScript
- Express 5
- PostgreSQL
- Prisma ORM
- Zod
- Winston

## Run Locally

```bash
bun install
copy .env.example .env
bun run db:generate
bun run db:migrate
bun run dev
```

The API base URL is controlled by `API_PREFIX` (default `/api`). The health check is served at `/health`.

## Useful Commands

```bash
bun run typecheck
bun run build
bun run format:check
bun run lint:check
```

Schema models and feature modules are intentionally left empty; infrastructure code is implemented.
