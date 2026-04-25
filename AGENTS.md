# ThreadHive Backend — Agent Guide

A Reddit-style ("subreddits", "threads", "comments", "votes") REST API built with Express 5 + Mongoose. ES modules, no TypeScript.

## Commands

| Task | Command |
|------|---------|
| Run dev server (nodemon) | `npm run dev` |
| Run prod server | `npm start` |
| Run tests (vitest) | `npm test` |
| Seed database | `npm run populate` |
| Format (prettier) | `npm run format` |

Requires a `.env` file — see [.env.example](.env.example) (`MONGODB_URI`, `JWT_SECRET`).

## Architecture

Strict layering — keep responsibilities in the right place:

```
routes/  →  controllers/  →  services/  →  models/
```

- [src/app.js](src/app.js) — Express app: helmet, rate-limit, cors, json, mounts routers under `/api/*`, ends with `errorHandler`.
- [main.js](main.js) → [server.js](server.js) + [db.js](db.js) — entrypoint connects Mongo, then starts listener.
- **Routes** ([src/routes/](src/routes/)) — only wire HTTP verbs to controllers and apply [authHandler](src/middleware/authHandler.js). No logic.
- **Controllers** ([src/controllers/](src/controllers/)) — parse `req`, call services, shape the response. Always respond with the standard envelope (see below).
- **Services** ([src/services/](src/services/)) — all business logic and Mongoose queries. Throw via `createAppError` on failure.
- **Models** ([src/models/](src/models/)) — Mongoose schemas. Vote-related fields (`upvotes`, `downvotes`, `voteCount`, `upvotedBy`, `downvotedBy`) live on `Thread` and `Comment`.

## Project Conventions

- **ES modules everywhere.** `"type": "module"` in [package.json](package.json) — always use `import`/`export` and include the `.js` extension in relative imports.
- **Response envelope** — controllers respond with `{ success, message, data }`. Match this shape.
- **Error handling** — never `try/catch` just to send a response. Throw `createAppError(message, statusCode)` from [src/utils/createAppError.js](src/utils/createAppError.js); Express 5 forwards async throws to [src/middleware/errorHandler.js](src/middleware/errorHandler.js), which formats `{ success: false, message, stack? }`.
- **Auth** — protect routes by adding `authHandler` to the route definition. It populates `req.user = { userId }`; controllers should read `req.user.userId` (not `req.user.id`).
- **Validation** — required-field checks live in the controller; deeper invariants (existence, ownership) live in the service. Both throw `createAppError`.
- **Route mounting** — most routers mount on a noun (`/api/threads`); votes are special and mount on `/api` because their paths are `/threads/:id/upvote` etc. (see [src/routes/votes.js](src/routes/votes.js)).
- **Formatting** — prettier defaults; run `npm run format` before committing.

## Pitfalls

- Don't introduce a global async wrapper — Express 5 already forwards rejected promises. Just `throw createAppError(...)`.
- Don't import models only where needed; [src/app.js](src/app.js) eagerly imports `Thread`, `Subreddit`, `User` to register schemas before routes load. Add new models there if they're referenced by `populate()`.
- `vitest` + `supertest` + `mongodb-memory-server` are installed and ready. Place tests next to the unit (`*.test.js`) and use an in-memory Mongo for integration.
- The `resources/` folder is for human use only.
