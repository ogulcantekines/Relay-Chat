# MERN Chat App

[![CI](https://github.com/ogulcantekines/MERN-ChatApp/actions/workflows/ci.yml/badge.svg)](https://github.com/ogulcantekines/MERN-ChatApp/actions/workflows/ci.yml)
[![Security](https://github.com/ogulcantekines/MERN-ChatApp/actions/workflows/security.yml/badge.svg)](https://github.com/ogulcantekines/MERN-ChatApp/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Real-time messaging application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO.

Users register, find each other by username or a short friend code, send friend requests, and chat in real time with typing indicators, read receipts and message editing.

## Features

**Authentication**
- Signup / login with hashed passwords (bcrypt)
- JWT stored in an httpOnly cookie
- Protected API routes via middleware

**Profile**
- Edit display name and avatar
- Change password, verified against the current one

**Friends**
- Search users by username or 4-character friend code
- Send, accept, reject and cancel friend requests
- Friend list with remove support

**Messaging**
- One-to-one conversations, persisted in MongoDB
- Real-time delivery over Socket.IO
- Typing indicators
- Read receipts
- Message editing and deletion (sender only)
- Emoji reactions
- Unread badges per conversation and in the tab title
- Search within a conversation, with matches highlighted
- Day separators and grouped consecutive messages
- Clear conversation history
- Online / offline presence

## Tech Stack

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS, daisyUI, Zustand           |
| Backend   | Node.js, Express 5, Mongoose                             |
| Realtime  | Socket.IO                                                |
| Database  | MongoDB                                                  |
| Auth      | JSON Web Tokens, bcryptjs                                |

## Quick Start with Docker

The fastest way to run the whole stack, including MongoDB:

```bash
# A secret is required; generate one and keep it out of version control
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" > .env

docker compose up --build
```

The app is then available at <http://localhost:5000>.

To stop it, and to also drop the database volume:

```bash
docker compose down     # stop
docker compose down -v  # stop and delete stored data
```

## Getting Started

If you would rather run the services directly on your machine:

### Requirements

- Node.js 18 or newer
- A MongoDB database (local instance or MongoDB Atlas)

### 1. Clone and install

```bash
git clone <repository-url>
cd MERN-ChatApp

npm install                  # backend dependencies
cd frontend && npm install   # frontend dependencies
cd ..
```

### 2. Configure environment

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

| Variable     | Description                                                        |
|--------------|--------------------------------------------------------------------|
| `PORT`       | Port the API server listens on (default `5000`)                     |
| `MONGO_URI`  | MongoDB connection string                                           |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random value                  |
| `NODE_ENV`   | `production` enables the `Secure` cookie flag (requires HTTPS)       |
| `CLIENT_URL` | Origin allowed by Socket.IO CORS (default `http://localhost:3000`)   |

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> If you use MongoDB Atlas, add your current IP address to the cluster's
> IP Access List, otherwise the server will exit with a connection error.

### 3. Run

Start the API server (terminal 1):

```bash
npm run dev
```

Start the React client (terminal 2):

```bash
npm run client
```

The client runs on <http://localhost:3000> and proxies `/api` requests to the
server on port `5000`.

### Production build

```bash
npm run build   # builds the frontend into frontend/dist
npm start       # runs the API server without nodemon
```

## Project Structure

```
backend/
  config/       environment loading
  controller/   route handlers (auth, friends, messages, conversations)
  db/           MongoDB connection
  middleware/   JWT route protection
  models/       Mongoose schemas
  routes/       Express routers
  socket/       Socket.IO server and event handlers
  utils/        token and friend-code helpers

frontend/src/
  components/   UI components (sidebar, messages, modals)
  hooks/        data fetching and socket listeners
  pages/        login, signup, home
  zustand/      client state stores
```

## API Overview

All routes below are prefixed with `/api`. Every route except signup and login
requires the authentication cookie.

### Health
| Method | Endpoint       | Description                              |
|--------|----------------|------------------------------------------|
| GET    | `/health`      | Liveness probe, no authentication needed |

### Auth
| Method | Endpoint        | Description         |
|--------|-----------------|---------------------|
| POST   | `/auth/signup`  | Create an account   |
| POST   | `/auth/login`   | Log in              |
| POST   | `/auth/logout`  | Log out             |
| GET    | `/auth/me`      | Current session user |
| PUT    | `/auth/profile` | Update name / avatar |
| PUT    | `/auth/password`| Change password     |

### Friends
| Method | Endpoint                  | Description                   |
|--------|---------------------------|-------------------------------|
| GET    | `/friends/search?query=`  | Search by username or code    |
| POST   | `/friends/send/:id`       | Send a friend request         |
| POST   | `/friends/respond`        | Accept or reject a request    |
| GET    | `/friends/list`           | List friends                  |
| GET    | `/friends/requests`       | Incoming requests             |
| GET    | `/friends/sentRequests`   | Outgoing requests             |
| DELETE | `/friends/cancel/:id`     | Cancel a sent request         |
| DELETE | `/friends/remove/:id`     | Remove a friend               |

### Messages
| Method | Endpoint             | Description                  |
|--------|----------------------|------------------------------|
| GET    | `/messages/:id`      | Conversation with a user     |
| POST   | `/messages/send/:id` | Send a message               |
| PUT    | `/messages/edit/:id` | Edit your own message        |
| DELETE | `/messages/:id`      | Delete your own message      |
| POST   | `/messages/react/:id`| Add or remove a reaction     |
| GET    | `/messages/unread/counts` | Unread count per sender |
| DELETE | `/messages/clear/:id`| Clear conversation history   |

### Conversations
| Method | Endpoint                       | Description                |
|--------|--------------------------------|----------------------------|
| GET    | `/conversations`               | List conversations         |
| GET    | `/conversations/status/:status`| Filter by status           |
| PUT    | `/conversations/accept/:id`    | Accept a message request   |

## Socket Events

| Event               | Direction        | Purpose                        |
|---------------------|------------------|--------------------------------|
| `getOnlineUsers`    | server → client  | Current online user IDs        |
| `newMessage`        | server → client  | Incoming message               |
| `messageEdited`     | server → client  | A message was edited           |
| `messageDeleted`    | server → client  | A message was deleted          |
| `messageReaction`   | server → client  | A reaction changed             |
| `messagesRead`      | server → client  | Recipient read your messages   |
| `userTyping`        | server → client  | Peer is typing                 |
| `userStoppedTyping` | server → client  | Peer stopped typing            |
| `newFriendRequest`  | server → client  | Incoming friend request        |
| `friendRequestResponse` | server → client | Your request was accepted   |
| `friendRequestRejected` | server → client | Your request was rejected   |
| `typing`            | client → server  | User started typing            |
| `stopTyping`        | client → server  | User stopped typing            |
| `chatOpened`        | client → server  | Mark messages as read          |

## Tests

An end-to-end smoke test boots the server and drives the main flows —
signup, login, friend requests, messaging, editing, deletion and profile
changes — together with the authorization and validation rules around
them. It currently runs 32 checks.

```bash
npm test            # HTTP smoke test, 36 checks
npm run test:realtime   # socket delivery, 8 checks
npm run test:all        # both
```

The real-time test connects two actual Socket.IO clients and asserts that
friend requests, messages, typing, reactions and deletions reach the other
side — the HTTP test alone cannot show that.

Both need a reachable `MONGO_URI`. They use Node's built-in fetch, so no
test framework is required.

## Continuous Integration

Every push and pull request to `main` runs three jobs:

| Job              | What it checks                                        |
|------------------|-------------------------------------------------------|
| `lint-and-build` | Frontend lints cleanly and builds                      |
| `api-test`       | Smoke and real-time tests pass against a MongoDB container |
| `docker`         | Image builds, starts and serves the health endpoint    |

A separate security workflow runs CodeQL analysis, `npm audit` on both
workspaces and a gitleaks scan over the full history, on every push and weekly on a schedule. Dependabot keeps npm, Docker and Actions versions
up to date.

## Deployment

The production image serves the built frontend and the API from a single
port, so it can run anywhere that accepts a container.

```bash
docker build -t mern-chatapp .
docker run -d -p 5000:5000   -e NODE_ENV=production   -e MONGO_URI="<your connection string>"   -e JWT_SECRET="<your secret>"   mern-chatapp
```

Behind a reverse proxy, terminate TLS there and forward to port 5000.
`NODE_ENV=production` also turns on the `Secure` cookie flag, which
requires the app to be served over HTTPS.

## Contributing

`main` stays deployable; changes land through pull requests that CI has to
pass. Branch naming, commit conventions and the local checks are described
in [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
git switch -c feat/your-change
npm run lint && npm run test:all
```

## Notes

This project was built as a learning exercise while working through the MERN
stack, so parts of the source contain explanatory comments in Turkish.

## License

MIT — see [LICENSE](LICENSE).
