# Doomsday Ready API Integration Guide

## Purpose

This document describes how to integrate with the Doomsday Ready backend API. It covers base URLs, request and response conventions, endpoint contracts, payload shapes, error handling, and a recommended integration sequence.

The API exposes all assessment features: movie and prerequisite management, rewatch ordering, cinema bundle configuration, booking quotes, and persistent bookings.

## Base URLs

| Environment | Base URL |
|---|---|
| Local | `http://localhost:5000/api` |
| Production | `https://doomsday-ready-server.vercel.app/api` |

Health check:

```http
GET /health
```

Local health URL: `http://localhost:5000/health`

The health endpoint is not under `/api`. It returns:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doomsday Ready API is running.",
  "data": {
    "uptime": 123
  }
}
```

## Client Configuration

Set the frontend API base URL through `VITE_API_BASE_URL`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production:

```env
VITE_API_BASE_URL=https://doomsday-ready-server.vercel.app/api
```

The server reads its own prefix from `API_PREFIX`, which defaults to `/api`. If the prefix changes, every client base URL must be updated to match.

## Global Conventions

- All application endpoints use JSON request and response bodies.
- `Content-Type: application/json` is required for requests with a body.
- Request bodies are limited to 1 MB.
- IDs are UUID strings.
- No authentication token is required.
- CORS allows the origin configured in `FRONTEND_URL` and enables credentials.
- Rate limiting allows 1000 requests per 15 minutes per client.
- Security headers are applied with Helmet.
- The `x-powered-by` header is disabled.

## Response Envelope

Successful responses use:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Movies fetched successfully.",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

`meta` is only returned by paginated list endpoints such as `GET /api/movies`.

Error responses use:

```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Title is required.",
  "errorDetails": {
    "name": "AppError",
    "statusCode": 400,
    "code": "VALIDATION_ERROR",
    "stack": null,
    "prismaErrorCode": null
  }
}
```

`stack` is only included when `NODE_ENV=development`.

## Error Codes

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Request body or query failed schema validation |
| `NOT_FOUND` | Requested movie, cinema, or booking does not exist |
| `CIRCULAR_DEPENDENCY` | Prerequisite update would create a cycle |
| `BOOKING_NOT_POSSIBLE` | No exact bundle combination exists for the group size |
| `RATE_LIMITED` | Too many requests within the rate-limit window |
| `INTERNAL_SERVER_ERROR` | Unexpected server failure |

## Endpoint Reference

### Movies

#### `POST /api/movies`

Creates a movie and its prerequisite links.

Request body:

```json
{
  "title": "Iron Man",
  "releaseYear": 2008,
  "runtimeMinutes": 126,
  "watched": true,
  "prerequisiteIds": []
}
```

Validation rules:

- `title`: required string, max 200 characters.
- `releaseYear`: integer from 1888 to 2100.
- `runtimeMinutes`: integer from 1 to 300.
- `watched`: optional boolean, defaults to `false`.
- `prerequisiteIds`: optional array of UUIDs, defaults to `[]`.

Response data:

```json
{
  "id": "uuid",
  "title": "Iron Man",
  "releaseYear": 2008,
  "runtimeMinutes": 126,
  "watched": true,
  "createdAt": "2026-11-20T00:00:00.000Z",
  "updatedAt": "2026-11-20T00:00:00.000Z",
  "prerequisiteIds": []
}
```

#### `GET /api/movies`

Lists movies with optional filtering and pagination.

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Optional title search, max 200 characters |
| `watched` | `true` or `false` | Filters by watched state |
| `page` | integer | Page number, defaults to `1` |
| `limit` | integer | Page size from 1 to 100, defaults to `20` |

Example:

```http
GET /api/movies?limit=100
```

The response `data` is an array of movie objects. Pagination details are returned in `meta`.

#### `PATCH /api/movies/:id`

Updates one or more movie fields.

Request body:

```json
{
  "watched": true,
  "prerequisiteIds": ["uuid-of-prerequisite-movie"]
}
```

Rules:

- At least one field is required.
- The same validation rules as create apply to provided fields.
- Prerequisite updates are checked for cycles before writing.
- A cycle returns `409 CIRCULAR_DEPENDENCY`.

#### `DELETE /api/movies/:id`

Deletes a movie and removes prerequisite links where the movie is referenced.

Response data usually contains the deleted movie identifier.

#### `GET /api/movies/:id/rewatch-order`

Returns the rewatch plan for a target movie.

Response data:

```json
{
  "target": {
    "id": "uuid",
    "title": "Avengers: Doomsday"
  },
  "movies": [
    {
      "id": "uuid",
      "title": "Iron Man",
      "releaseYear": 2008,
      "runtimeMinutes": 126,
      "watched": true
    }
  ],
  "totalCount": 7,
  "watchedCount": 3,
  "unwatchedTotalRuntimeMinutes": 420
}
```

Notes:

- The target movie is excluded from `movies`.
- Each prerequisite appears exactly once.
- Prerequisites are returned in topological order.
- Watched progress is calculated only over returned prerequisites.

### Cinemas

#### `POST /api/cinemas`

Creates a cinema with its bundle sizes.

Request body:

```json
{
  "name": "Cineplex Downtown",
  "bundleSizes": [2, 5, 10]
}
```

Validation rules:

- `name`: required string, max 200 characters, unique.
- `bundleSizes`: 1–10 unique integers from 1 to 500.

Response data:

```json
{
  "id": "uuid",
  "name": "Cineplex Downtown",
  "bundleSizes": [2, 5, 10],
  "createdAt": "2026-11-20T00:00:00.000Z",
  "updatedAt": "2026-11-20T00:00:00.000Z"
}
```

#### `GET /api/cinemas`

Lists all cinemas.

Response `data` is an array of cinema objects.

#### `PATCH /api/cinemas/:id`

Updates the cinema name, bundle sizes, or both.

Request body:

```json
{
  "name": "Cineplex Downtown Main",
  "bundleSizes": [2, 5, 10, 20]
}
```

Rules:

- Body must contain at least one of `name` or `bundleSizes`.
- The same validation rules as create apply to provided fields.
- The request is JSON only; no multipart form data is used.

#### `DELETE /api/cinemas/:id`

Deletes a cinema and all bookings linked to it through database cascade.

#### `GET /api/cinemas/:id/booking?groupSize=6`

Calculates an exact booking quote using the fewest bundles.

Query parameters:

| Parameter | Type | Required | Range |
|---|---|---|---|
| `groupSize` | integer | Yes | 1–10000 |

Possible response data:

```json
{
  "cinemaId": "uuid",
  "cinemaName": "Cineplex Downtown",
  "possible": true,
  "groupSize": 11,
  "totalBundles": 4,
  "bundles": [
    {
      "size": 5,
      "quantity": 1
    },
    {
      "size": 2,
      "quantity": 3
    }
  ]
}
```

Impossible quote response:

```json
{
  "cinemaId": "uuid",
  "cinemaName": "Cineplex Downtown",
  "possible": false,
  "groupSize": 7,
  "totalBundles": 0,
  "bundles": [],
  "message": "No exact bundle combination is possible for this group size."
}
```

An impossible quote is still a successful `200 OK` response. Consumers should check `data.possible`, not only the HTTP status.

### Bookings

#### `POST /api/cinemas/:id/booking`

Confirms and persists a booking for the cinema.

Request body:

```json
{
  "groupSize": 11
}
```

Response data:

```json
{
  "id": "uuid",
  "cinemaId": "uuid",
  "cinemaName": "Cineplex Downtown",
  "groupSize": 11,
  "totalBundles": 4,
  "bundles": [
    {
      "size": 5,
      "quantity": 1
    },
    {
      "size": 2,
      "quantity": 3
    }
  ],
  "status": "CONFIRMED",
  "createdAt": "2026-11-20T00:00:00.000Z",
  "updatedAt": "2026-11-20T00:00:00.000Z"
}
```

If the group size cannot be fulfilled exactly, the API returns `409 BOOKING_NOT_POSSIBLE`.

#### `GET /api/bookings`

Lists persisted bookings.

Response `data` is an array of booking objects.

#### `PATCH /api/bookings/:id/cancel`

Marks a booking as `CANCELLED` and returns the updated booking.

#### `DELETE /api/bookings/:id`

Deletes a booking and returns the deleted booking object.

## Data Contracts

### Movie

```ts
type Movie = {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
  prerequisiteIds: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Cinema

```ts
type Cinema = {
  id: string;
  name: string;
  bundleSizes: number[];
  createdAt: string;
  updatedAt: string;
};
```

### Bundle Selection

```ts
type BundleSelection = {
  size: number;
  quantity: number;
};
```

### Booking

```ts
type Booking = {
  id: string;
  cinemaId: string;
  cinemaName: string;
  groupSize: number;
  totalBundles: number;
  bundles: BundleSelection[];
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};
```

### Rewatch Order

```ts
type RewatchOrder = {
  target: {
    id: string;
    title: string;
  };
  movies: Array<{
    id: string;
    title: string;
    releaseYear: number;
    runtimeMinutes: number;
    watched: boolean;
  }>;
  totalCount: number;
  watchedCount: number;
  unwatchedTotalRuntimeMinutes: number;
};
```

## Recommended Integration Sequence

1. Call `GET /health` to verify the API is reachable.
2. Call `GET /api/movies` to load the movie library.
3. Create movies with `POST /api/movies`; supply prerequisite IDs when needed.
4. Select a target movie and call `GET /api/movies/:id/rewatch-order`.
5. Call `GET /api/cinemas` to load available bundle configurations.
6. Call `GET /api/cinemas/:id/booking?groupSize=N` before confirming a booking.
7. Only call `POST /api/cinemas/:id/booking` when `possible` is `true`.
8. Call `GET /api/bookings` to display persisted bookings.
9. Use `PATCH /api/bookings/:id/cancel` to cancel a booking.
10. Use `DELETE /api/bookings/:id` to remove a booking permanently.

## curl Examples

Create a movie:

```bash
curl -X POST http://localhost:5000/api/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Iron Man","releaseYear":2008,"runtimeMinutes":126,"watched":true,"prerequisiteIds":[]}'
```

Get a booking quote:

```bash
curl "http://localhost:5000/api/cinemas/CINEMA_ID/booking?groupSize=11"
```

Confirm a booking:

```bash
curl -X POST http://localhost:5000/api/cinemas/CINEMA_ID/booking \
  -H "Content-Type: application/json" \
  -d '{"groupSize":11}'
```

## Postman

Use the published Postman collection to run the full API flow:

https://documenter.getpostman.com/view/59636503/2sBYHbtcid

A local collection is also available at `postman/CineQuest.postman_collection.json`.

## Verification Commands

```bash
bun run typecheck
bun run test
bun run format:check
bun run lint:check
bun run build
```

The automated tests cover the two hand-written core algorithms:

- Rewatch order and cycle detection in `src/app/utils/graph.ts`.
- Exact minimum-bundle calculation in `src/app/utils/bundle.ts`.

## Integration Notes

- Movie list responses include pagination metadata; cinema and booking list responses do not.
- `GET /api/movies?limit=100` is suitable for loading the full demo library into a client.
- Booking snapshots are stored at confirmation time, so later cinema changes do not rewrite historical bookings.
- Cancelled bookings remain in the list until deleted.
- No image upload or file upload endpoint exists; all payloads are JSON.
- The impossible quote response uses `success: true` with `data.possible: false`.
- Error handling should use `message` for display and `code` for branch logic.
