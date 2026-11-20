# Doomsday Ready Server

## Overview

Doomsday Ready is a movie rewatch planning and cinema booking platform with the tagline **Plan Your Rewatch. Book Your Premiere.**

This repository contains the backend REST API. It manages the movie library, prerequisite graph, rewatch ordering, cinema bundle sizes, booking quotes, and persisted bookings. The core feature logic is hand-written in `src/app/utils/graph.ts` and `src/app/utils/bundle.ts`; no external solver library is used.

The API is built with Express, TypeScript, Prisma, and PostgreSQL. Requests are validated with Zod, errors are normalized by a global error handler, and logs are produced with Winston.

## Technologies Used

- Express 5 — HTTP routing, middleware, and API server.
- TypeScript 7 — static typing for routes, controllers, services, and validation.
- Prisma 7 — type-safe database access and migrations.
- PostgreSQL — relational storage for movies, cinemas, prerequisites, and bookings.
- Zod 4 — request body, query, and environment validation.
- Winston — structured application logging.
- Helmet — security response headers.
- CORS — controlled frontend access.
- express-rate-limit — basic rate limiting.
- tsup — production server bundling.
- tsx — running automated node tests directly from TypeScript.
- Biome — formatting and linting.

## Main Features

- Movie library with unique titles, release years, runtime validation, watched state, and prerequisite links.
- Cycle-safe prerequisite updates with `409 CIRCULAR_DEPENDENCY` when a dependency loop is detected.
- Rewatch order generation that returns every prerequisite once, excludes the target movie, and follows topological order.
- Rewatch progress summary with watched count, total prerequisites, and remaining runtime for unwatched movies.
- Cinema management with unique names and 1–10 unique bundle sizes between 1 and 500 seats.
- Booking quote calculation for group sizes 1–10000 using the fewest exact bundle combination.
- Explicit impossible booking result when no exact bundle combination exists.
- Persisted bookings created as `CONFIRMED`, with cancel and delete operations.
- Booking quote snapshots stored with each booking so historical records remain accurate even if cinema bundles change.
- Cascade deletion of bookings when a cinema is deleted.
- Normalized success and error response envelopes with stable error codes.
- Request validation, rate limiting, security headers, CORS configuration, and centralized logging.
- Automated tests for graph ordering, cycle detection, and minimum-bundle calculation.
- No image upload or image-field support; the API and data model are intentionally text/data focused.

## Dependencies

| Package | Version | Purpose |
|---|---:|---|
| `@prisma/adapter-pg` | `^7.10.1` | Prisma PostgreSQL adapter |
| `@prisma/client` | `7` | Generated type-safe database client |
| `compression` | `^1.8.2` | Response compression middleware |
| `cors` | `^2.8.6` | Cross-origin request handling |
| `dotenv` | `^18.0.8` | Environment variable loading |
| `express` | `^5.3.0` | HTTP server and routing |
| `express-rate-limit` | `^8.7.1` | Rate limiting middleware |
| `helmet` | `^8.3.0` | Security response headers |
| `http-status` | `^2.1.0` | Named HTTP status codes |
| `pg` | `^8.23.1` | PostgreSQL client |
| `winston` | `^3.19.0` | Application logging |
| `zod` | `^4.6.7` | Schema validation |

## Development Dependencies

| Package | Version | Purpose |
|---|---:|---|
| `@biomejs/biome` | `^2.5.15` | Formatting and linting |
| `@types/compression` | `^1.8.1` | Compression TypeScript types |
| `@types/cors` | `^2.8.19` | CORS TypeScript types |
| `@types/express` | `^5.0.6` | Express TypeScript types |
| `@types/node` | `^26.6.5` | Node.js TypeScript types |
| `@types/pg` | `^8.23.1` | PostgreSQL TypeScript types |
| `prisma` | `^7.10.1` | CLI for generate, migrate, deploy, and studio |
| `tsup` | `^9.0.0` | Production bundler |
| `tsx` | `^4.23.15` | TypeScript test runner |
| `typescript` | `^7.0.2` | TypeScript compiler |

## Project Structure

