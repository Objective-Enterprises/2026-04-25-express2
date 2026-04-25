# ThreadHive Backend

A Reddit-style REST API for community-driven discussion built with **Express 5**, **MongoDB**, and **Mongoose**. ThreadHive lets users register, create topical communities ("subreddits"), post threads, comment, and vote on content.

---

## Overview

ThreadHive is a backend service that powers a Reddit-style discussion platform. It exposes a JSON REST API that any frontend (web or mobile) can consume to provide:

- User authentication
- Community (subreddit) management
- Threaded discussions
- Comments
- Upvote / downvote engagement

It is designed as a clean, well-layered Node.js backend suitable for learning, portfolio use, or as a starting point for a larger product.

---

## Features

- JWT-based user registration and login with hashed passwords (bcrypt)
- Create and browse subreddits (communities)
- Create, read, update, and delete threads scoped to a subreddit
- Add and fetch comments on threads
- Upvote / downvote threads and comments with vote tracking per user
- Standardized JSON response envelope (`{ success, message, data }`)
- Centralized error handling via `createAppError` + global error middleware
- Security hardening: `helmet`, `cors`, and IP-based rate limiting
- Database seeding script for local development
- Integration tests with `vitest`, `supertest`, and `mongodb-memory-server`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 8 |
| Auth | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| Security | Helmet, CORS, `express-rate-limit` |
| Config | `dotenv` |
| Testing | Vitest, Supertest, `mongodb-memory-server` |
| Dev Tooling | Nodemon, Prettier |

---

## Architecture

The project follows a strict layered architecture. Each layer has a single responsibility:

```
HTTP Request
    │
    ▼
routes/         ── wire HTTP verbs to controllers, apply auth middleware
    │
    ▼
controllers/    ── parse req, call services, shape JSON response
    │
    ▼
services/       ── business logic & Mongoose queries (throw AppError on failure)
    │
    ▼
models/         ── Mongoose schemas (User, Subreddit, Thread, Comment)
    │
    ▼
MongoDB
```

Cross-cutting concerns:

- **`middleware/authHandler.js`** — Verifies JWT and attaches `req.user = { userId }`.
- **`middleware/errorHandler.js`** — Express 5 forwards thrown async errors here; formats `{ success: false, message }`.
- **`utils/createAppError.js`** — Helper to throw HTTP-aware errors with a status code.

The entry point [main.js](main.js) connects to MongoDB via [db.js](db.js), then starts the HTTP listener via [server.js](server.js), which boots the app defined in [src/app.js](src/app.js).

---

## Project Structure

```
.
├── main.js                  # App entry point (loads env, connects DB, starts server)
├── server.js                # HTTP server lifecycle (start/stop)
├── db.js                    # MongoDB connect/disconnect helpers
├── src/
│   ├── app.js               # Express app, middleware, route mounting
│   ├── routes/              # Route definitions (auth, threads, subreddits, comments, votes)
│   ├── controllers/         # Request handlers, response shaping
│   ├── services/            # Business logic and DB access
│   ├── models/              # Mongoose schemas (User, Subreddit, Thread, Comment)
│   ├── middleware/          # authHandler, errorHandler
│   ├── utils/               # createAppError
│   └── scripts/             # populate_db.js, seed-data.js
├── tests/                   # Vitest + Supertest integration tests
├── .env.example             # Sample environment config
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (ES modules / Express 5)
- **MongoDB** running locally, or a MongoDB Atlas connection string
- **npm** (bundled with Node.js)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
# Then edit .env and set MONGODB_URI and JWT_SECRET
```

### Environment Variables

Defined in `.env` (see [.env.example](.env.example)):

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/threadhive` |
| `PORT` | HTTP port the server listens on | `5000` |
| `JWT_SECRET` | Secret used to sign JWT auth tokens | `change-me-in-production` |
| `NODE_ENV` | Runtime environment | `development` / `production` |

### Running the App

```bash
# Development (auto-reload via nodemon)
npm run dev

# Production
npm start

# Seed the database with sample data
npm run populate

# Run tests
npm test

# Watch mode
npm run test:watch

# Format the codebase
npm run format
```

Server listens on `http://localhost:${PORT}` (default `3000` if `PORT` is not set).

---

## API Endpoints

All endpoints return the standard envelope:

```json
{ "success": true, "message": "...", "data": { } }
```

Authenticated routes require an `Authorization: Bearer <jwt>` header obtained via `/api/auth/login`.

### Auth — `/api/auth`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/register` | Register a new user (`name`, `email`, `password`) | No |
| POST | `/login` | Log in and receive a JWT | No |

### Subreddits — `/api/subreddits`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/` | List all subreddits | Yes |
| POST | `/` | Create a new subreddit (`name`, `description`) | Yes |
| GET | `/:id` | Get a subreddit and its threads | Yes |

### Threads — `/api/threads`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/` | List all threads | Yes |
| GET | `/:id` | Get a thread by ID | Yes |
| POST | `/` | Create a thread (`title`, `content`, `subreddit`) | Yes |
| PUT | `/:id` | Update a thread (author only) | Yes |
| DELETE | `/:id` | Delete a thread (author only) | Yes |

### Comments — `/api/comments`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/thread/:threadId` | List comments on a thread | Yes |
| POST | `/` | Add a comment (`thread`, `content`) | Yes |

### Votes — `/api`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/threads/:id/upvote` | Upvote a thread (toggle) | Yes |
| POST | `/threads/:id/downvote` | Downvote a thread (toggle) | Yes |
| POST | `/comments/:id/upvote` | Upvote a comment (toggle) | Yes |
| POST | `/comments/:id/downvote` | Downvote a comment (toggle) | Yes |

---

## Data Models

- **User** — `name`, `email` (unique), `password` (hashed)
- **Subreddit** — `name` (unique), `description`, `author`
- **Thread** — `title`, `content`, `author`, `subreddit`, `upvotes`, `downvotes`, `voteCount`, `upvotedBy[]`, `downvotedBy[]`
- **Comment** — `thread`, `user`, `content`, `voteCount`, `upvotedBy[]`, `downvotedBy[]`

All models include `createdAt` / `updatedAt` timestamps.

---

## Testing

Tests live alongside the unit (`*.test.js`) or under `tests/`. The suite uses an in-memory MongoDB so it does not require a running database.

```bash
npm test                # run once
npm run test:watch      # watch mode
npm run test:threads    # only thread tests
```

---

## Conventions

- **ES modules everywhere** — `import` / `export` with explicit `.js` extensions on relative imports.
- **Response envelope** — controllers always respond with `{ success, message, data }`.
- **Error handling** — throw `createAppError(message, statusCode)` from anywhere; the global error middleware formats the response. Avoid `try/catch` purely to send error responses.
- **Auth context** — controllers read the authenticated user via `req.user.userId`.

---

## Screenshots

_No screenshots yet — this project is a backend API. Pair it with a frontend or test endpoints with Postman / curl._

---

## License

Released under the [MIT License](LICENSE).