| Path | Purpose |
|---|---|
| `src/server.ts` | App bootstrap, middleware setup, and server startup |
| `src/app/config` | Validated environment configuration |
| `src/app/middlewares` | Validation, error handling, and request middleware |
| `src/app/modules/movies` | Movie routes, controllers, services, validation, and types |
| `src/app/modules/cinemas` | Cinema routes, controllers, services, validation, and types |
| `src/app/modules/bookings` | Booking routes, controllers, services, and types |
| `src/app/utils/graph.ts` | Prerequisite traversal, rewatch ordering, and cycle checks |
| `src/app/utils/bundle.ts` | Minimum-bundle quote calculation |
| `src/app/utils/*.test.ts` | Automated tests for core hand-written logic |
| `prisma/schema` | Prisma models for movies, cinemas, and bookings |
| `prisma/migrations` | Database migration history |
| `prisma/seed` | Demo movie, cinema, and prerequisite seed data |
| `postman` | Postman collection for API testing |

## API Reference

All application endpoints are prefixed with `/api`.

### Movies

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/movies` | Create a movie with prerequisites |
| GET | `/api/movies` | List movies |
| PATCH | `/api/movies/:id` | Update movie fields, watched state, or prerequisites |
| DELETE | `/api/movies/:id` | Delete a movie and clean up prerequisite links |
| GET | `/api/movies/:id/rewatch-order` | Get ordered prerequisites and progress summary |

Example create body:

```json
{
  "title": "Iron Man",
  "releaseYear": 2008,
  "runtimeMinutes": 126,
  "watched": true,
  "prerequisiteIds": []
}
```

### Cinemas

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/cinemas` | Create a cinema with bundle sizes |
| GET | `/api/cinemas` | List cinemas |
| PATCH | `/api/cinemas/:id` | Update cinema name and/or bundle sizes |
| DELETE | `/api/cinemas/:id` | Delete a cinema and its bookings |

Example create body:

```json
{
  "name": "Cineplex Downtown",
  "bundleSizes": [2, 5, 10]
}
```

`PATCH /api/cinemas/:id` accepts a partial JSON body with `name`, `bundleSizes`, or both. At least one field is required.

### Bookings

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/cinemas/:id/booking?groupSize=6` | Get a booking quote for a cinema and group size |
| POST | `/api/cinemas/:id/booking` | Confirm and persist a booking |
| GET | `/api/bookings` | List bookings |
| PATCH | `/api/bookings/:id/cancel` | Cancel a booking |
| DELETE | `/api/bookings/:id` | Delete a booking |

Example confirm body:

```json
{
  "groupSize": 6
}
```

`GET /health` is available for health checks.

### Response Format

Successful responses use:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Movies fetched successfully.",
  "data": []
}
```

Error responses use:

```json
{
  "success": false,
  "statusCode": 409,
  "code": "CIRCULAR_DEPENDENCY",
  "message": "Circular dependency detected."
}
```

Important error codes include `VALIDATION_ERROR`, `NOT_FOUND`, `CIRCULAR_DEPENDENCY`, `BOOKING_NOT_POSSIBLE`, and `INTERNAL_SERVER_ERROR`.

## How to Run the Project Locally

Prerequisites:

- Bun installed locally.
- PostgreSQL available through `DATABASE_URL`.

```bash
bun install
cp .env.example .env
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
```

On Windows PowerShell:

```powershell
bun install
Copy-Item .env.example .env
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
```

The API runs at `http://localhost:5000/api`, and `GET /health` is available at `http://localhost:5000/health`.

The demo seed adds 8 movies with prerequisite links and 3 cinemas with bundle sizes. It is manual by default; set `SEED_ON_START=true` only when you want it to run on boot. Re-running the seed resets demo movie watched states, demo prerequisite links, and demo cinema bundle sizes.

## Environment Variables (from .env.example)

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/doomsdayready` |
| `PORT` | Yes | Port used by the API | `5000` |
| `NODE_ENV` | Yes | Runtime mode | `development` |
| `API_PREFIX` | Yes | Base path for all API routes | `/api` |
| `FRONTEND_URL` | Yes | Allowed frontend origin for CORS | `http://localhost:3000` |
| `TRUST_PROXY` | Yes | Number of trusted reverse proxies | `0` |
| `SEED_ON_START` | No | Creates demo data on boot | `false` |

Do not commit real `.env` values. Use `.env.example` as the template and keep secrets local or in the deployment platform environment settings.

## Docker Compose

From the workspace root containing both `doomsday-ready-client` and `doomsday-ready-server`:

```bash
docker compose up --build
```

This starts PostgreSQL, the API, and the client. The API applies migrations, seeds demo data, and serves at `http://localhost:5000/api`; the client serves at `http://localhost:3000`.

The backend-only `docker-compose.yml` inside this folder starts PostgreSQL and the API only.

## Useful Commands

| Command | Description |
|---|---|
| `bun run dev` | Starts the API with watch mode |
| `bun run build` | Builds the production bundle with tsup |
| `bun run start` | Runs the built production bundle |
| `bun run typecheck` | Runs TypeScript type checking |
| `bun run test` | Runs automated tests for graph and bundle logic |
| `bun run db:generate` | Generates the Prisma client |
| `bun run db:migrate` | Applies migrations in development |
| `bun run db:deploy` | Applies migrations in production |
| `bun run db:seed` | Seeds demo data |
| `bun run db:studio` | Opens Prisma Studio |
| `bun run format:check` | Checks source formatting |
| `bun run format:fix` | Formats source files |
| `bun run lint:check` | Checks lint rules |
| `bun run lint:fix` | Applies automatic lint fixes |

## Automated Tests

`bun run test` runs Node tests through `tsx`. Current coverage includes:

- Minimum-bundle calculation for one-size, two-size, and three-size examples.
- Explicit impossible booking results.
- Rewatch order with each prerequisite included once in valid topological order.
- Empty rewatch order for a movie with no prerequisites.
- Indirect cycle rejection.
- Self-dependency rejection.
- Independent movie relationships allowed.

## Relevant Links

- Live client: https://doomsday-ready-client.vercel.app
- Live API: https://doomsday-ready-server.vercel.app/api
- Postman collection: https://documenter.getpostman.com/view/59636503/2sBYHbtcid
- Client repository: https://github.com/mdashraful24/doomsday-ready-client.git
- Server repository: https://github.com/mdashraful24/doomsday-ready-server.git

## Assumptions

- `API_PREFIX` is `/api` to match the assessment exactly; no version suffix is used.
- Release year is validated as 1888–2100, using 1888 as the first practical film year.
- Runtime is validated as 1–300 minutes, as specified.
- Movie titles and cinema names are limited to 200 characters.
- IDs are UUID strings. Prerequisite IDs may be sent as a JSON array or a comma-separated string.
- `watched` defaults to `false`; it may be set on create or changed with `PATCH /movies/:id`.
- An impossible booking quote is a successful request with `possible: false` and a clear message.
- Confirming an impossible booking returns `409 BOOKING_NOT_POSSIBLE`; the quote remains the authoritative UI check for “not possible”.
- Booking bundles are stored as an exact snapshot; cancelled bookings stay in the list until deleted.
- Error responses include `code` and `statusCode` so clients can handle `CIRCULAR_DEPENDENCY` and `BOOKING_NOT_POSSIBLE` reliably.
- Removed or changed prerequisites are validated before any write. Direct concurrent updates are not serialized by a database-level cycle constraint.
- Image upload fields are intentionally excluded from endpoints, validation, services, and the Prisma data model.

## Data Model

```mermaid
erDiagram
  MOVIES ||--o{ MOVIE_PREREQUISITES : "movie"
  MOVIES ||--o{ MOVIE_PREREQUISITES : "prerequisite"
  CINEMAS ||--o{ CINEMA_BUNDLE_SIZES : "sells"
  CINEMAS ||--o{ BOOKINGS : "receives"

  MOVIES {
    string id PK
    string title UK
    int releaseYear
    int runtimeMinutes
    boolean watched
    datetime createdAt
    datetime updatedAt
  }

  MOVIE_PREREQUISITES {
    string movieId PK, FK
    string prerequisiteId PK, FK
  }

  CINEMAS {
    string id PK
    string name UK
    datetime createdAt
    datetime updatedAt
  }

  CINEMA_BUNDLE_SIZES {
    string cinemaId PK, FK
    int seatCount PK
  }

  BOOKINGS {
    string id PK
    string cinemaId FK
    int groupSize
    int totalBundles
    json bundles
    string status
    datetime createdAt
    datetime updatedAt
  }
```
